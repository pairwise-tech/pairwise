import {
  Course,
  CourseList,
  Err,
  IUserCodeBlobDto,
  IUserCourseProgressDto,
  IUserDto,
  Ok,
  Result,
  UserCourseStatus,
  UserUpdateOptions,
} from "@pairwise/common";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Observable } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { map, switchMap } from "rxjs/operators";
import * as ENV from "tools/client-env";
import { getAccessTokenFromLocalStorage } from "tools/utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

export interface HttpResponseError {
  message: string;
  status?: number;
  statusText?: string;
}

const HOST = ENV.HOST; /* NestJS Server URL */

/** ===========================================================================
 * Codepress API
 * ============================================================================
 */
interface CodepressAPI {
  getAll: () => Observable<CourseList>;
  save: (c: Course) => Observable<any>;
}

export const makeCodepressApi = (endpoint: string): CodepressAPI => {
  return {
    getAll: () => {
      return fromFetch(`${endpoint}/courses`, { mode: "cors" }).pipe(
        switchMap((response: any) => response.json()),
        map((x: any) => x.data),
      );
    },
    save: (c: Course) => {
      return fromFetch(`${endpoint}/courses`, {
        mode: "cors",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(c),
      }).pipe(switchMap((response: any) => response.json()));
    },
  };
};

/** ===========================================================================
 * Base API Class
 * ---------------------------------------------------------------------------
 * Base class with shared utility methods.
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
    return headers;
  };

  formatHttpError = (error: AxiosError): HttpResponseError => {
    return {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };
  };

  handleHttpError = (err: any) => {
    return new Err(this.formatHttpError(err));
  };
}

/** ===========================================================================
 * HTTP API Utility Class
 * ----------------------------------------------------------------------------
 * This class provides methods to fetch data from all REST APIs and provides
 * standardized responses using the Result<Data, Error> approach.
 *
 * - All code related to actually dispatching HTTP requests is in this file.
 * - No error are thrown from here! Only descriptive Result objects which
 *   are then handled by the calling code.
 * ============================================================================
 */

class Api extends BaseApiClass {
  codepressApi = makeCodepressApi(ENV.CODEPRESS_HOST);

  fetchChallenges = async (): Promise<Result<Course, HttpResponseError>> => {
    try {
      let course: Course;

      if (ENV.PRODUCTION) {
        /* TODO: Remove after deploying a server */
        const challenges = require("@pairwise/common").default;
        course = challenges.FullstackTypeScript;
      } else if (ENV.DEV_MODE) {
        // TODO: This is not great code, it's just that we're in the middle of a big refactor. In the future, we should standardize a few things, including:
        // - How we do async. I.e. Observables, Promises, fetch, axios, lots of redundancy
        // - Arrays of things (CourseList) vs things themselves (Course)
        course = await this.codepressApi
          .getAll()
          .pipe(map(x => x[0]))
          .toPromise();
      } else {
        const headers = this.getRequestHeaders();
        const result = await axios.get<Course>(`${HOST}/challenges`, {
          headers,
        });
        course = result.data;
      }

      return new Ok(course);
    } catch (err) {
      return this.handleHttpError(err);
    }
  };

  fetchCourseSkeletons = async () => {
    return this.httpHandler(async () => {
      const headers = this.getRequestHeaders();
      return axios.get<IUserDto>(`${HOST}/challenges/skeletons`, {
        headers,
      });
    });
  };

  fetchUserProfile = async () => {
    return this.httpHandler(async () => {
      const headers = this.getRequestHeaders();
      return axios.get<IUserDto>(`${HOST}/user/profile`, {
        headers,
      });
    });
  };

  updateUser = async (userDetails: UserUpdateOptions) => {
    return this.httpHandler(async () => {
      const headers = this.getRequestHeaders();
      return axios.post<IUserDto>(`${HOST}/user/profile`, userDetails, {
        headers,
      });
    });
  };

  fetchUserProgress = async () => {
    return this.httpHandler(async () => {
      const headers = this.getRequestHeaders();
      return axios.get<UserCourseStatus>(`${HOST}/progress`, {
        headers,
      });
    });
  };

  updateUserProgress = async (progress: IUserCourseProgressDto) => {
    return this.httpHandler(async () => {
      const headers = this.getRequestHeaders();
      return axios.post<IUserCourseProgressDto>(`${HOST}/progress`, {
        headers,
        body: progress,
      });
    });
  };

  fetchChallengeHistory = async (challengeId: string) => {
    return this.httpHandler(async () => {
      const headers = this.getRequestHeaders();
      return axios.get<IUserCodeBlobDto>(
        `${HOST}/progress/challenge/${challengeId}`,
        {
          headers,
        },
      );
    });
  };

  updateChallengeHistory = async (challengeId: string, dataBlob: string) => {
    return this.httpHandler(async () => {
      const headers = this.getRequestHeaders();
      return axios.post<IUserCodeBlobDto>(`${HOST}/progress/challenge`, {
        headers,
        body: {
          dataBlob,
          challengeId,
        },
      });
    });
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const API = new Api();

export default API;
