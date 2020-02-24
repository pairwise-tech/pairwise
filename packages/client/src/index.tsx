// Import styles
import "normalize.css";

// Import Blueprint styles
import "./blueprint.scss";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";

// Import app styles
import "./index.css";

// Import Libraries
import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/browser";

// Import application
import Pairwise from "./App";
import { SENTRY_DSN } from "tools/client-env";

// Import service worker
import * as serviceWorker from "./serviceWorker";

// Setup Sentry
Sentry.init({ dsn: SENTRY_DSN });

// Render Pairwise!
ReactDOM.render(<Pairwise />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
