import { Provider } from "react-redux";
import { store } from "./store";
import { Navigate, Routes, Route } from "react-router-dom";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import NotFound from "./pages/Page404";
import Profile from "./pages/Profile";
import Features from "./pages/Features";
import ResetPassword from "./pages/ResetPassword";
import AuthLayout from "./layouts/Auth";
import ProtectedRoute from "./common/ProtectedRoute";

// Every app under `apps/<name>/` may ship routes at `apps/<name>/routes.tsx`
// Picked up automatically — no manual import needed when adding a new app.
const appRouteModules = import.meta.glob<{ default: React.ReactNode }>("./apps/*/routes.tsx", { eager: true });

const appRoutes: React.ReactNode[] = Object.keys(appRouteModules)
  .sort()
  .map((path) => appRouteModules[path].default);

// No app-wide session check here — it's lazy, only firing when a
// <ProtectedRoute> actually mounts (see common/ProtectedRoute.tsx). Public
// and unprotected app routes render immediately with no backend call.
function App() {
  return (
    <Provider store={store}>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route path="" element={<Navigate to="/signin" />} />
            <Route path="signin" element={<Signin />} />
            <Route path="signup" element={<Signup />} />
            <Route path="404" element={<NotFound />} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="features" element={<ProtectedRoute><Features /></ProtectedRoute>} />
            <Route path="resetpassword" element={<ResetPassword />} />
          </Route>

          {appRoutes}

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
    </Provider>
  );
}

export default App;
