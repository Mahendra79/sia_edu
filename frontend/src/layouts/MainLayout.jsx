import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, sidebarExtra, contentClassName = "", showFooter = true }) {
  return (
    <div className="app-shell">
      <Sidebar extra={sidebarExtra} />
      <div className="app-content-col">
        <main className={`main-content ${contentClassName}`.trim()}>{children}</main>
        {showFooter ? <Footer /> : null}
      </div>
    </div>
  );
}
