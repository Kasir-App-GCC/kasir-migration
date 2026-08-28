import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import AppleIcon from "@/components/AppleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAuth } from "@/lib/AuthContext";
import { appParams } from "@/lib/app-params";

// On mobile inside an iframe (e.g. the builder preview), the SDK's popup-based
// OAuth flow doesn't complete reliably — the popup tab can't postMessage back
// to the backgrounded opener, so the first Apple/Google tap silently fails and
// the user has to tap again. Break out of the iframe with a full-page redirect
// so OAuth runs in the top window, which always works in one tap.
// app_base_url is a client-controlled query param, so validate it against the
// trusted platform domain (*.base44.app) before performing a top-level
// redirect. An attacker otherwise could set app_base_url to an external host
// and phish users via the OAuth buttons. Fall back to the current origin.
const trustedBaseUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".base44.app");
  } catch {
    return false;
  }
};

const oauthRedirect = (provider, fromUrl) => {
  const inIframe = typeof window !== "undefined" && window.top && window !== window.top;
  const isMobile = typeof window !== "undefined" &&
    (window.matchMedia?.("(max-width: 767px)")?.matches ||
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || ""));
  if (inIframe && isMobile) {
    const redirectUrl = new URL(fromUrl, window.location.origin).toString();
    const providerPath = provider === "google" ? "" : `/${provider}`;
    const baseUrl = trustedBaseUrl(appParams.appBaseUrl) ? appParams.appBaseUrl : window.location.origin;
    const loginUrl = `${baseUrl}/api/apps/auth${providerPath}/login?app_id=${appParams.appId}&from_url=${encodeURIComponent(redirectUrl)}`;
    window.top.location.href = loginUrl;
    return;
  }
  base44.auth.loginWithProvider(provider, fromUrl);
};

export default function Login() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If an OAuth (Apple/Google) redirect lands back on /login with a valid
  // token already set, bounce to the post-login destination instead of
  // leaving the user staring at the login form. This is what made Apple
  // login feel like it needed two taps on mobile.
  useEffect(() => {
    if (isAuthenticated) navigate(safeReturnTo(), { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    oauthRedirect("google", safeReturnTo());
  };

  const handleApple = () => {
    oauthRedirect("apple", safeReturnTo());
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Sign in"
      subtitle="Log in to your account"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to={"/register" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <div className="space-y-3 mb-6">
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium"
          onClick={handleGoogle}
        >
          <GoogleIcon className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 text-sm font-medium"
          onClick={handleApple}
        >
          <AppleIcon className="w-5 h-5 mr-2" />
          Continue with Apple
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to={"/forgot-password" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
              dir="ltr"
              className="text-xs text-primary font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}