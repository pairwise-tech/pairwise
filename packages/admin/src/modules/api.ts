import {
  CourseList,
  Err,
  Ok,
  Result,
  CourseSkeletonList,
} from "@pairwise/common";
import axios, { AxiosError, AxiosResponse } from "axios";
import * as ENV from "tools/admin-env";
import {
  getAccessTokenFromLocalStorage,
  logoutUserInLocalStorage,
} from "tools/storage-utils";
import toaster from "tools/toast-utils";
import { wait, mapCourseSkeletonInDev } from "tools/admin-utils";
import { UserStoreState } from "./admin/store";
import { AdminUserView } from "./users/store";
import { ProgressRecords } from "./stats/store";
import { FeedbackRecord } from "./feedback/store";
import { PaymentRecord } from "./payments/store";
import { PullRequestContext } from "./challenges/store";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

/**
 * Create a consistent type for failed requests.
 */
export interface HttpResponseError {
  message: string;
  status?: number;
  statusText?: string;
}

type MaybeFailedResponse = Result<any, HttpResponseError>;

const HOST = ENV.HOST; /* NestJS Server URL */

/**
 * A helper to create HttpResponseError type Err objects for localStorage
 * API methods to preserve consistent type checking with the API methods
 * which return real HTTP errors.
 */
const createNonHttpResponseError = (
  message: string,
): Err<HttpResponseError> => {
  return new Err({ status: 418, message }); /* ha */
};

/** ===========================================================================
 * Base API Class
 * ---------------------------------------------------------------------------
 * Base API class with shared utility methods.
 * ============================================================================
 */

class BaseApiClass {
  httpHandler = async <X extends {}>(
    httpFn: () => Promise<AxiosResponse<X>>,
  ) => {
    try {
      const result = await httpFn();
      return new Ok(result.data);
    } catch (err) {
      return this.handleHttpError(err);
    }
  };

  getRequestHeaders = () => {
    const token = getAccessTokenFromLocalStorage();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const authenticated = !!token;
    return { headers, authenticated };
  };

  formatHttpError = (error: AxiosError): HttpResponseError => {
    if (error.response) {
      const { data } = error.response;
      const message = data.message || error.message;
      const status = data.status || error.response.status;
      const statusText = data.error || error.response.statusText;

      return {
        message,
        status,
        statusText,
      };
    } else {
      // Should not happen - types issue with AxiosResponse...
      return {
        status: 400,
        statusText: "Request Failed",
        message: "Request Failed",
      };
    }
  };

  handleHttpError = (err: any) => {
    const formattedError = this.formatHttpError(err);

    if (formattedError.status === 401) {
      this.handleForcedLogout();
    }

    return new Err(formattedError);
  };

  handleForcedLogout = async () => {
    /**
     * Remove the local access token and force the window to reload to handle
     * forced logout:
     *
     * TODO: This works easily but it would be nice to surface this error
     * higher up to then just update the application state correctly and
     * avoid a forced reload. The forced reload is a little jarring. The
     * logic to do this already exists, it would just require moving this
     * error handling higher up into the epics layer. Then again, logout
     * should RARELY occur, so... blegh.
     */
    toaster.error("Unauthorized!", { icon: "user" });
    logoutUserInLocalStorage();
    await wait(1500); /* Wait so they can read the message... */

    window.location.reload();
  };
}

/** ===========================================================================
 * HTTP API Utility Class
 * ----------------------------------------------------------------------------
 * This class provides methods to fetch data from all REST APIs and provides
 * standardized responses using the Result<Data, Error> approach.
 *
 * - All code related to actually dispatching HTTP requests is in this file.
 * - No errors are thrown from here! Only descriptive Result objects which
 *   are then handled by the calling code with perfect type safety. Boom!
 * ============================================================================
 */

class Api extends BaseApiClass {
  fetchCourses = async (): Promise<Result<CourseList, HttpResponseError>> => {
    try {
      let courses: CourseList;
      if (ENV.DEV) {
        // eslint-disable-next-line
        const courseList = require("@pairwise/common").default;
        // NOTE: Hard-coded to only show the FullstackTypeScript Course
        courses = [courseList.FullstackTypeScript];
        // courses = Object.values(courseList);
      } else {
        const { headers } = this.getRequestHeaders();
        const result = await axios.get<CourseList>(`${HOST}/admin/content`, {
          headers,
        });
        courses = result.data;
      }

      return new Ok(courses);
    } catch (err) {
      return this.handleHttpError(err);
    }
  };

  fetchCourseSkeletons = async () => {
    if (ENV.DEV) {
      // eslint-disable-next-line
      const courseMap = require("@pairwise/common").default;
      // NOTE: Hard-coded to only show the FullstackTypeScript Course
      const courses: CourseSkeletonList = [courseMap.FullstackTypeScript];
      // const courses: CourseSkeletonList = [courseMap.FullstackTypeScript];
      const courseSkeletonList = courses.map(mapCourseSkeletonInDev);
      return new Ok(courseSkeletonList);
    }

    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<CourseSkeletonList>(`${HOST}/content/skeletons`, {
        headers,
      });
    });
  };

  adminUserLogin = async () => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<CourseSkeletonList>(`${HOST}/admin/authenticate`, {
        headers,
      });
    });
  };

  fetchUsersList = async () => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<AdminUserView[]>(`${HOST}/admin/users`, {
        headers,
      });
    });
  };

  fetchProgressRecords = async () => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<ProgressRecords>(`${HOST}/admin/progress`, {
        headers,
      });
    });
  };

  fetchAllFeedbackRecords = async () => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<FeedbackRecord[]>(`${HOST}/admin/feedback`, {
        headers,
      });
    });
  };

  deleteFeedbackByUuid = async (uuid: string) => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.delete<string>(`${HOST}/admin/feedback/${uuid}`, {
        headers,
      });
    });
  };

  fetchAllPaymentRecords = async () => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<PaymentRecord[]>(`${HOST}/admin/payments`, {
        headers,
      });
    });
  };

  giftCourseForUser = async (userEmail: string) => {
    return this.httpHandler(async () => {
      // Course id is hard-coded for now
      const body = { userEmail, courseId: "fpvPtfu7s" };
      const { headers } = this.getRequestHeaders();
      return axios.post<string>(`${HOST}/admin/purchase-course`, body, {
        headers,
      });
    });
  };

  refundCourseForUser = async (userEmail: string) => {
    return this.httpHandler(async () => {
      // Course id is hard-coded for now
      const body = { userEmail, courseId: "fpvPtfu7s" };
      const { headers } = this.getRequestHeaders();
      return axios.post<string>(`${HOST}/admin/refund-course`, body, {
        headers,
      });
    });
  };

  fetchUserProfile = async () => {
    const { headers, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.get<UserStoreState>(`${HOST}/user/profile`, {
          headers,
        });
      });
    } else {
      return createNonHttpResponseError("Unauthorized.");
    }
  };

  fetchPullRequestContext = async (pull: number) => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<PullRequestContext>(
        `${HOST}/admin/pull-requests/${pull}`,
        {
          headers,
        },
      );
    });
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const API = new Api();

export default API;
