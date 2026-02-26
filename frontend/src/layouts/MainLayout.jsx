import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}
