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

describe("Workspace and Challenge Navigation Works", () => {
  it("Workspace loads and contains title Pairwise", () => {
    cy.visit(CLIENT_APP_URL);
    cy.get("#product-title").contains("Pairwise");
  });

  it("Home route includes courses list", () => {
    cy.visit(`${CLIENT_APP_URL}/home`);
    cy.url().should("include", "home");
    cy.contains("Welcome to Pairwise!");
    cy.contains("Content");

    // These are currently the two courses we have
    cy.contains("Fullstack TypeScript Course");
    cy.contains("Pairwise Library");

    cy.get(".courseLinkContinue").click({ force: true });
    cy.url().should("include", "workspace");
  });

  it("Workspace navigation next|prev controls work", () => {
    const getChallengeId = (url: string) => {
      const index = url.indexOf("workspace/");
      const id = url.slice(index + 10);
      return id;
    };

    cy.visit(`${CLIENT_APP_URL}/workspace`);

    cy.wait(TIMEOUT);
    cy.url().should("include", "workspace");

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
    cy.visit(`${CLIENT_APP_URL}/workspace/sandbox`); // The "Welcome to pairwise" challenge (no workspace)
    cy.url().should("include", "/sandbox");
    cy.get("#sandboxButton").should("have.attr", "disabled");
  });

  it("Sandbox should load when coming from non-workspace challenge", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace/yxZjmD0o`); // The "Welcome to pairwise" challenge (no workspace)
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

describe("Workspace Challenges", () => {
  beforeEach(() => {
    cy.visit(CLIENT_APP_URL);
    cy.wait(TIMEOUT);
    cy.contains("Welcome to Pairwise!");
    click("login-signup-button");
    click("github-login");

    // React challenges are locked so purchase the course first
    purchaseCourseForUser();
  });

  it("The workspace supports TypeScript challenges and they can be solved", () => {
    // Visit a React challenge
    cy.visit(`${CLIENT_APP_URL}/workspace/0KYYpigq9$/selective-transformation`);
    cy.wait(TIMEOUT);

    // Verify the challenge title
    cy.contains("Selective Transformation");

    // Tests are not complete yet
    checkTestStatus("Success!", 0);
    checkTestStatus("Incomplete...", 1);

    // Enter solution
    typeTextInCodeEditor(TYPESCRIPT_CHALLENGE_SOLUTION);

    // Verify the Success Modal appears when running the code
    cy.get("#gs-card").should("not.exist");
    click("pw-run-code");
    cy.wait(500);
    cy.get("#gs-card").should("exist");
  });

  it("The workspace supports React challenges and they can be solved", () => {
    // Visit a React challenge
    cy.visit(`${CLIENT_APP_URL}/workspace/50f7f8sUV/create-a-controlled-input`);
    cy.wait(TIMEOUT);

    // Verify the challenge title
    cy.contains("Create a Controlled Input");

    // React challenges take longer to fully initialize
    cy.wait(TIMEOUT);

    // Tests should fail
    checkTestResultStatus("Incomplete...");

    // Enter solution
    typeTextInCodeEditor(REACT_CHALLENGE_SOLUTION);

    // Verify the Success Modal appears when running the code
    cy.get("#gs-card").should("not.exist");

    click("pw-run-code");
    cy.wait(500);
    cy.get("#gs-card").should("exist");
  });

  it("The workspace supports Async/Await challenges and they can be solved", () => {
    // Visit an async challenge
    cy.visit(`${CLIENT_APP_URL}/workspace/5wHvxCBaG/write-an-async-function`);
    cy.wait(TIMEOUT);

    // Verify the challenge title
    cy.contains("Write an Async Function");

    // Tests should fail
    checkTestResultStatus("Incomplete...");

    // Enter solution
    typeTextInCodeEditor(ASYNC_CHALLENGE_SOLUTION);

    // Verify the Success Modal appears when running the code
    cy.get("#gs-card").should("not.exist");
    click("pw-run-code");
    cy.wait(500);
    cy.get("#gs-card").should("exist");
  });
});

describe("Success Modal", () => {
  it("Should show the modal when and only when the run button is clicked", () => {
    cy.visit(`${CLIENT_APP_URL}/workspace/9scykDold`); // The "Add a h1 Tag in HTML"
    cy.contains("Incomplete");
    click("pw-run-code");
    cy.get("#gs-card").should("not.exist");

    typeTextInCodeEditor("<h1>Hello!</h1>");
    cy.get("#gs-card").should("not.exist");

    click("pw-run-code");
    cy.wait(500);
    cy.get("#gs-card").should("exist");
  });

  it("Should have a feedback button", () => {
    cy.contains("Feedback");
  });

  it("Should close when the close button is clicked", () => {
    click("gs-card-close");
    cy.get("#gs-card").should("not.exist");
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
const makePromise = (shouldResolve: boolean = true) => {
  return new Promise((resolve, reject) => {
    if (shouldResolve) {
      resolve("I promised!");
    } else {
      reject("Promise rejected!");
    }
  });
}

const fulfillThePromise = async (promiseShouldResolve: boolean = true) => {
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

fulfillThePromise();
`;
