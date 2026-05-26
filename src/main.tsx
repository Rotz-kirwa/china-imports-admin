// Polyfill crypto.randomUUID for non-secure (HTTP) contexts
if (typeof crypto !== "undefined" && typeof crypto.randomUUID !== "function") {
  (crypto as unknown as Record<string, unknown>).randomUUID = () =>
    "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
      const n = parseInt(c);
      return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
    });
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
