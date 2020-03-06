import faker from "faker";

/** ===========================================================================
 * Utils
 * ============================================================================
 */

const ADMIN_EMAIL = "pairwise-dev-admin-user@pairwise.tech";

const getRandomProfileImage = () => {
  const n = Math.floor(Math.random() * 100);
  return n > 50
    ? "https://avatars0.githubusercontent.com/u/59724684?s=200&v=4"
    : "https://avatars0.githubusercontent.com/u/1024025?s=460&v=4";
};

const generateNewProfileFields = () => {
  const id = faker.random.uuid();
  const first = faker.name.firstName();
  const last = faker.name.lastName();
  const email = faker.internet.email();
  const name = `${first} ${last}`;
  const picture = getRandomProfileImage();

  return { id, first, last, name, email, picture };
};

/** ===========================================================================
 * Mock Auth Class
 * ----------------------------------------------------------------------------
 * This class provides methods which produce mock data which resembles the
 * data returned by the real SSO external APIs.
 * ============================================================================
 */

class MockAuth {
  generateNewFacebookProfile() {
    const { id, first, last, email, picture } = generateNewProfileFields();

    return {
      id,
      email,
      first_name: first,
      last_name: last,
      picture: {
        data: {
          height: 50,
          width: 50,
          is_silhouette: false,
          url: picture,
        },
      },
    };
  }

  generateNewGitHubProfile() {
    const { id, name, email, picture } = generateNewProfileFields();

    return {
      id,
      name,
      email,
      avatar_url: picture,
    };
  }

  generateNewGoogleProfile() {
    const { id, first, last, name, picture } = generateNewProfileFields();

    return {
      sub: id,
      name,
      picture,
      email: ADMIN_EMAIL,
      given_name: first,
      family_name: last,
      locale: "en",
      email_verified: true,
    };
  }

  getFacebookAccessToken = () => {
    return {
      access_token:
        "EAAGdfD41U5wBADJFoBPDg6emDgwnlcyejfCFxaOpNIocNAGNYxmR4LDZCKVXc7cjFbigpCEqjoATgYmeMqbELYIZBf3yFw5OZCHEIz8zmjoubT3aZCMnolxYnPWQKcBBBaiMXpOFDE2bsSmxm4LcDFq4SCmlnPSXmeOxvZAURBQZDZD",
      token_type: "bearer",
      expires_in: 5180249,
    };
  };

  getGitHubAccessToken = () => {
    return "access_token=61d5cfb6d0853016109fa997f85f4ad8fa2d5a44&scope=user%3Aemail&token_type=bearer";
  };

  getGoogleAccessToken = () => {
    return {
      access_token:
        "ya29.Il-4Bx-En1aXel4p5jHSaJLqeygEL_x4pHN5Sw_y7YMVYddbtfj3VreMi6KJ_p3pFedP5A9aBEHrISyDfKMVU0EosO8BD1kCxC3LNdiUOlGp9vH97spf1zcZcEJCxVtFwg",
      expires_in: 3600,
      scope:
        "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
      token_type: "Bearer",
      id_token:
        "eyJhbGciOiJSUzI1NiIsImtpZCI6ImNkMjM0OTg4ZTNhYWU2N2FmYmMwMmNiMWM0MTQwYjNjZjk2ODJjYWEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3MzYyMTkyNzQzNzQtMG9wNjVrbmtlNDA4b3JjNjNzNmNwbmJjMDhjYWhoa2ouYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3MzYyMTkyNzQzNzQtMG9wNjVrbmtlNDA4b3JjNjNzNmNwbmJjMDhjYWhoa2ouYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTcxNDM1NzY3MTY0NjY4OTM0MDYiLCJlbWFpbCI6InNlYW4uc21pdGguMjAwOUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IkgxanlubkI0NTh4eXhYM1RwQVNhUWciLCJuYW1lIjoiU2VhbiBTbWl0aCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQUF1RTdtQUw3bVpiWW9SYlctM1FTUXNUU2dkVzhlbENBQ1ZwR01tM0RVT0ZJUT1zOTYtYyIsImdpdmVuX25hbWUiOiJTZWFuIiwiZmFtaWx5X25hbWUiOiJTbWl0aCIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNTc4MzcxOTA2LCJleHAiOjE1NzgzNzU1MDZ9.OYGKwYtaFCaf4Vw8lGw2DKMJ9Zqjd_CC1FoY3sGNdmw3CWAPXJbwVdAOWejy8mQfX47KyMA7GWL2QGNs-N667qrPzpfk0clr4FznGKLL6WkniN-XLVK6oqXR88_BbWXivPKe7ZtmapvrveMY8WH9e4JuVbQ-ANSpWfN1HMmotbXPC5VhhQoi7ajSjkNaWMdKvXzfVi0lgjxZ_x1jpo0C2MJwI8t_hdwpuRX25il7RLV8VUOMAYZrx0SvmqU_JGCIW7rsWoVCk_UURfWV4DqzUnl01jdxCmp4-ge5g_bJbRn5XZq8hrjhp9zJY29xX_J5qGWu6sGegmuhBcSakwt3Pw",
    };
  };
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const mockAuth = new MockAuth();

export default mockAuth;
