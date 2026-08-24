import { createRoot } from "react-dom/client";
import { setAuthTokenProvider } from "@core/api/RequestBuilder";
import { bootstrap } from "@core/di/bootstrap";
import App from "./App.tsx";
import "./index.css";

// Register all repository implementations in the DI container so
// module services resolving TOKENS.* work at runtime.
bootstrap();

// Wire the RequestBuilder auth token provider so all http.* calls
// (used by CartContext, etc.) include the Bearer token from localStorage.
setAuthTokenProvider(() => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
