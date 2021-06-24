import {
  CLIENT_APP_URL,
  TIMEOUT,
  getIframeBody,
  click,
  typeTextInCodeEditor,
  checkTestResultStatus,
  purchaseCourseForUser,
  checkTestStatus,
} from "../support/cypress-utils";

/** ===========================================================================
 * Workspace Tests
 * ----------------------------------------------------------------------------
 * Test various features of the workspace.
 * ============================================================================
 */

const FIRST_CHALLENGE_URL = `${CLIENT_APP_URL}/workspace/iSF4BNIl`;

describe("Workspace and Challenge Navigation Works", () => {
  it("Workspace loads and contains title Pairwise", () => {
    cy.visit(CLIENT_APP_URL);
    cy.get("#product-title").contains("Pairwise");
  });

  it("Loading the app on /workspace redirects to the home route", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace`);
    cy.contains("Welcome to Pairwise!");
    cy.url().should("include", "home");
  });

  it("Loading the app on /workspace/iSF4BNIl redirects to the first challenge", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace/iSF4BNIl`);
    cy.contains("Hello, Pairwise!");
    cy.url().should("include", "workspace/iSF4BNIl/hello-pairwise");
  });

  it("Home route includes courses list", () => {
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.url().should("include", "home");
    cy.contains("Welcome to Pairwise!");

    // These are currently the two courses we have
    cy.contains("Fullstack TypeScript");

    click("course-link-0-start");
    cy.url().should("include", "workspace");
  });

  it("Workspace navigation next|prev controls work", () => {
    const getChallengeId = (url: string) => {
      const index = url.indexOf("workspace/");
      const id = url.slice(index + 10);
      return id;
    };

    cy.visit(`${CLIENT_APP_URL}/home`);

    cy.wait(TIMEOUT);
    cy.url().should("include", "home");

    /* Open the navigation menu and navigate to the first programming challenge: */
    click("navigation-menu-button");
    click("module-navigation-1");
    click("challenge-navigation-0");

    let challengeId = "";

    const checkPrev = () => {
      cy.wait(TIMEOUT);
      cy.get("#prevButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
    };

    const checkNext = () => {
      cy.wait(TIMEOUT);
      cy.get("#nextButton").click();
      cy.url().then(url => {
        const id = getChallengeId(url);
        expect(url).to.not.equal(challengeId);
        challengeId = id;
      });
    };

    checkNext();
    checkNext();
    checkNext();
    checkNext();
    checkNext();

    checkPrev();
    checkPrev();
    checkPrev();
    checkPrev();
    checkPrev();
  });
});

describe("Sandbox", () => {
  it("Sandbox should exist", () => {
    cy.visit(CLIENT_APP_URL);
    cy.get("#sandboxButton").click();
    cy.url().should("include", "/sandbox");

    cy.get("#sandboxButton").should("have.attr", "disabled");
    cy.get("#selectChallengeType").click();

    cy.contains("HTML/CSS");
    cy.contains("TypeScript");
    cy.contains("React");
  });

  it("Sandbox should load when coming directly to URL", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace/sandbox`);
    cy.url().should("include", "/sandbox");
    cy.get("#sandboxButton").should("have.attr", "disabled");
  });

  it("Sandbox should load when coming from non-workspace challenge", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace/yxZjmD0o`);
    cy.get("#pairwise-code-editor").should("not.exist");
    click("sandboxButton");
    click("selectChallengeType");
    click("challenge-type-markup");
    typeTextInCodeEditor("<h1 class='just-typed-this'>Testing</h1>");

    cy.wait(TIMEOUT);

    getIframeBody()
      .find(".just-typed-this")
      .should("include.text", `Testing`);
  });
});

/**
 * A quick helper to open the app, create an account, and then signin. The
 * purchaseCourseForUser util does not do this because the payment tests
 * handle signin separately.
 */
const handleCreateAccountAndPurchaseCourse = () => {
  cy.visit(CLIENT_APP_URL);
  cy.wait(TIMEOUT);
  cy.contains("Welcome to Pairwise!");
  click("login-signup-button");
  click("github-login");
  purchaseCourseForUser();
};

