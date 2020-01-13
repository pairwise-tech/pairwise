import {
  Course,
  CourseList,
  Err,
  IUserDto,
  Ok,
  Result,
  UserCourseProgress,
  UserUpdateOptions,
  IFeedbackDto,
  IProgressDto,
  ICodeBlobDto,
  CourseSkeletonList,
  ProgressEntity,
} from "@pairwise/common";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Observable } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { map, switchMap } from "rxjs/operators";
import * as ENV from "tools/client-env";
import {
  getAccessTokenFromLocalStorage,
  logoutUserInLocalStorage,
} from "tools/storage-utils";
import { AppToaster } from "tools/constants";
import { wait } from "tools/utils";

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

    const authenticated = !!token;
    return { headers, authenticated };
  };

  formatHttpError = (error: AxiosError): HttpResponseError => {
    return {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    };
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
     */
    AppToaster.show({
      icon: "user",
      intent: "danger",
      message: "Your session has expired, please login again.",
    });

    logoutUserInLocalStorage();
    await wait(2000); /* Wait so they can read the message... */

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
        /* NOTE: I hard-coded the courseId in the request for now! */
        const { headers } = this.getRequestHeaders();
        const result = await axios.get<Course>(
          `${HOST}/content/course/fpvPtfu7s`,
          {
            headers,
          },
        );
        course = result.data;
      }

      return new Ok(course);
    } catch (err) {
      return this.handleHttpError(err);
    }
  };

  fetchCourseSkeletons = async () => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<CourseSkeletonList>(`${HOST}/content/skeletons`, {
        headers,
      });
    });
  };

  fetchUserProfile = async () => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<IUserDto>(`${HOST}/user/profile`, {
        headers,
      });
    });
  };

  updateUser = async (userDetails: UserUpdateOptions) => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.post<IUserDto>(`${HOST}/user/profile`, userDetails, {
        headers,
      });
    });
  };

  submitUserFeedback = async (feedback: IFeedbackDto) => {
    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.post<"Success">(`${HOST}/feedback`, {
        headers,
        body: feedback,
      });
    });
  };

  fetchUserProgress = async () => {
    const { headers, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.get<UserCourseProgress>(`${HOST}/progress`, {
          headers,
        });
      });
    } else {
      const result = localStorageHTTP.fetchUserProgress();
      return new Ok(result);
    }
  };

  updateUserProgress = async (progress: IProgressDto) => {
    const { headers, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.post<IProgressDto>(`${HOST}/progress`, {
          headers,
          body: progress,
        });
      });
    } else {
      const result = localStorageHTTP.updateUserProgress(progress);
      return new Ok(result);
    }
  };

  fetchChallengeHistory = async (challengeId: string) => {
    const { headers, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.get<ICodeBlobDto>(`${HOST}/blob/${challengeId}`, {
          headers,
        });
      });
    } else {
      const result = localStorageHTTP.fetchChallengeHistory(challengeId);
      return new Ok(result);
    }
  };

  updateChallengeHistory = async (
    challengeId: string,
    dataBlob: ICodeBlobDto,
  ) => {
    const { headers, authenticated } = this.getRequestHeaders();
    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.post<ICodeBlobDto>(`${HOST}/blob`, {
          headers,
          body: {
            dataBlob,
            challengeId,
          },
        });
      });
    } else {
      const result = localStorageHTTP.updateChallengeHistory(dataBlob);
      return new Ok(result);
    }
  };
}

/** ===========================================================================
 * Local Storage API
 * ----------------------------------------------------------------------------
 * Class which provides local storage APIs which mock the same behavior of the
 * backend REST APIs.
 * ============================================================================
 */

enum KEYS {
  USER_PROGRESS_KEY = "USER_PROGRESS_KEY",
  CHALLENGE_BLOB_KEY = "CHALLENGE_BLOB_KEY",
}

class LocalStorageHttpClass {
  getItem = <T extends {}>(key: KEYS, defaultValue: T): T => {
    try {
      const result = localStorage.getItem(key);
      if (result) {
        const parsed = JSON.parse(result);
        if (parsed) {
          return parsed;
        }
      }

      return defaultValue;
    } catch (err) {
      return defaultValue;
    }
  };

  setItem = (key: KEYS, value: any) => {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  };

  fetchUserProgress = (): UserCourseProgress => {
    return this.getItem<UserCourseProgress>(KEYS.USER_PROGRESS_KEY, []);
  };

  updateUserProgress = (progress: IProgressDto) => {
    const { courseId, challengeId } = progress;

    const progressList = this.fetchUserProgress();
    const existingCourseProgress = progressList.find(
      p => p.courseId === courseId,
    );

    let updatedProgress: ProgressEntity;

    if (existingCourseProgress) {
      updatedProgress = {
        courseId,
        progress: {
          ...existingCourseProgress.progress,
          [challengeId]: { complete: true },
        },
      };
    } else {
      updatedProgress = {
        courseId,
        progress: {
          [challengeId]: { complete: true },
        },
      };
    }

    const updatedProgressList = progressList.map(p => {
      if (p.courseId === progress.courseId) {
        return updatedProgress;
      } else {
        return p;
      }
    });

    this.setItem(KEYS.USER_PROGRESS_KEY, updatedProgressList);
  };

  fetchChallengeHistory = (challengeId: string): ICodeBlobDto => {
    const blobs = this.getItem<{ [key: string]: ICodeBlobDto }>(
      KEYS.CHALLENGE_BLOB_KEY,
      {},
    );

    if (challengeId in blobs) {
      return blobs[challengeId];
    } else {
      throw new Error("404!");
    }
  };

  updateChallengeHistory = (blob: ICodeBlobDto) => {
    const blobs = this.fetchUserProgress();
    const updatedBlobs = {
      ...blobs,
      [blob.challengeId]: blob,
    };
    this.setItem(KEYS.CHALLENGE_BLOB_KEY, updatedBlobs);
  };

  persistUserProgressForNewAccount = async () => {
    /* TODO: Implement this */
  };

  persistChallengeHistoryForNewAccount = async () => {
    /* TODO: Implement this */
  };
}

const localStorageHTTP = new LocalStorageHttpClass();

/** ===========================================================================
 * Export
 * ============================================================================
 */

const API = new Api();

export default API;
