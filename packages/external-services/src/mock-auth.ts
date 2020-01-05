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

  return { id, first, last, name, email };
};

/** ===========================================================================
 * Mock Auth Class
 * ============================================================================
 */

class MockAuth {
  generateNewFacebookProfile() {
    const { id, first, last, name, email } = generateNewProfileFields();

    const profile = {
      id,
      email,
      name,
      first_name: first,
      last_name: last,
    };
    return profile;
  }

  generateNewGitHubProfile() {
    const { id, name, email } = generateNewProfileFields();
    const profile = {
      id,
      name,
      email,
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
