import axios from "axios";
import querystring from "querystring";
import request from "supertest";

export const purchaseCourseForUserByAdmin = async (userEmail: string) => {
  const accessToken = await getAccessTokenForAdmin();

  const result = await axios.post(
    `http://localhost:9000/admin/course-pay`,
    {
      userEmail,
      courseId: "fpvPtfu7s",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return "OK";
};

const getAccessTokenFromRedirect = (redirect: string) => {
  const indexOfQuestionMark = redirect.indexOf("?");
  const queryParams = redirect.slice(indexOfQuestionMark + 1);
  const params = querystring.parse(queryParams);
  return params.accessToken;
};

const getAccessTokenForAdmin = async (): Promise<string> => {
  let authorizationRedirect;
  let loginRedirect;
  let accessToken;

  await request(`http://localhost:9000/auth/google`)
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
