import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BlockedScreen from '@/components/BlockedScreen';
import ScrollToTop from './components/ScrollToTop';
import { StoreProvider } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import RequireAuth from "@/components/RequireAuth";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Sell from "@/pages/Sell";
import Chats from "@/pages/Chats";
import Profile from "@/pages/Profile";
import ItemDetail from "@/pages/ItemDetail";
import ChatRoom from "@/pages/ChatRoom";
import Notifications from "@/pages/Notifications";
import ProfileSetup from "@/pages/ProfileSetup";
import UserProfile from "@/pages/UserProfile";
import ShoppingAssistant from "@/pages/ShoppingAssistant";
import EditListing from "@/pages/EditListing";
import MapView from "@/pages/MapView";
import Admin from "@/pages/Admin";

function routeDepth(pathname) {
  if (pathname === "/") return 0;
  if (/^\/(item|chat|edit|user)\//.test(pathname)) return 3;
  if (/^\/(notifications|assistant|map|admin)$/.test(pathname)) return 2;
  return 1;
}

const pageVariants = {
  enter: (dir) => ({
    x: dir === 0 ? 0 : dir > 0 ? "100%" : "-100%",
    opacity: dir === 0 ? 0 : 1,
    transition: dir === 0 ? { duration: 0.18 } : { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
  }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
  exit: (dir) => ({
    x: dir === 0 ? 0 : dir > 0 ? "-100%" : "100%",
    opacity: dir === 0 ? 0 : 1,
    transition: dir === 0 ? { duration: 0.18 } : { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
  }),
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, blocked, blockedReason } = useAuth();
  const location = useLocation();
  const depth = routeDepth(location.pathname);
  const depthRef = useRef(depth);
  const direction = depth > depthRef.current ? 1 : depth < depthRef.current ? -1 : 0;
  depthRef.current = depth;

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Block blacklisted users from entering the app
  if (blocked) {
    return <BlockedScreen reason={blockedReason} />;
  }

  // Require profile completion before entering the app
  if (user && !(user.first_name && user.username)) {
    return <ProfileSetup />;
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div key={location.pathname} custom={direction} variants={pageVariants} initial="enter" animate="center" exit="exit">
      <Routes location={location}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/sell" element={<Sell />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/chat/:id" element={<ChatRoom />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/assistant" element={<ShoppingAssistant />} />
        <Route path="/edit/:id" element={<EditListing />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
      </Routes>
      </motion.div>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <StoreProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
        </StoreProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App