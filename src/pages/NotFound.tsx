import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="text-center tahoe-glass-lg p-12">
        <h1 className="tahoe-title-lg mb-6">404</h1>
        <p className="tahoe-text-lg opacity-70 mb-8">Oops! Page not found</p>
        <a href="/" className="tahoe-button-primary inline-flex items-center tahoe-transition">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
