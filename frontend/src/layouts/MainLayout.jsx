import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, sidebarExtra }) {
  return (
    <div className="app-shell">
      <Sidebar extra={sidebarExtra} />
      <div className="app-content-col">
        <main className="main-content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
