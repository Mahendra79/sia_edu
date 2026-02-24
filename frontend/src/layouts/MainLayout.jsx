import Chatbot from "../components/Chatbot";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function MainLayout({ children, showChatbot = false }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      {showChatbot ? <Chatbot /> : null}
    </div>
  );
}
