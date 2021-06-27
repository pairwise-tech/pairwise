// Import styles
import "normalize.css";

// Import Blueprint styles
import "./blueprint.scss";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/table/lib/css/table.css";
import "~@blueprintjs/popover2/lib/css/blueprint-popover2.css";

// Import app styles
import "./index.css";

// TSX styles to apply to React/TSX challenges for Monaco
import "./monaco-tsx-styles.scss";

// Import Libraries
import React from "react";
import ReactDOM from "react-dom";
import * as Sentry from "@sentry/browser";

// Import application
import Pairwise from "./App";
import { SENTRY_DSN } from "tools/client-env";

// Import service worker
import * as serviceWorker from "./serviceWorker";

// Polyfill smoothscroll. Some mobile browsers don't support this. #SafariTheNewIE
import smoothscroll from "smoothscroll-polyfill";

// Setup Sentry
Sentry.init({ dsn: SENTRY_DSN });

smoothscroll.polyfill();

// Render Pairwise!
ReactDOM.render(<Pairwise />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
