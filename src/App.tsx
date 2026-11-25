import { Route, Routes } from 'react-router-dom'
import AdminGuard from './components/AdminGuard'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'
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

/**
 * App component used in tests (MemoryRouter wraps this for unit/component tests).
 * The production entry point (main.tsx) uses createBrowserRouter + RouterProvider instead.
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="reports/new" element={<NewReportPage />} />
          <Route element={<AuthGuard />}>
            <Route path="reports/my" element={<MyReportsPage />} />
          </Route>
          <Route path="map" element={<PublicMapPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route element={<AdminGuard />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/reports/:id" element={<AdminReportReviewPage />} />
          </Route>
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="sign-up" element={<SignUpPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
