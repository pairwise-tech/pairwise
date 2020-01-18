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
  CodeBlobBulk,
  UserSettings,
  UserProgressMap,
  defaultUserSettings,
} from "@pairwise/common";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Observable } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { map, switchMap } from "rxjs/operators";
import * as ENV from "tools/client-env";
import {
  getAccessTokenFromLocalStorage,
  logoutUserInLocalStorage,
  saveSandboxToLocalStorage,
  getSandboxFromLocalStorage,
} from "tools/storage-utils";
import { AppToaster } from "tools/constants";
import { wait } from "tools/utils";
import { UserStoreState } from "./user/store";

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
 * Codepress API
 * ============================================================================
 */
interface CodepressAPI {
  getAll: () => Observable<CourseList>;
  getSkeletons: () => Observable<CourseSkeletonList>;
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
    getSkeletons: () => {
      return fromFetch(`${endpoint}/skeletons`, { mode: "cors" }).pipe(
        switchMap((response: Response) => response.json()),
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
  codepressApi = makeCodepressApi(ENV.CODEPRESS_HOST);

  fetchChallenges = async (): Promise<Result<Course, HttpResponseError>> => {
    try {
      let course: Course;

      if (ENV.PRODUCTION) {
        /* TODO: Remove after deploying a server */
        const challenges = require("@pairwise/common").default;
        course = challenges.FullstackTypeScript;
      } else if (ENV.DEV_MODE) {
        /**
         * TODO: Make this code more consistent with the other API methods.
         */
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
    if (ENV.PRODUCTION) {
      /* TODO: Remove after deploying a server */
      const challenges = require("@pairwise/common").default;
      const FullstackTypeScript: Course = challenges.FullstackTypeScript;
      const course = {
        ...FullstackTypeScript,
        modules: FullstackTypeScript.modules.map(m => {
          return {
            ...m,
            free: true,
            userCanAccess: true,
            challenges: m.challenges.map(c => {
              return {
                ...c,
                userCanAccess: true,
              };
            }),
          };
        }),
      };
      return new Ok([course]);
    } else if (ENV.DEV_MODE) {
      /**
       * TODO: Make this code more consistent with the other API methods.
       */
      return this.codepressApi
        .getSkeletons()
        .pipe(map(Ok.of))
        .toPromise();
    }

    return this.httpHandler(async () => {
      const { headers } = this.getRequestHeaders();
      return axios.get<CourseSkeletonList>(`${HOST}/content/skeletons`, {
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
      /**
       * If the user is not authenticated we construct a partial user result,
       * because we are still storing user progress and settings locally for
       * unauthenticated users.
       *
       * The global Redux store state for the user includes this unified
       * definition, which works in both cases.
       */
      const progress = localStorageHTTP.fetchUserProgressMap();
      const settings: UserSettings = localStorageHTTP.fetchUserSettings();

      const preAccountUser: UserStoreState = {
        settings,
        progress,
        profile: null,
        courses: null,
        payments: null,
      };

      return new Ok(preAccountUser);
    }
  };

  /**
   * NOTE: User settings are just part of the user object and are updated
   * with the POST /user/profile API. This helper is a convenience method
   * to make it easier to update user settings from the client application,
   * since these are functionally/conceptually separated from the rest of the
   * user profile/object.
   */
  updateUserSettings = async (settings: UserSettings) => {
    const { authenticated } = this.getRequestHeaders();
    if (authenticated) {
      return this.updateUser({ settings });
    } else {
      return localStorageHTTP.updateUserSettings(settings);
    }
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
      return axios.post<"Success">(`${HOST}/feedback`, feedback, {
        headers,
      });
    });
  };

  fetchUserProgress = async (): Promise<
    Result<UserCourseProgress, HttpResponseError>
  > => {
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

  updateUserProgress = async (
    progress: IProgressDto,
  ): Promise<Result<IProgressDto, HttpResponseError>> => {
    const { headers, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.post<IProgressDto>(`${HOST}/progress`, progress, {
          headers,
        });
      });
    } else {
      const result = localStorageHTTP.updateUserProgress(progress);
      return new Ok(result);
    }
  };

  fetchChallengeHistory = async (
    challengeId: string,
  ): Promise<Result<ICodeBlobDto, HttpResponseError>> => {
    /**
     * Exception: if the challenge is the sandbox, return the sandbox
     * challenge directly from local storage.
     */
    if (challengeId === "sandbox") {
      const blob = getSandboxFromLocalStorage();
      const result: ICodeBlobDto = {
        dataBlob: blob,
        challengeId: "sandbox",
      };

      return new Ok(result);
    }

    const { headers, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.get<ICodeBlobDto>(`${HOST}/blob/${challengeId}`, {
          headers,
        });
      });
    } else {
      return localStorageHTTP.fetchChallengeHistory(challengeId);
    }
  };

  updateChallengeHistory = async (
    dataBlob: ICodeBlobDto,
  ): Promise<Result<ICodeBlobDto, HttpResponseError>> => {
    /**
     * Exception: If the data blob is a sandbox blob, save is directly to
     * local storage.
     */
    if (dataBlob.dataBlob.type === "sandbox") {
      saveSandboxToLocalStorage(dataBlob.dataBlob);
      return new Ok(dataBlob);
    }

    const { headers, authenticated } = this.getRequestHeaders();
    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.post<ICodeBlobDto>(`${HOST}/blob`, dataBlob, {
          headers,
        });
      });
    } else {
      const result = localStorageHTTP.updateChallengeHistory(dataBlob);
      return new Ok(result);
    }
  };

  updateCourseProgressBulk = async (userCourseProgress: UserCourseProgress) => {
    const { headers } = this.getRequestHeaders();
    return this.httpHandler(async () => {
      return axios.post<ICodeBlobDto>(
        `${HOST}/progress/bulk`,
        userCourseProgress,
        {
          headers,
        },
      );
    });
  };

  updateChallengeHistoryBulk = async (codeBlobBulk: CodeBlobBulk) => {
    const { headers } = this.getRequestHeaders();
    return this.httpHandler(async () => {
      return axios.post<ICodeBlobDto>(`${HOST}/blob/bulk`, codeBlobBulk, {
        headers,
      });
    });
  };

  handleDataPersistenceForNewAccount = async () => {
    await localStorageHTTP.persistDataPersistenceForNewAccount();
  };
}

