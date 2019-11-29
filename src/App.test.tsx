import React from "react";
import ReactDOM from "react-dom";
import Workspace from "./App";

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<Workspace />, div);
  ReactDOM.unmountComponentAtNode(div);
});
