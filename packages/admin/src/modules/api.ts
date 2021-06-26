import {
  CourseList,
  Err,
  Ok,
  Result,
  ChallengeMeta,
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
    const config = { headers };
    return { config, authenticated };
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

  /**
   * Remove the local access token and force the window to reload to handle
   * forced logout:
   **/
  handleForcedLogout = async () => {
    const currentAccessToken = getAccessTokenFromLocalStorage();

    // Only display if the token is not removed already, to prevent multiple
    // messages
    if (currentAccessToken !== "") {
      toaster.error("Unauthorized!", { icon: "user" });
      logoutUserInLocalStorage();
      await wait(1000);
      window.location.reload();
    }
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
        const { config } = this.getRequestHeaders();
        const result = await axios.get<CourseList>(
          `${HOST}/admin/content`,
          config,
        );
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
      const courses: CourseSkeletonList = Object.values(courseMap);
      const courseSkeletonList = courses.map(mapCourseSkeletonInDev);
      return new Ok(courseSkeletonList);
    }

    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<CourseSkeletonList>(`${HOST}/content/skeletons`, config);
    });
  };

  adminUserLogin = async () => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<CourseSkeletonList>(
        `${HOST}/admin/authenticate`,
        config,
      );
    });
  };

  fetchUsersList = async () => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<AdminUserView[]>(`${HOST}/admin/users`, config);
    });
  };

  fetchProgressRecords = async () => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<ProgressRecords>(`${HOST}/admin/progress`, config);
    });
  };

  fetchAllFeedbackRecords = async () => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<FeedbackRecord[]>(`${HOST}/admin/feedback`, config);
    });
  };

  deleteFeedbackByUuid = async (uuid: string) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.delete<string>(`${HOST}/admin/feedback/${uuid}`, config);
    });
  };

  fetchChallengeMeta = async (id: string) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<ChallengeMeta>(`${HOST}/challenge-meta/${id}`, config);
    });
  };

  fetchAllPaymentRecords = async () => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<PaymentRecord[]>(`${HOST}/admin/payments`, config);
    });
  };

  giftCourseForUser = async (userEmail: string) => {
    return this.httpHandler(async () => {
      // Course id is hard-coded for now
      const body = { userEmail, courseId: "fpvPtfu7s" };
      const { config } = this.getRequestHeaders();
      return axios.post<string>(`${HOST}/admin/purchase-course`, body, config);
    });
  };

  refundCourseForUser = async (userEmail: string) => {
    return this.httpHandler(async () => {
      // Course id is hard-coded for now
      const body = { userEmail, courseId: "fpvPtfu7s" };
      const { config } = this.getRequestHeaders();
      return axios.post<string>(`${HOST}/admin/refund-course`, body, config);
    });
  };

  fetchUserProfile = async () => {
    const { config, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.get<UserStoreState>(`${HOST}/user/profile`, config);
      });
    } else {
      return createNonHttpResponseError("Unauthorized.");
    }
  };

  fetchPullRequestContext = async (pull: number) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<PullRequestContext[]>(
        `${HOST}/admin/pull-requests/${pull}`,
        config,
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
