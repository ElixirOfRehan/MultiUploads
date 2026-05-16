"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { evaluatePassword, MIN_SCORE } from "../../lib/password";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const errorRef = useRef(null);

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

  const getPasswordStrength = (pw) => evaluatePassword(pw, [form.name, form.email]);

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.password, form.name, form.email]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!strength.ok) {
      setError(strength.warning || "Please choose a stronger password (Good or Strong).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      const loginRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/login?registered=true");
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
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4, textAlign: "center" }}>Create your account</h1>
          <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 28, textAlign: "center" }}>Start uploading to every platform</p>

          {error && (
            <div ref={errorRef} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 6 }}>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
                className="input"
                id="signup-name"
                style={{ height: 44 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input"
                id="signup-email"
                style={{ height: 44 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters, hard to guess"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input"
                  id="signup-password"
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
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : "var(--bg-hover)", transition: "background 0.3s" }}></div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, color: strength.color, fontWeight: 500 }}>
                    {strength.label}{strength.ok ? "" : " — not accepted"}
                  </p>
                  {!strength.ok && (strength.warning || strength.suggestions.length > 0) && (
                    <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                      {strength.warning && (
                        <p style={{ fontSize: 11, color: "#ef4444", margin: 0 }}>{strength.warning}</p>
                      )}
                      {strength.suggestions.length > 0 && (
                        <ul style={{ fontSize: 11, color: "var(--t3)", margin: "4px 0 0", paddingLeft: 16 }}>
                          {strength.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--t2)", marginBottom: 6 }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input"
                  id="signup-confirm"
                  style={{ height: 44, paddingRight: 56 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--t3)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "6px 8px", borderRadius: 6 }}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {form.confirmPassword && (
                form.password === form.confirmPassword ? (
                  <p style={{ fontSize: 11, color: "#22c55e", marginTop: 4, fontWeight: 500 }}>✓ Passwords match</p>
                ) : (
                  <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>Passwords don&apos;t match</p>
                )
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              id="signup-submit"
              style={{ width: "100%", marginTop: 20, height: 44, fontSize: 14, borderRadius: 10, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--bg)", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }}></span>
                  Creating account...
                </span>
              ) : (
                "Create account"
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
                id="signup-google"
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
                {googleLoading ? "Redirecting..." : "Sign up with Google"}
              </button>
            </>
          )}

          <p style={{ fontSize: 11, color: "var(--t4)", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
            By creating an account, you agree to our{" "}
            <a href="#" style={{ color: "var(--t3)", textDecoration: "underline" }}>Terms of Service</a>{" "}
            and{" "}
            <a href="#" style={{ color: "var(--t3)", textDecoration: "underline" }}>Privacy Policy</a>.
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--t3)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--white)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
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
