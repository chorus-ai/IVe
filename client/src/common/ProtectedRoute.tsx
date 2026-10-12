import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/redux";
import { store } from "../store";
import axios from "../utils/axios";

// Lazy, once-only session check: only fires the first time a
// <ProtectedRoute> actually mounts (not on every page load), and dedupes
// concurrent mounts/StrictMode double-effects into a single request.
// Whether the check has settled is tracked here, outside Redux — the
// store's `user` stays exactly User | null, never an artificial "session
// checked, no user" state.
let sessionCheckPromise: Promise<void> | null = null;
let sessionCheckSettled = false;

function ensureSessionChecked() {
  if (!sessionCheckPromise) {
    sessionCheckPromise = axios
      .get("/api/auth/me")
      .then((res) => {
        if (res.data?.user) {
          store.dispatch({ type: "LOGIN", user: res.data.user });
        }
      })
      .catch(() => {
        // No valid cookie — user stays null, ProtectedRoute sends to signin
      })
      .finally(() => {
        sessionCheckSettled = true;
      });
  }
  return sessionCheckPromise;
}

const ProtectedRoute = ({ children }: { children: any }) => {
  const user = useAppSelector((state) => state.main.user);
  const [checked, setChecked] = useState(sessionCheckSettled);

  useEffect(() => {
    if (!checked) {
      ensureSessionChecked().then(() => setChecked(true));
    }
  }, [checked]);

  if (!checked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <div className="loader"></div>
      </div>
    );
  }

  return !user ? <Navigate to="/signin" replace /> : children;
};

export default ProtectedRoute;
