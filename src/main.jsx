import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import CloudGate from "./CloudGate.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CloudGate>
      <App />
    </CloudGate>
  </StrictMode>
);