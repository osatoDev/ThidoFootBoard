import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initializePendo } from "./pendo";
import "./styles.css";

initializePendo();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
