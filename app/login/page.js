"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const errorRef = useRef(null);
  const [notice, setNotice] = useState(null); // {type:'success'|'error', text}

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1") {
      setNotice({ type: "success", text: "Email verified! You can now sign in." });
    } else if (params.get("verifyError") === "invalid") {
      setNotice({
        type: "error",
        text: "Verification link is invalid or expired. Sign in and request a new one.",
      });
    } else if (params.get("verifyError") === "server") {
      setNotice({
        type: "error",
        text: "Something went wrong verifying your email. Please try again.",
      });
    } else if (params.get("registered") === "true") {
      setNotice({
        type: "success",
        text: "Account created. Check your inbox for a verification link.",
      });
    }
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  useEffect(() => {
    let mounted = true;

    async function loadProviders() {
      const providers = await getProviders();
      if (!mounted) return;
      setGoogleEnabled(Boolean(providers?.google));
    }

    loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--white)", fontSize: 18, fontWeight: 700 }}>
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="5" fill="white"/><path d="M5 14V6l5 4-5 4zm5 0V6l5 4-5 4z" fill="#09090b"/></svg>
            MultiUploads
          </Link>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: "36px 32px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4, textAlign: "center" }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 28, textAlign: "center" }}>Sign in to your account</p>

          {notice && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background:
                  notice.type === "success"
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(239,68,68,0.1)",
                border:
                  notice.type === "success"
                    ? "1px solid rgba(34,197,94,0.25)"
                    : "1px solid rgba(239,68,68,0.25)",
                color: notice.type === "success" ? "#22c55e" : "#ef4444",
                fontSize: 13,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {notice.text}
            </div>
          )}

          {error && (
            <div ref={errorRef} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input"
                id="login-email"
                style={{ height: 44 }}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--t2)" }}>Password</label>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  className="input"
                  id="login-password"
                  style={{ height: 44, paddingRight: 56 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--t3)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 8px", borderRadius: 6 }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              id="login-submit"
              style={{ width: "100%", marginTop: 20, height: 44, fontSize: 14, borderRadius: 10, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--bg)", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }}></span>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {googleEnabled && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }}></div>
                <span style={{ fontSize: 12, color: "var(--t4)", fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }}></div>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                id="login-google"
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid var(--border-h)",
                  background: "transparent",
                  color: "var(--t2)",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "all 0.2s",
                  opacity: googleLoading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--t4)"; e.currentTarget.style.color = "var(--white)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-h)"; e.currentTarget.style.color = "var(--t2)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? "Redirecting..." : "Sign in with Google"}
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--t3)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--white)", fontWeight: 600, textDecoration: "none" }}>Create one</Link>
        </p>

        <p style={{ textAlign: "center", marginTop: 12, fontSize: 13 }}>
          <Link href="/" style={{ color: "var(--t4)", textDecoration: "none" }}>Back to home</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
