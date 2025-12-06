import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OAuthCallback from "./pages/OAuthCallback";
import FirebaseTest from "./pages/FirebaseTest";
import NotFound from "./pages/NotFound";
import { dataAggregationService } from "./services/dataAggregationService";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize data aggregation service on app start
    dataAggregationService.initialize().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen tahoe-text relative z-20 no-flash">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
                   <Routes>
                     <Route path="/" element={<Index />} />
                     <Route path="/auth" element={<Auth />} />
                     <Route path="/oauth/callback" element={<OAuthCallback />} />
                     <Route path="/firebase-test" element={<FirebaseTest />} />
                     {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                     <Route path="*" element={<NotFound />} />
                   </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
