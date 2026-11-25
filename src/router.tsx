import { createBrowserRouter } from 'react-router-dom'
import AdminGuard from './components/AdminGuard'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import NewReportPage from './pages/NewReportPage'
import MyReportsPage from './pages/MyReportsPage'
import PublicMapPage from './pages/PublicMapPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminReportReviewPage from './pages/admin/AdminReportReviewPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import NotFoundPage from './pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'reports/new', element: <NewReportPage /> },
      {
        element: <AuthGuard />,
        children: [{ path: 'reports/my', element: <MyReportsPage /> }],
      },
      { path: 'map', element: <PublicMapPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      {
        element: <AdminGuard />,
        children: [
          { path: 'admin', element: <AdminDashboardPage /> },
          { path: 'admin/reports/:id', element: <AdminReportReviewPage /> },
        ],
      },
      { path: 'sign-in', element: <SignInPage /> },
      { path: 'sign-up', element: <SignUpPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
