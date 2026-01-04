import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Deals from "./pages/Deals";
import Learn from "./pages/Learn";
import Healthcare from "./pages/Healthcare";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Transportation from "./pages/deals/Transportation";
import Hotels from "./pages/deals/Hotels";
import Tasks from "./pages/deals/Tasks";
import Jobs from "./pages/deals/Jobs";
import Agriculture from "./pages/deals/Agriculture";
import Food from "./pages/deals/Food";
import RealEstate from "./pages/deals/RealEstate";
import Booking from "./pages/deals/Booking";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/deals/booking" element={<Booking />} />
                    <Route path="/deals/tasks" element={<Tasks />} />
                    <Route path="/deals/transportation" element={<Transportation />} />
                    <Route path="/deals/hotels" element={<Hotels />} />
                    <Route path="/deals/real-estate" element={<RealEstate />} />
                    <Route path="/deals/jobs" element={<Jobs />} />
                    <Route path="/deals/agriculture" element={<Agriculture />} />
                    <Route path="/deals/food" element={<Food />} />
                    <Route path="/learn" element={<Learn />} />
                    <Route path="/healthcare" element={<Healthcare />} />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <Account />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
