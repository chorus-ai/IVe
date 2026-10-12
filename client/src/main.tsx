import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./utils/axios"; // Configure axios: send the httpOnly auth cookie, redirect to /signin on 401

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
);