describe("Workspace Challenges", () => {
  /**
   * NOTE: The workspace tests tend to fail inconsistently. This is frustrating
   * and I'm not sure why, but it tends to be because the #gs-card cannot be
   * found after the challenge is completed (either it's not there, or entering
   * the solution code and passing the challenge did not work...).
   *
   * For now, these tests are skipped...
   */
  it.skip("The workspace supports TypeScript challenges and they can be solved", () => {
    // Visit a TypeScript challenge
    cy.visit(`${CLIENT_APP_URL}/workspace/0KYYpigq9$/selective-transformation`);
    cy.wait(TIMEOUT);

    // Verify the challenge title
    cy.contains("Selective Transformation");

    // Run the code
    click("pw-run-code");

    // Tests are not complete yet
    checkTestStatus("Success!", 0);
    checkTestStatus("Incomplete...", 1);

    // Enter solution
    typeTextInCodeEditor(TYPESCRIPT_CHALLENGE_SOLUTION);

    // Verify the Success Modal appears when running the code
    cy.get("#gs-card").should("not.be.visible");
    click("pw-run-code");
    cy.wait(TIMEOUT);
    cy.get("#gs-card").should("be.visible");
  });

  it.skip("The workspace supports Async/Await challenges and they can be solved", () => {
    handleCreateAccountAndPurchaseCourse();

    // Visit an Async challenge
    cy.visit(`${CLIENT_APP_URL}/workspace/5wHvxCBaG/the-await-keyword`);
    cy.wait(TIMEOUT);

    // Verify the challenge title
    cy.contains("The Await Keyword");

    // Tests should fail
    checkTestResultStatus("Incomplete...");

    // Enter solution
    typeTextInCodeEditor(ASYNC_CHALLENGE_SOLUTION);

    // Verify the Success Modal appears when running the code
    cy.get("#gs-card").should("not.be.visible");
    click("pw-run-code");
    cy.wait(TIMEOUT);
    cy.get("#gs-card").should("be.visible");
  });
});

/**
 * NOTE: This test intermittently fails with an error like:
 * AssertionError: Timed out retrying: Expected to find element: `#test-result-status-0`, but never found it.
 *
 * Edit: CONFIRMED that this fails because sometimes requests to unpkg fail,
 * producing errors like this:
 * [ERROR]: Failed to fetch source for react-dom-test-utils. Error: Network Error
 *
 * This issue should be resolved first before re-enabling this test.
 */
it.skip("The workspace supports React challenges and they can be solved", () => {
  handleCreateAccountAndPurchaseCourse();

  // Visit a React challenge
  cy.visit(`${CLIENT_APP_URL}/workspace/50f7f8sUV/create-a-controlled-input`);

  // Regular challenge loading time
  cy.wait(TIMEOUT);

  // Verify the challenge title
  cy.contains("Create a Controlled Input");

  // Wait for workspace to load
  cy.wait(TIMEOUT);

  // Tests should fail
  checkTestResultStatus("Incomplete...");

  // Enter solution
  typeTextInCodeEditor(REACT_CHALLENGE_SOLUTION);

  // Verify the Success Modal appears when running the code
  cy.get("#gs-card").should("not.be.visible");
  click("pw-run-code");
  cy.wait(TIMEOUT);
  cy.get("#gs-card").should("be.visible");
});

it("Workspace projects can be completed by submitting valid project URLs", () => {
  handleCreateAccountAndPurchaseCourse();

  cy.visit(`${CLIENT_APP_URL}/workspace/KCmZ1fjHG/current-weather-tool`);
  cy.wait(TIMEOUT);

  // Verify the project title
  cy.contains("Current Weather Tool");

  // Enter an invalid url
  cy.get("#repo-url-input").type("hello");
  click("project-submission-button");
  cy.contains("Please submit a valid repository url:");

  cy.reload();
  cy.get("#repo-url-input").should("have.value", "");

  const url = "https://github.com/pairwise-tech/pairwise-example-http-api";

  // Enter a valid url
  cy.get("#repo-url-input").type(url);
  click("project-submission-button");
  cy.contains("Project details submitted successfully!");
  cy.get("#repo-url-input").should("have.value", url);
  cy.wait(TIMEOUT);

  // Verify the challenge is marked as complete
  cy.get("#challenge-content-success").should("exist");

  // Verify changes are maintained after reload
  cy.reload();
  cy.wait(TIMEOUT);
  cy.get("#repo-url-input").should("have.value", url);

  // Verify the challenge is marked as complete
  cy.get("#challenge-content-success").should("exist");
});

