import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "react-nice-avatar";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import axios from "../../utils/axios";
import { avatarConfigFrom } from "../../utils/avatarConfig";
import { useIveMembership } from "./hooks/useIveUsers";
import UsersDrawer from "./components/UsersDrawer";

const Header: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [open, setOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.main.user);

  const avatarConfig = avatarConfigFrom(user?.avatar);

  const tabs = [
    { name: 'Search', path: '/ive' },
    { name: 'Cohort', path: '/ive/cohort' },
    { name: 'Workspace', path: '/ive/workspace' },
    { name: 'Endpoints', path: '/ive/endpoints' },
    { name: 'Agent', path: '/ive/agent' }
  ];

  const menuItemClass =
    "w-full text-left px-3 py-2 rounded text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800";

  const { fid, role, isAdmin } = useIveMembership();
  const roleText = role ?? "";

  const menuOptions = [
    { label: "Home", href: "/ive" },
    { label: "Profile", href: "/profile" },
    { label: "Apps", href: "/features" },
  ];

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-panel-light/80 dark:bg-panel-dark/80 backdrop-blur-md px-6 flex items-center justify-between z-50 transition-colors duration-300">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            IVe
          </h1>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {tabs.map((tab) => {
          const isActive =
            currentPath === tab.path ||
            (tab.path === "/" && currentPath === "/search");
          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive
                  ? "text-primary border-b-2 border-primary pb-1 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-primary"
              }`}
            >
              {tab.name === "Agent" && (
                <span className="material-symbols-outlined text-lg">
                  auto_awesome
                </span>
              )}
              {tab.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {avatarConfig ? (
              <Avatar
                style={{ width: "29px", height: "29px" }}
                {...avatarConfig}
              />
            ) : (
              <span className="text-sm font-medium text-white bg-pink-500 w-full h-full flex items-center justify-center">
                {user?.firstName?.charAt(0).toUpperCase()}
                {user?.lastName?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 min-w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50"
            >
              <div className="my-2 px-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.firstName + " " + user?.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{roleText}</p>
              </div>
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />
              <div className="p-1">
                {menuOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={menuItemClass}
                    onClick={() => {
                      setOpen(false);
                      navigate(option.href);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                {isAdmin && (
                  <button
                    type="button"
                    className={menuItemClass}
                    onClick={() => {
                      setOpen(false);
                      setUsersOpen(true);
                    }}
                  >
                    Users
                  </button>
                )}
              </div>
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800" />
              <div className="p-1">
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() => {
                    setOpen(false);
                    axios
                      .post("/api/auth/logout")
                      .finally(() => dispatch({ type: "LOGOUT" }));
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <UsersDrawer open={usersOpen} onClose={() => setUsersOpen(false)} fid={fid} />
      )}
    </header>
  );
};

export default Header;
