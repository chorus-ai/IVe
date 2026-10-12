import { useCallback, useMemo, useState } from "react";
import Avatar, { genConfig } from "react-nice-avatar";
import UpdateAvatar from "../common/UpdateAvatar";
import axios from "axios";
import { isEqual, object2list } from "../utils/objectFunctions";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500";
const labelClass =
  "text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5";
const cardClass =
  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden";
const cardHeaderClass =
  "px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30";
const cardBody = "p-6";
const cardActions =
  "flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30";
const primaryBtn =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors active:scale-95";
const ghostBtn =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors";
const dangerBtn =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-900/50 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors";

export default function Profile() {
  const user = useAppSelector((state) => state.main.user);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [config, setConfig] = useState(user?.avatar ? JSON.parse(user.avatar) : genConfig({}));
  const apps = object2list(user.featureUsers);
  const [open, setOpen] = useState(false);

  // Pass the stored config straight through. We deliberately do NOT call
  // genConfig() on read: it fills missing fields with random values on every
  // call, so a partially-saved avatar would change on each mount.
  const avatarConfig = useMemo(
    () => (user?.avatar ? JSON.parse(user.avatar) : null),
    [user?.avatar]
  );

  const [state, setState] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    login: user.loginType,
    password: "",
    confirm: "",
  });

  const handleChange = useCallback((event: any) => {
    setState((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }, []);

  const handleSubmit = useCallback((event: any) => {
    event.preventDefault();
  }, []);

  const handleClickOpen = () => {
    setConfig(user?.avatar ? JSON.parse(user.avatar) : {});
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    if (!user.avatar || !isEqual(config, JSON.parse(user.avatar))) {
      // Expand once here so the persisted config is complete and stable.
      const fullConfig = JSON.stringify(genConfig(config));
      axios({
        method: "put",
        url: `/api/user/${user.id}`,
        data: { avatar: fullConfig },
      })
        .then(() => {
          dispatch({ type: "UPDATE_AVATAR", value: { avatar: fullConfig } });
          setOpen(false);
        })
        .catch((err) => console.error(err));
    } else {
      setOpen(false);
    }
  };

  const handleNavigate = (app: any) => navigate(`/${app}`);

  const initials =
    `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <>
      {/* Avatar editor modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
        >
          <div
            className="bg-white dark:bg-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-slate-500">
                  face
                </span>
                <span className="text-base font-semibold">Avatar editor</span>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <UpdateAvatar
                defaultConfig={user.avatar ? JSON.parse(user.avatar) : null}
                setUpdatedConfig={setConfig}
              />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={handleClose} className={dangerBtn}>
                Cancel
              </button>
              <button onClick={handleConfirm} className={primaryBtn}>
                Save Avatar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
          {/* Page header */}
          <div className="mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Account
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">
              Profile Settings
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your personal information, notifications, and security.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar — identity card */}
            <aside className="lg:col-span-4 space-y-6">
              <div className={cardClass}>
                <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
                  <div className="relative">
                    {avatarConfig ? (
                      <Avatar
                        style={{
                          height: "104px",
                          width: "104px",
                        }}
                        {...avatarConfig}
                      />
                    ) : (
                      <div className="h-[104px] w-[104px] rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-300">
                        {initials || "?"}
                      </div>
                    )}
                    <button
                      onClick={handleClickOpen}
                      title="Edit avatar"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                    >
                      <span className="material-symbols-outlined text-base">
                        edit
                      </span>
                    </button>
                  </div>
                  <h2 className="text-lg font-bold mt-4">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {user.username}
                  </p>
                  {user.loginType && (
                    <span className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span className="material-symbols-outlined text-[12px]">
                        verified_user
                      </span>
                      {user.loginType}
                    </span>
                  )}
                </div>
              </div>

              {/* Apps card */}
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <div className="text-sm font-semibold">Your Apps</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quick access to features you have permissions for.
                  </div>
                </div>
                <div className={cardBody}>
                  {apps.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      No apps yet.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {apps.map((app) => (
                        <button
                          key={app.key}
                          type="button"
                          onClick={() =>
                            handleNavigate(app.value.app.toLowerCase())
                          }
                          className="flex items-center justify-between px-3 py-2.5 -mx-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <span className="material-symbols-outlined text-base">
                                apps
                              </span>
                            </span>
                            <div className="text-left">
                              <p className="text-sm font-semibold uppercase tracking-tight text-slate-800 dark:text-slate-200">
                                {app.value.app}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                {app.value.role}
                              </p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-base text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors">
                            chevron_right
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <section className="lg:col-span-8 space-y-6">
              {/* Profile info */}
              <form autoComplete="off" noValidate onSubmit={handleSubmit}>
                <div className={cardClass}>
                  <div className={cardHeaderClass}>
                    <div className="text-sm font-semibold">
                      Personal Information
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Update your name and contact details.
                    </div>
                  </div>
                  <div className={cardBody}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First name</label>
                        <input
                          className={inputClass}
                          name="firstName"
                          onChange={handleChange}
                          required
                          value={state.firstName}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last name</label>
                        <input
                          className={inputClass}
                          name="lastName"
                          onChange={handleChange}
                          required
                          value={state.lastName}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email Address</label>
                        <input
                          className={inputClass}
                          name="email"
                          type="email"
                          onChange={handleChange}
                          required
                          value={state.email}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Login Type</label>
                        <input
                          className={inputClass}
                          name="login"
                          disabled
                          onChange={handleChange}
                          required
                          value={state.login}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={cardActions}>
                    <button type="button" className={primaryBtn}>
                      <span>Save changes</span>
                      <span className="material-symbols-outlined text-base">
                        check
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Password */}
              <form onSubmit={handleSubmit}>
                <div className={cardClass}>
                  <div className={cardHeaderClass}>
                    <div className="text-sm font-semibold">Password</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose a strong password and keep it secure.
                    </div>
                  </div>
                  <div className={cardBody}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>New password</label>
                        <input
                          className={inputClass}
                          name="password"
                          type="password"
                          onChange={handleChange}
                          value={state.password}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Confirm password</label>
                        <input
                          className={inputClass}
                          name="confirm"
                          type="password"
                          onChange={handleChange}
                          value={state.confirm}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={cardActions}>
                    <button type="button" className={ghostBtn}>
                      Update password
                    </button>
                  </div>
                </div>
              </form>

              {/* Notifications */}
              <form onSubmit={handleSubmit}>
                <div className={cardClass}>
                  <div className={cardHeaderClass}>
                    <div className="text-sm font-semibold">Notifications</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage how we reach you.
                    </div>
                  </div>
                  <div className={cardBody}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        {
                          title: "Account updates",
                          options: [
                            { label: "Email", checked: true },
                            { label: "Push notifications", checked: true },
                          ],
                        },
                        {
                          title: "Comments & mentions",
                          options: [
                            { label: "Email", checked: true },
                            { label: "Push notifications", checked: false },
                          ],
                        },
                      ].map((group) => (
                        <div key={group.title}>
                          <h6 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                            {group.title}
                          </h6>
                          <div className="space-y-2">
                            {group.options.map((opt) => (
                              <label
                                key={opt.label}
                                className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  defaultChecked={opt.checked}
                                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={cardActions}>
                    <button type="button" className={ghostBtn}>
                      Save preferences
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
