import { useState } from "react";
import Page from "../common/Page";
import { validPassword } from "../utils/password";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "../hooks/redux";

const pwdAlert = `Password invalid. Is between 4 and 20 characters in length?`;

const inputClass =
  "mt-4 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const locationState = (location.state || {}) as any;
  const forcedReset = !!locationState.username;

  const [username, setUsername] = useState(locationState.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(locationState.message || "no");

  const handleReset = () => {
    if (!username) return setMessage("Please enter your username");
    if (!validPassword(password)) return setMessage(pwdAlert);
    if (password !== confirmPassword) return setMessage("Passwords don't match");

    axios({
      method: "post",
      url: `/api/auth/resetPassword`,
      data: { username, password },
    })
      .then((res) => {
        const { user } = res.data;
        dispatch({ type: "LOGIN", user });

        let count = 3;
        setMessage(`Successfully reset! Redirecting in ${count} seconds...`);
        const interval = setInterval(() => {
          count -= 1;
          if (count > 0) {
            setMessage(`Successfully reset! Redirecting in ${count} seconds...`);
          } else {
            clearInterval(interval);
            navigate("/features");
          }
        }, 1000);
      })
      .catch((err) => {
        console.error(err);
        setMessage(err.response?.data?.message || err.message);
      });
  };

  return (
    <Page title="Reset Password">
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"><div className="max-w-screen-sm mx-auto pt-20 pb-10 px-4">
        <h2 className="text-xl text-center mb-4">
          {forcedReset ? "Please set a new password" : "Reset your password"}
        </h2>

        <label className="text-sm text-gray-600 dark:text-gray-300 mt-2">Username *</label>
        <input
          className={inputClass}
          id="username"
          type="text"
          name="username"
          autoComplete="username"
          autoFocus={!forcedReset}
          disabled={forcedReset}
          required
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setMessage("no");
          }}
        />

        <label className="text-sm text-gray-600 dark:text-gray-300 mt-2">New Password *</label>
        <input
          className={inputClass}
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          autoFocus={forcedReset}
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setMessage("no");
          }}
        />

        <label className="text-sm text-gray-600 dark:text-gray-300 mt-2">Confirm Password *</label>
        <input
          className={inputClass}
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setMessage("no");
          }}
        />

        <p className={message === "no" ? "text-transparent" : "text-red-600 mt-2"}>
          {message}
        </p>

        <button
          type="submit"
          className="w-full mt-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          onClick={handleReset}
        >
          Reset Password
        </button>
      </div></div>
    </Page>
  );
}
