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
    const { id, name, email, picture } = generateNewProfileFields();
    const profile = {
      id,
      name,
      email,
      picture,
    };

    return profile;
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

const mockAuth = new MockAuth();

export default mockAuth;
