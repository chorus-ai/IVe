import { useState, useEffect } from "react";
import Page from "../common/Page";
import { GoogleIcon, GithubIcon } from "../common/Icons";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { clearLocalStorage } from "../utils/localStorage";
import { useAppDispatch } from "../hooks/redux";

const inputClass =
  "mt-4 w-full px-3 py-2 border border-gray-300 focus:shadow-md transition-all duration-150 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500";
const outlinedBtn =
  "flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800";

async function loginUser(credentials: any) {
  return fetch("api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  }).then((res) => res.json());
}

async function loginGithub(code: any) {
  return fetch("api/auth/github-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(code),
    credentials: "include",
  }).then((r) => r.json());
}

async function loginAzure(email: any) {
  return fetch("api/auth/azure-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
  }).then((data) => data.json());
}

export default function Signin() {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState({ message: "", isLoading: false });
  const [checked, setChecked] = useState(localStorage.getItem("apps-remember") ? true : false);

  const [searchParams] = useSearchParams();
  const [ssoHandled, setSsoHandled] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const email = (searchParams.get("email") || "").trim();
    if (!email || ssoHandled) return;

    setSsoHandled(true);
    setState((s) => ({ ...s, isLoading: true, message: "" }));
    setUserName(email);
    loginAzure(email)
      .then((resp) => {
        if (resp && !resp.message) {
          const user = resp.user || resp;
          dispatch({ type: "LOGIN", user });
          if (!user.featureUsers || !Object.values(user.featureUsers).length) {
            navigate("/features", { replace: true });
          } else {
            navigate("/" + (Object.values(user.featureUsers)[0] as any).app, { replace: true });
          }
        } else {
          setState({ isLoading: false, message: (resp && resp.message) || "Login failed" });
        }
      })
      .catch(() => setState({ isLoading: false, message: "Login error" }))
      .finally(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("email");
        window.history.replaceState({}, document.title, url.toString());
      });
  }, [searchParams, ssoHandled, dispatch, navigate]);

  const handleSignin = async (e: any) => {
    e.preventDefault();

    if (checked) {
      localStorage.setItem("apps-remember", `${username} ${password}`);
    } else {
      localStorage.removeItem("apps-remember");
    }

    setState((s) => ({ ...s, isLoading: true, message: "" }));
    const data = await loginUser({ username, password });

    if (data?.oldPassword) {
      navigate("/resetpassword", { state: { username, message: data.message } });
      return;
    }

    if (data?.message && !data?.user) {
      setState({ isLoading: false, message: data.message });
      return;
    }

    const user = data.user || data;
    dispatch({ type: "LOGIN", user });
    navigate("/features");
  };

  const handleRMChange = () => setChecked((v) => !v);

  useEffect(() => {
    clearLocalStorage(["apps-remember"]);
  }, []);

  useEffect(() => {
    const rememberMe = localStorage.getItem("apps-remember");
    if (rememberMe) {
      const [u = "", p = ""] = rememberMe.split(" ");
      setUserName(u);
      setPassword(p);
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    const handleGithubLogin = async (data: any) => {
      setState({ isLoading: true, message: "" });
      const resp = await loginGithub(data);
      if (resp?.message && !resp?.user) {
        setState({ isLoading: false, message: resp.message });
      } else {
        const user = resp.user || resp;
        dispatch({ type: "LOGIN", user });
        navigate("/" + (Object.values(user.featureUsers)[0] as any).app);
      }
    };

    const url = window.location.href;
    if (url.includes("?code=")) {
      const [, code] = url.split("?code=");
      handleGithubLogin({ code });
    }
  }, [dispatch, navigate]);

  return (
    <Page title="Signin">
      <div className="md:flex min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="max-w-screen-sm mx-auto w-full px-4">
          {state.isLoading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <div className="max-w-[480px] mx-auto min-h-screen flex flex-col justify-center py-24">
              <h4 className="text-2xl font-bold mb-2">
                Sign in to {import.meta.env.VITE_APP_NAME} Apps
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-10">Enter your credential below.</p>

              <div className="flex flex-row gap-4">
                <button
                  type="button"
                  className={outlinedBtn}
                  onClick={() =>
                    window.location.assign(
                      `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}`
                    )
                  }
                >
                  <GithubIcon />
                </button>
                <button type="button" className={outlinedBtn}>
                  <GoogleIcon />
                </button>
                <button
                  type="button"
                  className={outlinedBtn}
                  onClick={() => window.location.assign("/api/auth/azure-login")}
                >
                  <span className="text-sm">SSO</span>
                </button>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="px-3 text-sm text-gray-500 dark:text-gray-400">OR</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>

              <form noValidate onSubmit={handleSignin}>
                <label className="text-sm text-gray-600 dark:text-gray-300">Username *</label>
                <input
                  className={inputClass}
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <label className="text-sm text-gray-600 mt-2">Password *</label>
                <input
                  className={inputClass}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="flex items-center justify-between my-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={checked}
                      onChange={handleRMChange}
                    />
                    <span className="text-sm">Remember me</span>
                  </label>
                  <RouterLink
                    to="/resetpassword"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </RouterLink>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Sign In
                </button>

                {state.message && (
                  <p className="text-sm text-red-600 mt-2">{state.message}</p>
                )}
              </form>

              <p className="text-sm mt-6 text-right">
                Don't have an account?{" "}
                <RouterLink to="/signup" className="font-medium text-blue-600 hover:underline">
                  Get started
                </RouterLink>
              </p>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