/** ===========================================================================
 * Local Storage API
 * ----------------------------------------------------------------------------
 * Class which provides local storage APIs which mock the same behavior of the
 * backend REST APIs.
 *
 * The class is in the same file here because of the overlap between the
 * local storage mock HTTP APIs and the real HTTP APIs.
 * ============================================================================
 */

enum KEYS {
  USER_SETTINGS = "USER_SETTINGS",
  USER_PROGRESS_KEY = "USER_PROGRESS_KEY",
  CHALLENGE_BLOB_KEY = "CHALLENGE_BLOB_KEY",
}

class LocalStorageHttpClass {
  fetchUserSettings = (): UserSettings => {
    const result = this.getItem<UserSettings>(
      KEYS.USER_SETTINGS,
      defaultUserSettings,
    );

    /**
     * Merge the result over whatever the defaultUserSettings are anyway to
     * better ensure the validity of the final object.
     */
    return {
      ...defaultUserSettings,
      ...result,
    };
  };

  updateUserSettings = (settings: UserSettings) => {
    this.setItem(KEYS.USER_SETTINGS, settings);
  };

  fetchUserProgress = (): UserCourseProgress => {
    return this.getItem<UserCourseProgress>(KEYS.USER_PROGRESS_KEY, []);
  };

  fetchUserProgressMap = (): UserProgressMap => {
    const progressList = this.getItem<UserCourseProgress>(
      KEYS.USER_PROGRESS_KEY,
      [],
    );
    const progressMap: UserProgressMap = progressList.reduce((x, progress) => {
      return {
        ...x,
        [progress.courseId]: progress.progress,
      };
    }, {});

    return progressMap;
  };

  updateUserProgress = (progress: IProgressDto) => {
    const { courseId, challengeId } = progress;

    const progressList = this.fetchUserProgress();
    const existingCourseProgress = progressList.find(
      p => p.courseId === courseId,
    );

    let updatedProgress: ProgressEntity;

    /* ugh */
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

    /* ugh */
    const updatedProgressList = progressList.length
      ? progressList.map(p => {
          if (p.courseId === progress.courseId) {
            return updatedProgress;
          } else {
            return p;
          }
        })
      : [updatedProgress];

    this.setItem(KEYS.USER_PROGRESS_KEY, updatedProgressList);

    return progress;
  };

