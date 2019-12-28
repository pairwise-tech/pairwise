import { Err, Ok, Result, Course, CourseList } from "@prototype/common";
import axios, { AxiosError } from "axios";
import ENV from "tools/env";
import { getAccessTokenFromLocalStorage } from "tools/utils";
import { User } from "./user/types";
import { Observable } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import { switchMap, map } from "rxjs/operators";

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

const fetchCourseInDevelopment = () => {
  const Courses = require("@prototype/common").default;
  const course = Courses.FullstackTypeScript as Course;
  return course;
};

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

class Api {
  codepressApi = makeCodepressApi("http://localhost:3001");

  fetchChallenges = async (): Promise<Result<Course, HttpResponseError>> => {
    try {
      let course: Course;
      if (ENV.DEV_MODE) {
        // TODO: This is not great code, it's just that we're in the middle of a big refactor. In the future, we should standardize a few things, including:
        // - How we do async. I.e. Observables, Promises, fetch, axios, lots of redundancy
        // - Arrays of things (CourseList) vs things themselves (Course)
        course = await this.codepressApi
          .getAll()
          .pipe(map(x => x[0]))
          .toPromise();
      } else {
        const result = await axios.get<Course>(`${HOST}/challenges`);
        course = result.data;
      }

      return new Ok(course);
    } catch (err) {
      return this.handleHttpError(err);
    }
  };

  fetchUserProfile = async (): Promise<Result<User, HttpResponseError>> => {
    try {
      const headers = this.getRequestHeaders();
      const result = await axios.get<User>(`${HOST}/user/profile`, {
        headers,
      });
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
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
    };
  };

  handleHttpError = (err: any) => {
    return new Err(this.formatHttpError(err));
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const API = new Api();

export default API;