describe("Workspace Editor Functions", () => {
  it("There should be a more options menu with buttons", () => {
    cy.visit(FIRST_CHALLENGE_URL);
    cy.wait(TIMEOUT);
    click("editor-more-options");
    [
      "editor-export-code",
      "editor-increase-font-size",
      "editor-decrease-font-size",
      "editor-format-code",
      "editor-toggle-full-screen",
      "editor-toggle-high-contrast",
      "editor-restore-initial-code",
      "editor-toggle-solution-code",
    ]
      .map(x => "#" + x)
      .forEach(id => {
        cy.get(id).should("be.visible");
      });
  });

  it("Should format code when the format button is clicked", () => {
    const unformattedCode = `
<h1>SUP SUP SUP

</h1>
    `;
    typeTextInCodeEditor(unformattedCode);

    cy.get(".monaco-editor textarea").should("have.value", unformattedCode);

    click("editor-more-options");
    click("editor-format-code");

    cy.get(".monaco-editor textarea").should(
      "have.value",
      "<h1>SUP SUP SUP</h1>\n",
    );
  });

  it("Should increase or decrease font-size", () => {
    cy.get(".monaco-editor textarea").then($textarea => {
      const fs = parseInt($textarea.css("font-size"), 10);
      cy.log(`initial font size ${fs}`);
      cy.get(".monaco-editor textarea").should(
        "have.css",
        "font-size",
        fs + "px",
      );

      click("editor-increase-font-size");

      cy.get(".monaco-editor textarea").should(
        "have.css",
        "font-size",
        fs + 2 + "px",
      );

      click("editor-decrease-font-size");

      cy.get(".monaco-editor textarea").should(
        "have.css",
        "font-size",
        fs + "px",
      );
    });
  });

  // NOTE: If we change the challenge then this test will fail.
  const initialCode = "<h1>\n  Welcome to Pairwise Workspace.\n</h1>\n";
  const solutionCode = "<h1>Hello Pairwise!</h1>\n";

  it("Should restore initial code", () => {
    // NOTE: The code is assumed to be something other than initial because of the tests above
    cy.get(".monaco-editor textarea").should("not.have.value", initialCode);
    click("editor-more-options");
    click("editor-restore-initial-code");
    cy.get(".monaco-editor textarea").should("have.value", initialCode);
  });

  it("Should reveal solution code", () => {
    cy.get(".monaco-editor textarea").should("have.value", initialCode);
    click("editor-more-options");
    click("editor-toggle-solution-code");
    cy.contains("Viewing Solution Code");
    cy.get(".monaco-editor textarea").should("have.value", solutionCode);

    click("editor-more-options");
    click("editor-toggle-solution-code");
    cy.get(".monaco-editor textarea").should("have.value", initialCode);
  });

  it("Should support high contrast theme", () => {
    cy.get(".hc-black").should("not.exist");
    click("editor-more-options");
    click("editor-toggle-high-contrast");
    cy.get(".hc-black");
    click("editor-more-options");
    click("editor-toggle-high-contrast");
    cy.get(".hc-black").should("not.exist");
  });

  it("Should support full-screen editing", () => {
    cy.get("#workspace-panel-instructions");
    click("editor-more-options");
    click("editor-toggle-full-screen");
    cy.get("#workspace-panel-instructions").should("not.exist");
    click("editor-more-options");
    click("editor-toggle-full-screen");
    cy.get("#workspace-panel-instructions");
  });
});

/** ===========================================================================
 * Solution Code
 * ============================================================================
 */

const TYPESCRIPT_CHALLENGE_SOLUTION = `
const selectiveTransformation = (
  list: any[],
  conditionalFunction: (item: any) => boolean,
  transformationFunction: (item: any) => any
): any[] => {
  return list.map(x => {
    if (conditionalFunction(x)) {
      return transformationFunction(x);
    } else {
      return x;
    }
  });
};
`;

const REACT_CHALLENGE_SOLUTION = `
import React from "react";
import ReactDOM from "react-dom";

interface IState {
  value: string;
}

class App extends React.Component<{}, IState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      value: "",
    };
  }

  render(): JSX.Element {
    const welcome: string = "Hello, React!";
    console.log("Hello from the iframe!!!");
    return (
      <div>
        <h1>{welcome}</h1>
        <input value={this.state.value} onChange={this.handleChange} />
      </div>
    );
  }

  handleChange = (e: any) => {
    this.setState({ value: e.target.value });
  };
}

// Do not edit code below this line
const Main = App;
ReactDOM.render(<Main />, document.querySelector("#root"));
`;

const ASYNC_CHALLENGE_SOLUTION = `
const makePromise = (shouldResolve: boolean) => {
  return new Promise((resolve, reject) => {
    if (shouldResolve) {
      resolve("I promised!");
    } else {
      reject("Promise rejected!");
    }
  });
}

const fulfillThePromise = async (promiseShouldResolve: boolean) => {
  try {
    console.log("Fulfilling the promise...");
    const resolutionValue = await makePromise(promiseShouldResolve);
    console.log("The resolution value is: ", resolutionValue);
    return resolutionValue;
  } catch (rejectionValue) {
    console.log("The rejection value is: ", rejectionValue);
    return rejectionValue;
  }
};
`;
