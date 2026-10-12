import { useEffect } from "react";
import Page from "../common/Page";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import deepCopy from "../utils/deepcopy";
import { useAppSelector, useAppDispatch } from "../hooks/redux";

export default function Features() {
  const user = useAppSelector((state) => state.main.user);
  const features = useAppSelector((state) =>
    state.main.features ? state.main.features : null
  );
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (features === null) {
      axios({ method: "get", url: `/api/feature` })
        .then((result) => {
          dispatch({ type: "GET_FEATURES", features: result.data });
        })
        .catch((err) => console.error(err));
    }
  }, [dispatch, features]);

  const handleSignup = (feature: any) => {
    const newUser = deepCopy(user);
    axios({
      method: "post",
      url: `/api/feature/${feature.id}/users`,
      data: { username: user.username, role: "Regular", status: "Active" },
    })
      .then(() => {
        newUser.featureUsers[feature.id] = { app: feature.name, role: "Regular" };
        dispatch({ type: "LOGIN", user: newUser });
        navigate(`/${feature.name}`);
      })
      .catch((err) => console.error(err));
  };

  return (
    <Page title="Features">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
          {/* Hero */}
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Welcome
              {user?.firstName ? `, ${user.firstName}` : " back"}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
              Choose an app to get started. Each one is built for a specific
              clinical or research workflow.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {!features && (
              <div className="col-span-full flex justify-center py-12 text-slate-400">
                <span className="material-symbols-outlined animate-spin mr-2">
                  progress_activity
                </span>
                Loading apps...
              </div>
            )}

            {features &&
              features.map((feature: any) => {
                const key = String(feature.name).toLowerCase();
                const hasAccess = user
                  ? Object.keys(user.featureUsers)
                      .map(Number)
                      .includes(feature.id)
                  : false;
                const role =
                  user && user.featureUsers[feature.id]
                    ? user.featureUsers[feature.id].role
                    : null;
                const locked = !hasAccess && !feature.allowSignup;

                return (
                  <div
                    key={feature.name}
                    onClick={
                      hasAccess ? () => navigate(`/${feature.name}`) : undefined
                    }
                    className={`group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ${
                      hasAccess
                        ? "cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                        : locked
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <div className="flex flex-1 flex-col p-6">
                      {/* Icon + status */}
                      <div className="flex items-start justify-between mb-5">
                         <h3 className="text-2xl font-bold uppercase tracking-tight mb-2 text-slate-900 dark:text-white">
                        {feature.name}
                      </h3>

                        {role ? (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {role}
                          </span>
                        ) : locked ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <span className="material-symbols-outlined text-[12px]">
                              lock
                            </span>
                            Locked
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Available
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-6 flex-1">
                        {feature.description ||
                          "An app from the Hulab suite. A more detailed description is coming soon."}
                      </p>

                      {(feature.allowSignup || hasAccess) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasAccess) navigate(`/${feature.name}`);
                            else handleSignup(feature);
                          }}
                          className={`mt-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                            hasAccess
                              ? "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                              : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>{hasAccess ? "Open App" : "Request Access"}</span>
                          <span className="material-symbols-outlined text-base">
                            {hasAccess ? "arrow_forward" : "person_add"}
                          </span>
                        </button>
                      )}

                      {locked && (
                        <div className="mt-auto text-center text-xs text-slate-400 italic">
                          Contact an administrator for access.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </Page>
  );
}
