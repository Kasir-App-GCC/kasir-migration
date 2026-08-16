import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { StoreProvider } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import RequireAuth from "@/components/RequireAuth";
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

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

  // Require profile completion before entering the app
  if (user && !(user.first_name && user.username)) {
    return <ProfileSetup />;
  }

  // Render the main app
  return (
    <Routes>
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
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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