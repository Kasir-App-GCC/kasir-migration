import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  // Periodically re-check blacklist status so a ban applied mid-session kicks the user out
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      checkBlacklistStatus();
    }, 30000); // every 30s
    const onFocus = () => { checkBlacklistStatus(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [isAuthenticated]);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkBlacklistStatus = async () => {
    try {
      const res = await base44.functions.invoke("checkBlacklist", {});
      if (res?.data?.blocked) {
        setBlocked(true);
        setBlockedReason(res.data.reason || null);
        // Keep the user on the BlockedScreen (it covers the whole app). Do NOT
        // call logout() here — the SDK's logout() reloads the page, which would
        // flash the BlockedScreen for a moment and then bounce to login. The
        // BlockedScreen has its own Log out button for the user to end the session.
        return true;
      } else {
        setBlocked(false);
        setBlockedReason(null);
      }
    } catch {
      // A transient network/infra error must NOT lift an existing ban — only a
      // successful "not blocked" response should. Otherwise a blip mid-session
      // would briefly unblock a banned user until the next poll.
    }
    return false;
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      // Throttle last_active to once per 30 min so we don't write on every load.
      try {
        const ts = Number(localStorage.getItem("souqi_last_active_ts") || 0);
        if (Date.now() - ts > 30 * 60 * 1000) {
          localStorage.setItem("souqi_last_active_ts", String(Date.now()));
          base44.auth.updateMe({ last_active: new Date().toISOString() }).catch(() => {});
        }
      } catch {}
      // Check if this user is blacklisted
      await checkBlacklistStatus();
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  // Silently re-fetch the current user (e.g. after profile/verification
  // changes) without toggling the full-screen auth loading overlay.
  const refreshUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch {}
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Redirect to the in-app login page, preserving the current path via returnTo
    const current = window.location.pathname + window.location.search;
    const returnTo = current && current !== "/" ? encodeURIComponent(current) : "";
    window.location.href = "/login" + (returnTo ? `?returnTo=${returnTo}` : "");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      blocked,
      blockedReason,
      logout,
      navigateToLogin,
      checkUserAuth,
      refreshUser,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};