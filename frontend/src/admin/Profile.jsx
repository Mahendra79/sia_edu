import LoadingSpinner from "../components/LoadingSpinner";
import ProfileTabContent from "../components/ProfileTabContent";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "../layouts/AdminLayout";
import "./admin.css";

export default function AdminProfile() {
  const { loading } = useAuth();

  return (
    <AdminLayout>
      <h1>Profile</h1>
      {loading ? <LoadingSpinner /> : <ProfileTabContent />}
    </AdminLayout>
  );
}
