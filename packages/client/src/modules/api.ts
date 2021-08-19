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
  StripeStartCheckoutSuccessResponse,
  LastActiveChallengeIds,
  IGenericFeedback,
  NullBlob,
  PullRequestCourseContent,
} from "@pairwise/common";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Observable, lastValueFrom } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { map, switchMap } from "rxjs/operators";
import * as ENV from "tools/client-env";
import {
  getAccessTokenFromLocalStorage,
  logoutUserInLocalStorage,
  saveSandboxToLocalStorage,
  getSandboxFromLocalStorage,
} from "tools/storage-utils";
import { SANDBOX_ID } from "tools/constants";
import toaster from "tools/toast-utils";
import { wait, mapCourseSkeletonInDev } from "tools/utils";
import { UserStoreState } from "./user/store";
import { captureSentryException } from "../tools/sentry-utils";
import { v4 as uuidv4 } from "uuid";

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

export const createCodepressAPI = (endpoint: string): CodepressAPI => {
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
    toaster.error("Your session has expired, please login again.", {
      icon: "user",
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
  codepressApi = createCodepressAPI(ENV.CODEPRESS_HOST);

  // Generate anonymous session id for real-time user progress metrics
  anonID = uuidv4();

  fetchCourses = async (): Promise<Result<CourseList, HttpResponseError>> => {
    try {
      let courses: CourseList;
      if (ENV.DEV) {
        // eslint-disable-next-line
        const courseList = require("@pairwise/common").default;
        courses = Object.values(courseList);
      } else if (ENV.CODEPRESS) {
        courses = await lastValueFrom(this.codepressApi.getAll());
      } else {
        const { config } = this.getRequestHeaders();
        const result = await axios.get<CourseList>(
          `${HOST}/content/courses`,
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
    } else if (ENV.CODEPRESS) {
      return lastValueFrom(this.codepressApi.getSkeletons().pipe(map(Ok.of)));
    }

    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.get<CourseSkeletonList>(`${HOST}/content/skeletons`, config);
    });
  };

  fetchUserProfile = async () => {
    const { config, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.get<UserStoreState>(`${HOST}/user/profile`, config);
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
      const lastActiveChallengeIds =
        localStorageHTTP.fetchLastActiveChallengeIds();

      const preAccountUser: UserStoreState = {
        settings,
        progress,
        profile: null,
        courses: null,
        payments: null,
        lastActiveChallengeIds,
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
  updateUserSettings = async (
    settings: Partial<UserSettings>,
  ): Promise<Err<HttpResponseError> | Ok<UserStoreState>> => {
    const { authenticated } = this.getRequestHeaders();
    if (authenticated) {
      return this.updateUser({ settings });
    } else {
      localStorageHTTP.updateUserSettings(settings);
      return this.fetchUserProfile();
    }
  };

  updateUser = async (userDetails: UserUpdateOptions) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.post<IUserDto>(`${HOST}/user/profile`, userDetails, config);
    });
  };

  updateUserEmail = async (email: string) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      const body = { email };
      return axios.post<"Success">(`${HOST}/auth/update-email`, body, config);
    });
  };

  loginByEmail = async (email: string) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      const body = { email };
      return axios.post<string>(`${HOST}/auth/email`, body, config);
    });
  };

  submitUserFeedback = async (feedback: IFeedbackDto) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.post<"Success">(`${HOST}/feedback`, feedback, config);
    });
  };

  submitGenericFeedback = async (feedback: IGenericFeedback) => {
    return this.httpHandler(async () => {
      const { config } = this.getRequestHeaders();
      return axios.post<"Success">(
        `${HOST}/feedback/general`,
        feedback,
        config,
      );
    });
  };

  fetchUserProgress = async (): Promise<
    Result<UserCourseProgress, HttpResponseError>
  > => {
    const { config, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.get<UserCourseProgress>(`${HOST}/progress`, config);
      });
    } else {
      const result = localStorageHTTP.fetchUserProgress();
      return new Ok(result);
    }
  };

  updateUserProgress = async (
    progress: IProgressDto,
  ): Promise<Result<IProgressDto, HttpResponseError>> => {
    const { config, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.post<IProgressDto>(`${HOST}/progress`, progress, config);
      });
    } else {
      const result = localStorageHTTP.updateUserProgress(progress);

      try {
        // Dispatch /progress event for anonymous user for tracking
        axios.post<IProgressDto>(
          `${HOST}/progress/anonymous/${this.anonID}`,
          progress,
          config,
        );
      } catch (err) {
        captureSentryException(err);
      }

      return new Ok(result);
    }
  };

  fetchChallengeBlob = async (
    challengeId: string,
  ): Promise<Result<ICodeBlobDto, HttpResponseError>> => {
    /**
     * Exception: if the challenge is the sandbox, return the sandbox
     * challenge directly from local storage.
     */
    if (challengeId === SANDBOX_ID) {
      const stored = getSandboxFromLocalStorage();
      const result: ICodeBlobDto = {
        dataBlob: stored.blob,
        challengeId: SANDBOX_ID,
      };

      return new Ok(result);
    }

    const { config, authenticated } = this.getRequestHeaders();

    if (authenticated) {
      const result = await this.httpHandler(async () => {
        return axios.get<ICodeBlobDto | NullBlob>(
          `${HOST}/blob/${challengeId}`,
          config,
        );
      });

      if (result.value) {
        // Is a null blob, i.e. 404, no blob was found
        if (
          result.value.dataBlob === null &&
          result.value.challengeId === null
        ) {
          return createNonHttpResponseError(
            `No data blob found for challenge id: ${challengeId}`,
          );
        } else {
          // A valid blob is returned, the if statement above ensures
          // this is the case
          const blob = result.value as ICodeBlobDto;
          return new Ok(blob);
        }
      } else {
        return result;
      }
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
    if (dataBlob.dataBlob.type === SANDBOX_ID) {
      saveSandboxToLocalStorage(dataBlob.dataBlob);
      return new Ok(dataBlob);
    }

    const { config, authenticated } = this.getRequestHeaders();
    if (authenticated) {
      return this.httpHandler(async () => {
        return axios.post<ICodeBlobDto>(`${HOST}/blob`, dataBlob, config);
      });
    } else {
      const result = localStorageHTTP.updateChallengeHistory(dataBlob);
      return new Ok(result);
    }
  };

  updateLastActiveChallengeIds = async (
    courseId: string,
    challengeId: string,
  ): Promise<Result<LastActiveChallengeIds, HttpResponseError>> => {
    const { config, authenticated } = this.getRequestHeaders();
    if (authenticated) {
      const body = { courseId, challengeId };
      return this.httpHandler(async () => {
        return axios.post<LastActiveChallengeIds>(
          `${HOST}/user/active-challenge-ids`,
          body,
          config,
        );
      });
    } else {
      const result = localStorageHTTP.updateLastActiveChallengeIds(
        courseId,
        challengeId,
      );
      return new Ok(result);
    }
  };

  updateCourseProgressBulk = async (userCourseProgress: UserCourseProgress) => {
    const { config } = this.getRequestHeaders();
    return this.httpHandler(async () => {
      return axios.post<ICodeBlobDto>(
        `${HOST}/progress/bulk`,
        userCourseProgress,
        config,
      );
    });
  };

  updateChallengeHistoryBulk = async (codeBlobBulk: CodeBlobBulk) => {
    const { config } = this.getRequestHeaders();
    return this.httpHandler(async () => {
      return axios.post<ICodeBlobDto>(
        `${HOST}/blob/bulk`,
        codeBlobBulk,
        config,
      );
    });
  };

  handleDataPersistenceForNewAccount = async () => {
    await localStorageHTTP.persistDataPersistenceForNewAccount();
  };

  createCheckoutSession = async (courseId: string) => {
    const { config } = this.getRequestHeaders();
    return this.httpHandler(async () => {
      return axios.post<StripeStartCheckoutSuccessResponse>(
        `${HOST}/payments/checkout/${courseId}`,
        {},
        config,
      );
    });
  };

  isUserAdmin = async () => {
    try {
      const { config } = this.getRequestHeaders();
      await axios.get(`${HOST}/admin`, config);
      return new Ok(true);
    } catch (err) {
      return new Err(false);
    }
  };

  fetchAdminPullRequestCourseList = async (pullRequestId: string) => {
    const { config } = this.getRequestHeaders();
    return this.httpHandler<PullRequestCourseContent>(async () => {
      return axios.get(
        `${HOST}/admin/pull-requests/courses/${pullRequestId}`,
        config,
      );
    });
  };

  logoutUser = async () => {
    const { config } = this.getRequestHeaders();
    return this.httpHandler<PullRequestCourseContent>(async () => {
      return axios.get(`${HOST}/auth/logout`, config);
    });
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
  LAST_ACTIVE_CHALLENGE_IDS_KEY = "LAST_ACTIVE_CHALLENGE_IDS_KEY",
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

  updateUserSettings = (settings: Partial<UserSettings>) => {
    const currentSettings = this.fetchUserSettings();
    this.setItem(KEYS.USER_SETTINGS, { ...currentSettings, ...settings });
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
      (x) => x.courseId === courseId,
    );

    let updatedProgress: ProgressEntity;
    const timeCompleted = new Date();

    if (existingCourseProgress) {
      updatedProgress = {
        courseId,
        progress: {
          ...existingCourseProgress.progress,
          [challengeId]: { complete: true, timeCompleted },
        },
      };
    } else {
      updatedProgress = {
        courseId,
        progress: {
          [challengeId]: { complete: true, timeCompleted },
        },
      };
    }

    const updatedProgressList =
      progressList.length === 0
        ? [updatedProgress]
        : progressList
            // Filter out the pre-existing entry
            .filter((x) => x.courseId !== courseId)
            .concat(updatedProgress);

    // Update user progress
    this.setItem(KEYS.USER_PROGRESS_KEY, updatedProgressList);

    return progress;
  };

  fetchLastActiveChallengeIds = () => {
    return this.getItem<LastActiveChallengeIds>(
      KEYS.LAST_ACTIVE_CHALLENGE_IDS_KEY,
      {},
    );
  };

  updateLastActiveChallengeIds = (
    courseId: string,
    challengeId: string,
  ): LastActiveChallengeIds => {
    const lastActive = this.fetchLastActiveChallengeIds();
    const updated: LastActiveChallengeIds = {
      ...lastActive,
      [courseId]: challengeId,
      lastActiveChallenge: challengeId,
    };
    this.setItem(KEYS.LAST_ACTIVE_CHALLENGE_IDS_KEY, updated);
    return updated;
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
    const { settings, blobs, progress, lastActiveChallengeIds } =
      this.getLocalDataToPersist();

    /* Only show the toast migration messages if we are sure pre-existing progress exists */
    let shouldToast = false;
    if (blobs !== null || progress !== null) {
      shouldToast = true;
    }

    /* Arbitrary delay for the application to load... */
    await wait(500);

    let toastKey = "";
    if (shouldToast) {
      toastKey = toaster.warn(
        "Syncing your progress to your new account, please wait a moment and do not close your browser window.",
      );
    }

    const results = await Promise.all([
      this.persistBlobs(blobs),
      this.persistProgress(progress),
      this.persistSettings(settings),
      this.persistLastActiveChallengeIds(lastActiveChallengeIds),
    ]);

    if (shouldToast) {
      /* Arbitrary delay for effect... */
      await wait(3000);

      /* Dismiss the previous toaster: */
      toaster.toast.dismiss(toastKey);
      toaster.success("Updates saved! You are good to go!");
    }

    /* Log failed operations for debugging */
    results.forEach(this.logErrorIfOperationFailed);
  };

  private getLocalDataToPersist() {
    return {
      settings: this.fetchUserSettings(),
      blobs: this.getBlobsForPersistence(),
      progress: this.getProgressForPersistence(),
      lastActiveChallengeIds: this.fetchLastActiveChallengeIds(),
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

  private async persistLastActiveChallengeIds(
    lastActiveIds: LastActiveChallengeIds,
  ) {
    if (lastActiveIds) {
      for (const [courseId, challengeId] of Object.entries(lastActiveIds)) {
        // Skip the lastActiveChallenge key
        if (courseId === "lastActiveChallenge") {
          continue;
        }

        await API.updateLastActiveChallengeIds(courseId, challengeId);
      }

      this.removeItem(KEYS.LAST_ACTIVE_CHALLENGE_IDS_KEY);
    }
    return createNonHttpResponseError(
      "No last active challenge IDs to persist!",
    );
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

  private setItem<T extends {}>(key: KEYS, value: T) {
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
