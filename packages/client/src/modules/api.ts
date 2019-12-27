import { Err, Ok, Result } from "@prototype/common";
import axios, { AxiosError } from "axios";
import ENV from "tools/env";
import { getAccessTokenFromLocalStorage } from "tools/utils";
import { Course } from "./challenges/types";
import { User } from "./user/types";

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
  fetchChallenges = async (): Promise<Result<Course, HttpResponseError>> => {
    try {
      let course: Course;
      if (ENV.DEV_MODE) {
        course = fetchCourseInDevelopment();
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
