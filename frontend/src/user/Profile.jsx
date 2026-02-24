import LoadingSpinner from "../components/LoadingSpinner";
import ProfileTabContent from "../components/ProfileTabContent";
import UserLayout from "../layouts/UserLayout";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { loading } = useAuth();

  return (
    <UserLayout>
      <h1>Profile</h1>
      {loading ? <LoadingSpinner /> : <ProfileTabContent />}
    </UserLayout>
  );
}
