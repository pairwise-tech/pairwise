import axios from "axios";
import querystring from "querystring";
import request from "supertest";
import { SERVER } from "./config";

// Use the admin API to handle purchasing a course for a user.
export const purchaseCourseForUserByAdmin = async (userEmail: string) => {
  const accessToken = await getAccessTokenForAdmin();

  const body = {
    userEmail,
    courseId: "fpvPtfu7s",
  };

  const headers = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  await axios.post(`${SERVER}/payments/admin/purchase-course`, body, headers);

  return "OK";
};

// Get the access token from a redirect url
const getAccessTokenFromRedirect = (redirect: string) => {
  const indexOfQuestionMark = redirect.indexOf("?");
  const queryParams = redirect.slice(indexOfQuestionMark + 1);
  const params = querystring.parse(queryParams);
  return params.accessToken;
};

// Use the Google login flow to create an admin user and retrieve its
// access token.
const getAccessTokenForAdmin = async (): Promise<string> => {
  let authorizationRedirect;
  let loginRedirect;
  let accessToken;

  await request(`${SERVER}/auth/google`)
    .get("/")
    .expect(302)
    .then(response => {
      authorizationRedirect = response.header.location;
    });

  await request(authorizationRedirect)
    .get("/")
    .expect(302)
    .then(response => {
      loginRedirect = response.header.location;
    });

  await request(loginRedirect)
    .get("/")
    .expect(302)
    .then(response => {
      accessToken = getAccessTokenFromRedirect(response.header.location);
    });

  return accessToken;
};