  fetchChallengeHistory = (
    challengeId: string,
  ): Result<ICodeBlobDto, HttpResponseError> => {
    const blobs = this.getItem<{ [key: string]: ICodeBlobDto }>(
      KEYS.CHALLENGE_BLOB_KEY,
      {},
    );

    if (challengeId in blobs) {
      return new Ok(blobs[challengeId]);
    } else {
      return new Err({
        status: 404,
        message: "Blob not found!",
      });
    }
  };

  updateChallengeHistory = (blob: ICodeBlobDto) => {
    const blobs = this.getItem<{ [key: string]: ICodeBlobDto }>(
      KEYS.CHALLENGE_BLOB_KEY,
      {},
    );

    const updatedBlobs = {
      ...blobs,
      [blob.challengeId]: blob,
    };
    this.setItem(KEYS.CHALLENGE_BLOB_KEY, updatedBlobs);
    return blob;
  };

  persistDataPersistenceForNewAccount = async () => {
    /**
     * This is the method!
     *
     * Persist user settings, progress, and code blob history from local
     * storage for a new account signup. This results in 3 API calls which
     * should persist all of this data for the newly created user account.
     *
     * Handle failure/empty cases, and render toasts messages for the
     * user when appropriate.
     */
    const { settings, blobs, progress } = this.getLocalDataToPersist();

    /* Only show the toast migration messages if we are sure pre-existing progress exists */
    let shouldToast = false;
    if (blobs !== null || progress !== null) {
      shouldToast = true;
    }

    /* Arbitrary delay for the application to load... */
    await wait(500);

    let toastKey = "";
    if (shouldToast) {
      toastKey = AppToaster.show({
        intent: "warning",
        message:
          "Syncing your progress to your new account, please wait a moment and do not close your browser window.",
      });
    }

    const results = await Promise.all([
      this.persistBlobs(blobs),
      this.persistProgress(progress),
      this.persistSettings(settings),
    ]);

    if (shouldToast) {
      /* Arbitrary delay for effect... */
      await wait(3000);

      /* Dismiss the previous toaster: */
      AppToaster.dismiss(toastKey);
      AppToaster.show({
        intent: "success",
        message: "Updates saved! You are good to go!",
      });
    }

    /* Log failed operations for debugging */
    results.forEach(this.logErrorIfOperationFailed);
  };

  private getLocalDataToPersist() {
    return {
      settings: this.fetchUserSettings(),
      blobs: this.getBlobsForPersistence(),
      progress: this.getProgressForPersistence(),
    };
  }

  private getProgressForPersistence() {
    const progress = this.fetchUserProgress();
    if (progress.length > 0) {
      return progress;
    }

    return null;
  }

  private getBlobsForPersistence() {
    const history = this.getItem<{ [key: string]: ICodeBlobDto }>(
      KEYS.CHALLENGE_BLOB_KEY,
      {},
    );
    if (Object.keys(history).length > 0) {
      return history;
    }

    return null;
  }

  private async persistSettings(settings: UserSettings) {
    const result = await API.updateUser({ settings });
    this.removeItem(KEYS.USER_SETTINGS);
    return result;
  }

  private async persistProgress(progress: Nullable<UserCourseProgress>) {
    if (progress) {
      const result = API.updateCourseProgressBulk(progress);
      this.removeItem(KEYS.USER_PROGRESS_KEY);
      return result;
    } else {
      return createNonHttpResponseError("No progress updates to persist!");
    }
  }

  private async persistBlobs(blobs: Nullable<{ [key: string]: ICodeBlobDto }>) {
    if (blobs) {
      const result = await API.updateChallengeHistoryBulk(blobs);
      this.removeItem(KEYS.CHALLENGE_BLOB_KEY);
      return result;
    } else {
      return createNonHttpResponseError("No code blobs to persist!");
    }
  }

  private logErrorIfOperationFailed(result: MaybeFailedResponse) {
    if (result.error) {
      console.warn(
        "[WARNING]: A new account data persistence request failed!",
        result.error,
      );
    }
  }

  private getItem<T extends {}>(key: KEYS, defaultValue: T): T {
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
  }

  private setItem(key: KEYS, value: any) {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  }

  private removeItem(key: KEYS) {
    localStorage.removeItem(key);
  }
}

const localStorageHTTP = new LocalStorageHttpClass();

/** ===========================================================================
 * Export
 * ============================================================================
 */

const API = new Api();

export default API;
