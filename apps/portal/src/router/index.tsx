import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

// Lazy load pages for code splitting
import { lazy, Suspense } from "react";
import { Spin } from "antd";

const LoginPage = lazy(() => import("@/pages/Login"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const FilesPage = lazy(() => import("@/pages/Files"));
const SharesPage = lazy(() => import("@/pages/Shares"));
const PublicSharePage = lazy(() => import("@/pages/PublicShare"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallback"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" />
  </div>
);

// Wrap lazy loaded components with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Navigate to="/dashboard" replace />,
    },
    {
      path: "/login",
      element: withSuspense(LoginPage),
    },
    {
      path: "/auth/callback",
      element: withSuspense(AuthCallbackPage),
    },
    {
      path: "/dashboard",
      element: <ProtectedRoute>{withSuspense(DashboardPage)}</ProtectedRoute>,
    },
    {
      path: "/files",
      element: <ProtectedRoute>{withSuspense(FilesPage)}</ProtectedRoute>,
    },
    {
      path: "/shares",
      element: <ProtectedRoute>{withSuspense(SharesPage)}</ProtectedRoute>,
    },
    {
      path: "/s/:alias",
      element: withSuspense(PublicSharePage),
    },
    {
      path: "*",
      element: withSuspense(NotFoundPage),
    },
  ],
  {
    basename: "/portal",
  },
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default router;
