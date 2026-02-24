import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import LoadingSpinner from "./components/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Billing = lazy(() => import("./pages/Billing"));
const CourseDetails = lazy(() => import("./pages/CourseDetails"));
const Success = lazy(() => import("./pages/Success"));
const Failure = lazy(() => import("./pages/Failure"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const AdminProfile = lazy(() => import("./admin/Profile"));
const ManageCourses = lazy(() => import("./admin/ManageCourses"));
const ManageUsers = lazy(() => import("./admin/ManageUsers"));
const AdminPayments = lazy(() => import("./admin/Payments"));
const DatabaseEditor = lazy(() => import("./admin/DatabaseEditor"));
const MISReports = lazy(() => import("./admin/MISReports"));
const ChatbotQA = lazy(() => import("./admin/ChatbotQA"));

const UserDashboard = lazy(() => import("./user/UserDashboard"));
const Profile = lazy(() => import("./user/Profile"));
const MyCourses = lazy(() => import("./user/MyCourses"));
const PaymentHistory = lazy(() => import("./user/PaymentHistory"));

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading page..." />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route
          path="/billing/:courseId"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/success"
          element={
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          }
        />
        <Route
          path="/failure"
          element={
            <ProtectedRoute>
              <Failure />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute adminOnly>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute adminOnly>
              <ManageCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute adminOnly>
              <AdminPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/database"
          element={
            <ProtectedRoute adminOnly>
              <DatabaseEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute adminOnly>
              <MISReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/chatbot"
          element={
            <ProtectedRoute adminOnly>
              <ChatbotQA />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/my-courses"
          element={
            <ProtectedRoute>
              <MyCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/payment-history"
          element={
            <ProtectedRoute>
              <PaymentHistory />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
