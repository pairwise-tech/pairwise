/* Import styles */
import "normalize.css";
import "./index.css";

/* Import Blueprint styles */
import "./blueprint.scss";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";

import React from "react";
import ReactDOM from "react-dom";

import App from "./App";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
