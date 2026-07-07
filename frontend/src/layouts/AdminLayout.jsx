import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content-col">
        <main className="main-content dashboard-content admin-shell">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
