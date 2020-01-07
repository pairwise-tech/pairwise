import faker from "faker";

/** ===========================================================================
 * Utils
 * ============================================================================
 */

const generateNewProfileFields = () => {
  const id = faker.random.uuid();
  const first = faker.name.firstName();
  const last = faker.name.lastName();
  const email = faker.internet.email();
  const name = `${first} ${last}`;
  const picture =
    "https://lh3.googleusercontent.com/a-/AAuE7mAL7mZbYoRbW-3QSQsTSgdW8elCACVpGMm3DUOFIQ";

  return { id, first, last, name, email, picture };
};

/** ===========================================================================
 * Mock Auth Class
 * ============================================================================
 */

class MockAuth {
  generateNewFacebookProfile() {
    const {
      id,
      first,
      last,
      name,
      email,
      picture,
    } = generateNewProfileFields();

    const profile = {
      id,
      email,
      name,
      first_name: first,
      last_name: last,
      picture,
    };
    return profile;
  }

  generateNewGitHubProfile() {
    const { id, name, email, picture } = generateNewProfileFields();
    const profile = {
      id,
      name,
      email,
      picture,
    };

    return profile;
  }

  generateNewGoogleProfile() {
    const {
      id,
      first,
      last,
      name,
      email,
      picture,
    } = generateNewProfileFields();

    const profile = {
      sub: "117143576716466893406",
      name,
      email,
      picture,
      given_name: first,
      family_name: last,
      locale: "en",
      email_verified: true,
    };

    return profile;
  }

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
