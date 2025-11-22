import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { useEffect, useState } from "react";
// import { useAuth } from "../contexts/AuthContext";

export default function DefaultLayout() {
  const loc = useLocation();
  const [isInitialMount, setIsInitialMount] = useState(true);
  // const { isAuthenticated } = useAuth();

  // Ensure page starts at top on initial load (no hash)
  useEffect(() => {
    if (!loc.hash) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
    setIsInitialMount(false);
  }, []);

  // Optional: keep your instant scroll-to-top on route change (after initial load)
  useEffect(() => {
    if (isInitialMount) return;
    // Don't scroll to top if there's a hash in the URL (let Header handle it)
    if (loc.hash) return;
    
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc.pathname, loc.hash, isInitialMount]);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100dvh" }}>
      <Header
        loginHref="/login"
        signupHref="/signup"
        accountHref="/account"
      />
      {/* React Router handles scroll restoration between entries */}
      <ScrollRestoration />
      <Outlet />
      <Footer />
    </div>
  );
}
