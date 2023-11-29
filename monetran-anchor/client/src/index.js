import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import { config } from "./clientConfig";

document.title = config.UI.anchorName;

ReactDOM.render(<App config={config} />, document.getElementById("root"));
registerServiceWorker();
