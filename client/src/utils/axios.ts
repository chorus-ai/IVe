import axios from "axios";
import { DemoOfflineError, isBlockedInDemo, isDemoRoute } from "./demoMode";

// Send cookies with every request (needed for httpOnly auth cookie)
axios.defaults.withCredentials = true;

/**
 * …but never cross-origin. A credentialed request requires the server to answer
 * with a specific `Access-Control-Allow-Origin` plus
 * `Access-Control-Allow-Credentials: true`; a public CDN answers `*` with
 * neither, so the browser blocks the response outright. The CADA demo's
 * fixtures are fetched from one (see apps/cada/api/files.ts), and they carry no
 * session anyway.
 */
axios.interceptors.request.use((config) => {
  const url = config.url || "";

  // The public demo may not call our API at all — see utils/demoMode.ts.
  if (isBlockedInDemo(url)) {
    return Promise.reject(new DemoOfflineError(url));
  }

  if (/^https?:\/\//i.test(url) && !url.startsWith(window.location.origin)) {
    config.withCredentials = false;
  }
  return config;
});

// On 401 responses, redirect to signin (except for session-check calls)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      // Don't redirect on the session restore call — let the caller handle it
      if (url.includes("/auth/me")) {
        return Promise.reject(error);
      }
      // …nor out of the public demo, which has no session by design. Bouncing a
      // visitor to a login form for an account they don't have is worse than
      // the panel rendering without whatever the call would have returned.
      if (isDemoRoute()) {
        return Promise.reject(error);
      }
      const path = window.location.pathname;
      if (!path.startsWith("/signin") && !path.startsWith("/signup") && !path.startsWith("/resetpassword")) {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
