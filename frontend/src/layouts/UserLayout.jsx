import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

export default function UserLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content-col">
        <main className="main-content dashboard-content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
