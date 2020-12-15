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

// Import application
import Pairwise from "./AdminApp";

// Import service worker
import * as serviceWorker from "./serviceWorker";

// Polyfill smoothscroll. Some mobile browsers don't support this. #SafariTheNewIE
import smoothscroll from "smoothscroll-polyfill";

smoothscroll.polyfill();

// Render Pairwise!
ReactDOM.render(<Pairwise />, document.getElementById("root"));

try {
  // Expose the debug module so we can call __debug.enable(...) from the
  // console. Otherwise we would have to set the localStorage key directly,
  // which is error prone since the lib might change its key at some point
  // eslint-disable-next-line
  // @ts-ignore
  window.__debug = require("debug");
} catch (err) {
  // There is no reason this should fail, not even in a pseudo-browser env since
  // the debug module works in node and client. But we wouldn't want this to
  // bring down the app somehow, so it's wrapped
  console.error("[ERROR] Could not initialize debug module", err);
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
