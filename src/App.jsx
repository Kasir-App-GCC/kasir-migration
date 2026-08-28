import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React, { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import BlockedScreen from '@/components/BlockedScreen';
import ScrollToTop from './components/ScrollToTop';
import { StoreProvider } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import RequireAuth from "@/components/RequireAuth";
import ErrorBoundary from "@/components/ErrorBoundary";

// Route-level code splitting: every page is lazy-loaded so a non-admin user
// never downloads the Admin bundle (and its ~20 sub-components) on first
// load. Auth/layout wrappers stay eager so the shell renders immediately.
const Login = React.lazy(() => import("@/pages/Login"));
const Register = React.lazy(() => import("@/pages/Register"));
const ForgotPassword = React.lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@/pages/ResetPassword"));
const Home = React.lazy(() => import("@/pages/Home"));
const Search = React.lazy(() => import("@/pages/Search"));
const Sell = React.lazy(() => import("@/pages/Sell"));
const Chats = React.lazy(() => import("@/pages/Chats"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const ItemDetail = React.lazy(() => import("@/pages/ItemDetail"));
const ChatRoom = React.lazy(() => import("@/pages/ChatRoom"));
const Notifications = React.lazy(() => import("@/pages/Notifications"));
const ProfileSetup = React.lazy(() => import("@/pages/ProfileSetup"));
const UserProfile = React.lazy(() => import("@/pages/UserProfile"));
const ShoppingAssistant = React.lazy(() => import("@/pages/ShoppingAssistant"));
const EditListing = React.lazy(() => import("@/pages/EditListing"));
const MapView = React.lazy(() => import("@/pages/MapView"));
const Admin = React.lazy(() => import("@/pages/Admin"));
const BuyRequests = React.lazy(() => import("@/pages/BuyRequests"));
const Terms = React.lazy(() => import("@/pages/Terms"));
const About = React.lazy(() => import("@/pages/About"));

function RouteFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, blocked, blockedReason } = useAuth();

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
    return (
      <Suspense fallback={<RouteFallback />}>
        <ProfileSetup />
      </Suspense>
    );
  }

  // Render the main app — AppLayout (nav, topbar) persists across route
  // changes; only the page content animates (handled inside AppLayout).
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* Public browse pages — open to everyone, no login required (SEO-indexable) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
        </Route>
        {/* Action flows + AI features — login required (protects integration credits) */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/sell" element={<Sell />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/assistant" element={<ShoppingAssistant />} />
          <Route path="/edit/:id" element={<EditListing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/buy-requests" element={<BuyRequests />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <StoreProvider>
          <Router>
            <ScrollToTop />
            <ErrorBoundary>
            <AuthenticatedApp />
            </ErrorBoundary>
          </Router>
        </StoreProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App