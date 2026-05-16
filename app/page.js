"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

/* ── Scroll Reveal ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.05 }
    );
    el.querySelectorAll(".reveal").forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Animated Number ── */
function Counter({ to }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const ran = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true;
        const s = performance.now();
        const tick = (now) => {
          const p = Math.min((now - s) / 1500, 1);
          setV(Math.floor((1 - Math.pow(1 - p, 3)) * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{v.toLocaleString()}</span>;
}

/* ── Smooth Typing Effect ── */
function TypeWriter({ words }) {
  const [display, setDisplay] = useState(words[0]);
  const stateRef = useRef({ idx: 0, charIdx: words[0].length, deleting: false, paused: true });
  const timerRef = useRef(null);
  useEffect(() => {
    // Start deleting after initial pause
    timerRef.current = setTimeout(() => {
      stateRef.current.paused = false;
      stateRef.current.deleting = true;
      runTick();
    }, 2200);
    function runTick() {
      const s = stateRef.current;
      const word = words[s.idx];
      if (!s.deleting) {
        s.charIdx++;
        setDisplay(word.slice(0, s.charIdx));
        if (s.charIdx >= word.length) {
          s.paused = true;
          timerRef.current = setTimeout(() => { s.deleting = true; s.paused = false; runTick(); }, 2200);
          return;
        }
      } else {
        s.charIdx--;
        setDisplay(word.slice(0, s.charIdx));
        if (s.charIdx <= 0) {
          s.deleting = false;
          s.idx = (s.idx + 1) % words.length;
          timerRef.current = setTimeout(() => runTick(), 300);
          return;
        }
      }
      timerRef.current = setTimeout(runTick, s.deleting ? 30 : 65);
    }
    return () => clearTimeout(timerRef.current);
  }, [words]);
  return (
    <span style={{
      background: "linear-gradient(135deg, #fafafa 0%, #a1a1aa 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}>
      {display || "\u00A0"}
      <span style={{
        display: "inline-block",
        width: 2,
        height: "0.85em",
        background: "#a1a1aa",
        marginLeft: 3,
        verticalAlign: "text-bottom",
        animation: "cursorBlink 1s step-end infinite",
        WebkitTextFillColor: "#a1a1aa",
      }}></span>
    </span>
  );
}

/* ── Data ── */
const platforms = [
  { name: "YouTube", c: "#ff0000", icon: "▶" },
  { name: "Instagram", c: "#e1306c", icon: "◉" },
  { name: "TikTok", c: "#00f2ea", icon: "♪" },
  { name: "Facebook", c: "#1877f2", icon: "f" },
  { name: "X", c: "#aaa", icon: "𝕏" },
  { name: "LinkedIn", c: "#0a66c2", icon: "in" },
];

const pricing = [
  { name: "Free", price: "₹0", sub: "", note: "No card needed", features: ["2 videos/week", "YouTube + Facebook", "No watermarks", "Basic tracking", "Community support"], pop: false },
  { name: "Lite", price: "₹49", sub: "/mo", note: "< ₹2/day", features: ["5 videos/week", "YouTube + Facebook + Instagram", "No watermarks", "AI metadata", "Email support"], pop: false },
  { name: "Growth", price: "₹99", sub: "/mo", note: "Best for creators", features: ["12 videos/week", "All platforms", "No watermarks", "AI metadata + captions", "Unified analytics", "Priority support"], pop: true },
  { name: "Pro", price: "₹249", sub: "/mo", note: "Full-time creators", features: ["Unlimited videos", "All platforms", "No watermarks", "AI smart clips", "Advanced analytics", "1-on-1 support"], pop: false },
];

const faqs = [
  { q: "Is it really free?", a: "Yes. 2 videos per week to YouTube and Facebook, forever. No watermarks, no credit card, no trial expiry." },
  { q: "How is this different from Buffer?", a: "Buffer schedules text posts. We actually process video — format detection, resolution conversion, platform-specific encoding and metadata. Built for video creators, not social media managers." },
  { q: "Will quality be reduced?", a: "No. We use FFmpeg, the same engine YouTube and Netflix use. Your video is re-encoded at optimal settings for each platform without visible quality loss." },
  { q: "What's the AI Clip Engine?", a: "After 3 days live, we analyze audience retention data, find peak engagement moments, and generate contextual clips that work as standalone short-form content. Coming in Phase 2." },
  { q: "Can I cancel anytime?", a: "Instantly. No contracts, no fees, no questions." },
];

const testimonials = [
  { name: "Arjun M.", role: "Tech YouTuber · 45K subs", text: "I used to spend 2 hours just reformatting for Reels and Shorts. Now it's one click. Genuinely life-changing.", avatar: "A", color: "#7c3aed" },
  { name: "Priya S.", role: "Lifestyle Creator · 12K followers", text: "The AI metadata alone is worth it. My TikTok hooks are so much better now — views went up 3x in the first week.", avatar: "P", color: "#ec4899" },
  { name: "Rohan K.", role: "Fitness Coach · 8K subs", text: "I tried Buffer, Hootsuite, everything. None of them actually handle video. MultiUploads just gets it.", avatar: "R", color: "#06b6d4" },
];

/* ══════════ MINI DASHBOARD MOCKUP ══════════ */
function DashboardMockup() {
  const [progress, setProgress] = useState([0, 0, 0, 0]);
  const ref = useRef(null);
  const ran = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true;
        const targets = [100, 100, 100, 100];
        const delays = [200, 600, 1000, 1400];
        delays.forEach((d, i) => {
          setTimeout(() => {
            const start = performance.now();
            const animate = (now) => {
              const p = Math.min((now - start) / 1200, 1);
              setProgress(prev => { const n = [...prev]; n[i] = Math.floor(p * targets[i]); return n; });
              if (p < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }, d);
        });
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const mockPlatforms = [
    { name: "YouTube", color: "#ff0000", icon: "▶" },
    { name: "Instagram", color: "#e1306c", icon: "◉" },
    { name: "TikTok", color: "#00f2ea", icon: "♪" },
    { name: "Facebook", color: "#1877f2", icon: "f" },
  ];

  return (
    <div ref={ref} className="mockup-container">
      <div className="mockup-card" style={{ padding: 0 }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }}></div>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }}></div>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }}></div>
          </div>
          <p style={{ fontSize: 11, color: "var(--t4)", marginLeft: 8 }}>MultiUploads Dashboard</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {/* Left — Video Preview */}
          <div style={{ padding: 20, borderRight: "1px solid var(--border)" }}>
            <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 10, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, marginLeft: 3 }}>▶</span>
              </div>
              <div style={{ position: "absolute", bottom: 8, right: 8, padding: "2px 8px", borderRadius: 4, background: "rgba(0,0,0,0.6)", fontSize: 10, color: "white" }}>12:34</div>
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Morning Routine in 30 Days</p>
            <p style={{ fontSize: 10, color: "var(--t4)" }}>Uploaded just now · Processing</p>
          </div>

          {/* Right — Platform Status */}
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Distributing to</p>
            {mockPlatforms.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: `${p.color}18`, border: `1px solid ${p.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: p.color, fontWeight: 700 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: progress[i] === 100 ? "#22c55e" : "var(--t4)" }}>{progress[i] === 100 ? "✓ Live" : `${progress[i]}%`}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: "var(--bg-hover)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: progress[i] === 100 ? "#22c55e" : p.color, width: `${progress[i]}%`, transition: "width 0.1s" }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════ FLOW ANIMATION ══════════ */
function FlowDiagram() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
      {/* Source */}
      <div className="float" style={{ width: 80, height: 80, borderRadius: 14, background: "linear-gradient(135deg, #667eea, #764ba2)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 24 }}>🎬</span>
        <span style={{ fontSize: 8, fontWeight: 600 }}>1 Video</span>
      </div>

      {/* Arrows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--t4)" }}>
        <span style={{ fontSize: 16 }}>→</span>
        <span style={{ fontSize: 16 }}>→</span>
        <span style={{ fontSize: 16 }}>→</span>
      </div>

      {/* MultiUploads */}
      <div className="float float-delay glow-border" style={{ width: 100, height: 80, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border-h)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="5" fill="white"/><path d="M5 14V6l5 4-5 4zm5 0V6l5 4-5 4z" fill="#09090b"/></svg>
        <span style={{ fontSize: 8, fontWeight: 600, color: "var(--t2)" }}>MultiUploads</span>
      </div>

      {/* Arrows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--t4)" }}>
        <span style={{ fontSize: 16 }}>→</span>
        <span style={{ fontSize: 16 }}>→</span>
        <span style={{ fontSize: 16 }}>→</span>
      </div>

      {/* Platforms */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[{ n: "YouTube", c: "#ff0000", i: "▶" }, { n: "Instagram", c: "#e1306c", i: "◉" }, { n: "TikTok", c: "#00f2ea", i: "♪" }, { n: "Facebook", c: "#1877f2", i: "f" }].map((p, i) => (
          <div key={i} className="float" style={{ animationDelay: `${i * 0.3}s`, display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 11 }}>
            <span style={{ width: 18, height: 18, borderRadius: 4, background: `${p.c}18`, border: `1px solid ${p.c}30`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: p.c, fontWeight: 700 }}>{p.i}</span>
            {p.n}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════ PAGE ════════════════ */
export default function Home() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [waitlistError, setWaitlistError] = useState("");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [faq, setFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const page = useReveal();

  useEffect(() => {
    let cancelled = false;

    async function loadWaitlistCount() {
      try {
        const res = await fetch("/api/waitlist", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setWaitlistCount(data.count || 0);
      } catch {
        if (!cancelled) {
          setWaitlistCount(0);
        }
      }
    }

    loadWaitlistCount();

    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    setWaitlistError("");
    setWaitlistMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join the waitlist.");
      }

      setWaitlistMessage(data.message || "You are on the waitlist.");
      if (data.created) {
        setWaitlistCount((count) => count + 1);
      }
      setSent(true);
    } catch (error) {
      setWaitlistError(error.message || "Failed to join the waitlist.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={page}>
      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .desktop-btns { display: none !important; }
          .hamburger { display: flex !important; }
          .mobile-menu { display: flex !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 360px; margin: 0 auto; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .problem-grid { grid-template-columns: 1fr !important; }
          .comparison-row { flex-direction: column !important; }
          .flow-diagram { transform: scale(0.85); }
          .mockup-grid { grid-template-columns: 1fr !important; }
          .scarcity-bar { flex-direction: column !important; text-align: center; }
          .waitlist-form { flex-direction: column !important; }
          .waitlist-form .input { width: 100% !important; flex: none !important; }
          .waitlist-form .btn-primary { width: 100% !important; flex-shrink: 0 !important; }
          .footer-inner { flex-direction: column !important; text-align: center; gap: 12px !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* ── Nav ── */}
      <nav className="nav-bar">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="5" fill="white"/><path d="M5 14V6l5 4-5 4zm5 0V6l5 4-5 4z" fill="#09090b"/></svg>
            MultiUploads
          </Link>

          <div className="nav-links desktop-menu">
            <Link href="/" className="nav-link active">Home</Link>
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            <a href="#faq" className="nav-link">FAQ</a>
          </div>

          <div className="nav-actions desktop-btns">
            {session ? (
              <>
                {session.user.role === "admin" && (
                  <Link href="/admin" className="nav-link" style={{ fontSize: 12, color: "#ef4444" }}>Admin</Link>
                )}
                <Link href="/dashboard" className="btn-secondary btn-nav">Dashboard</Link>
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => signOut({ callbackUrl: "/" })}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-hover)", border: "1px solid var(--border-h)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary btn-nav">Sign in</Link>
                <a href="#waitlist" className="btn-primary btn-nav">Get early access</a>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", flexDirection: "column", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            <span style={{ width: 18, height: 2, background: "var(--white)", borderRadius: 1, transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none" }}></span>
            <span style={{ width: 18, height: 2, background: "var(--white)", borderRadius: 1, transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }}></span>
            <span style={{ width: 18, height: 2, background: "var(--white)", borderRadius: 1, transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none" }}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mobile-menu" style={{ display: "none", flexDirection: "column", gap: 0, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
            {[{l:"Home",h:"/"},{l:"Features",h:"#features"},{l:"Pricing",h:"#pricing"},{l:"Dashboard",h:"/dashboard"},{l:"FAQ",h:"#faq"}].map((x) => (
              x.h.startsWith("#") ? (
                <a key={x.l} href={x.h} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 32px", fontSize: 14, color: "var(--t2)", textDecoration: "none" }}>{x.l}</a>
              ) : (
                <Link key={x.l} href={x.h} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "12px 32px", fontSize: 14, color: "var(--t2)", textDecoration: "none" }}>{x.l}</Link>
              )
            ))}
            <div style={{ display: "flex", gap: 10, padding: "12px 32px" }}>
              {session ? (
                <>
                  <Link href="/dashboard" className="btn-primary btn-sm" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: "center" }}>Dashboard</Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary btn-sm" style={{ flex: 1, textAlign: "center" }}>Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary btn-sm" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: "center" }}>Sign in</Link>
                  <a href="#waitlist" className="btn-primary btn-sm" style={{ flex: 1, textAlign: "center" }}>Get early access</a>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="wrap" style={{ textAlign: "center", paddingTop: 140, paddingBottom: 24, position: "relative" }}>
        <div className="hero-glow"></div>

        <div className="reveal" style={{ marginBottom: 28 }}>
          <span className="pill" style={{ color: "var(--green)", borderColor: "rgba(34,197,94,0.3)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "glowPulse 2s ease-in-out infinite" }}></span>
            <Counter to={waitlistCount} /> creators on waitlist
          </span>
        </div>

        <h1 className="reveal d1" style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20 }}>
          Upload once.<br />
          <TypeWriter words={["Reach every platform.", "Save hours daily.", "Grow 10x faster."]} />
        </h1>

        <p className="reveal d2" style={{ fontSize: "clamp(14px, 1.5vw, 16px)", color: "var(--t2)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto 32px" }}>
          We distribute your video to YouTube, Instagram, TikTok & more — with the right format, metadata, and captions for each platform.
        </p>

        <div className="reveal d3" style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <a href="#waitlist" className="btn-primary">Start free →</a>
          <a href="#features" className="btn-secondary">See how it works</a>
        </div>

        <p className="reveal d4" style={{ fontSize: 12, color: "var(--t4)", marginBottom: 8 }}>
          No credit card · 2 min setup · Cancel anytime
        </p>

        {/* Social proof avatars */}
        <div className="reveal d5" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
          {["A", "P", "R", "S", "M"].map((l, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: ["#7c3aed", "#ec4899", "#06b6d4", "#f59e0b", "#22c55e"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, border: "2px solid var(--bg)", marginLeft: i > 0 ? -8 : 0 }}>{l}</div>
          ))}
          <p style={{ fontSize: 12, color: "var(--t3)", marginLeft: 8 }}>Joined by {waitlistCount} creators</p>
        </div>
      </section>

      {/* ── Product Mockup ── */}
      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div className="reveal d2" style={{ maxWidth: 620, margin: "0 auto" }}>
          <DashboardMockup />
        </div>
      </section>

      {/* ── Platforms ── */}
      <section className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <p className="reveal" style={{ textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginBottom: 20 }}>
          Distribute to
        </p>
        <div className="reveal d1" style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {platforms.map((p, i) => (
            <div key={i} className="shine" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 13, color: "var(--t2)", transition: "all 0.3s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${p.c}40`; e.currentTarget.style.color = p.c; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--t2)"; }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.c, display: "inline-block" }}></span>
              {p.name}
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Numbers ── */}
      <section className="wrap" style={{ paddingTop: 56, paddingBottom: 56, textAlign: "center" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {[{ n: 12, s: "+", l: "Hours saved/month" }, { n: 6, l: "Platforms" }, { n: 2, l: "Min to distribute" }, { n: waitlistCount, l: "On waitlist" }].map((x, i) => (
            <div key={i} className={`reveal d${i + 1}`}>
              <p style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 700, letterSpacing: "-0.02em" }}><Counter to={x.n} />{x.s || ""}</p>
              <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 4 }}>{x.l}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── How It Works — Visual Flow ── */}
      <section id="how" className="wrap" style={{ paddingTop: 72, paddingBottom: 72, textAlign: "center" }}>
        <p className="reveal section-label">How it works</p>
        <h2 className="reveal d1 section-title" style={{ marginBottom: 40 }}>
          One video. Every platform.<br />
          <span style={{ color: "var(--t3)" }}>Automatically.</span>
        </h2>

        <div className="reveal d2" style={{ marginBottom: 40 }}>
          <FlowDiagram />
        </div>

        <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 840, margin: "0 auto" }}>
          {[
            { n: "01", t: "Connect", d: "Link your YouTube, Instagram, TikTok accounts via secure OAuth. Takes 30 seconds.", icon: "🔗" },
            { n: "02", t: "Upload", d: "Drag & drop your video. We auto-detect format, resolution, and aspect ratio.", icon: "📤" },
            { n: "03", t: "Distribute", d: "One click — your video goes live on every platform with optimized metadata.", icon: "🚀" },
          ].map((s, i) => (
            <div key={i} className={`reveal d${i + 1} card shine`} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-hover)", border: "1px solid var(--border-h)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, margin: "0 auto 12px", fontFamily: "monospace", color: "var(--t3)" }}>{s.n}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{s.t}</h3>
              <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Problem ── */}
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 72, textAlign: "center" }}>
        <p className="reveal section-label">The problem</p>
        <h2 className="reveal d1 section-title" style={{ maxWidth: 480, margin: "0 auto 36px" }}>
          You&apos;re spending hours<br />uploading, not creating.
        </h2>

        <div className="reveal d2 problem-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 500, margin: "0 auto" }}>
          {[
            { t: "40 min", d: "Reformatting for each platform", icon: "🔄" },
            { t: "25 min", d: "Writing titles & hashtags", icon: "✍️" },
            { t: "15 min", d: "Uploading individually", icon: "⏳" },
            { t: "20 min", d: "Checking & re-uploading", icon: "🔁" },
          ].map((x, i) => (
            <div key={i} className="card shine" style={{ textAlign: "center", padding: 20 }}>
              <p style={{ fontSize: 18, marginBottom: 4 }}>{x.icon}</p>
              <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{x.t}</p>
              <p style={{ fontSize: 12, color: "var(--t3)" }}>{x.d}</p>
            </div>
          ))}
        </div>

        <div className="reveal d3 comparison-row" style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ padding: "12px 24px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginBottom: 2 }}>WITHOUT MultiUploads</p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>~100 min <span style={{ fontSize: 12, color: "var(--t4)", fontWeight: 400 }}>per video</span></p>
          </div>
          <span style={{ color: "var(--t4)", fontSize: 20 }}>→</span>
          <div style={{ padding: "12px 24px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <p style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, marginBottom: 2 }}>WITH MultiUploads</p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>2 min <span style={{ fontSize: 12, color: "var(--t4)", fontWeight: 400 }}>per video</span></p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── Features ── */}
      <section id="features" className="wrap" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
        <p className="reveal section-label">Features</p>
        <h2 className="reveal d1 section-title" style={{ marginBottom: 40 }}>
          Everything you need to<br /><span className="gradient-text">create more, upload less.</span>
        </h2>

        <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 780, margin: "0 auto" }}>
          {[
            { t: "Smart format detection", d: "We analyze resolution, duration, and aspect ratio to route your video correctly.", icon: "🔍" },
            { t: "Auto-resize & encode", d: "16:9 to 9:16, letterbox, crop — every platform gets the right format.", icon: "📐" },
            { t: "AI metadata", d: "SEO titles for YouTube, hooks for TikTok, hashtags for Instagram — auto-generated.", icon: "🤖" },
            { t: "Unified analytics", d: "Views, likes, retention — every platform in one dashboard.", icon: "📊" },
            { t: "Auto-captions", d: "AI transcription with burned-in animated subtitles. +40% watch time.", icon: "💬" },
            { t: "AI Clip Engine", d: "Find peak moments, expand context, generate smart clips. Coming soon.", tag: true, icon: "✂️" },
          ].map((f, i) => (
            <div key={i} className={`reveal d${(i % 4) + 1} card shine`} style={{ textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>{f.t}</h3>
                </div>
                {f.tag && <span className="pill" style={{ fontSize: 10, padding: "2px 10px", height: 22 }}>Soon</span>}
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Testimonials ── */}
      <section className="wrap" style={{ paddingTop: 72, paddingBottom: 72, textAlign: "center" }}>
        <p className="reveal section-label">What creators say</p>
        <h2 className="reveal d1 section-title" style={{ marginBottom: 36 }}>
          Trusted by creators<br /><span style={{ color: "var(--t3)" }}>who value their time.</span>
        </h2>

        <div className="testimonials-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 920, margin: "0 auto" }}>
          {testimonials.map((t, i) => (
            <div key={i} className={`reveal d${i + 1} testimonial-card`} style={{ textAlign: "left" }}>
              <div style={{ display: "flex", marginBottom: 10 }}>
                {[...Array(5)].map((_, j) => <span key={j} style={{ color: "#f59e0b", fontSize: 13 }}>★</span>)}
              </div>
              <p style={{ fontSize: 13, color: "var(--t1)", lineHeight: 1.7, marginBottom: 14, fontStyle: "italic" }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: "var(--t4)" }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Pricing ── */}
      <section id="pricing" className="wrap" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
        <p className="reveal section-label">Pricing</p>
        <h2 className="reveal d1 section-title" style={{ marginBottom: 8 }}>
          Honest pricing.
        </h2>
        <p className="reveal d2" style={{ fontSize: 14, color: "var(--t2)", marginBottom: 40 }}>Start free. Upgrade when ready.</p>

        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {pricing.map((p, i) => (
            <div key={i} className={`reveal d${i + 1} price-card ${p.pop ? "popular" : ""}`}>
              {p.pop && <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--t2)", marginBottom: 10, padding: "3px 12px", border: "1px solid var(--border-h)", borderRadius: 999, display: "inline-block" }}>Popular</p>}
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{p.name}</h3>
              <p style={{ fontSize: 11, color: "var(--t4)", marginBottom: 14 }}>{p.note}</p>
              <p style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{p.price}</span>
                <span style={{ fontSize: 13, color: "var(--t4)" }}>{p.sub}</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, textAlign: "left" }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)" }}>
                    <span style={{ color: "#22c55e", fontSize: 12 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button className={p.pop ? "btn-primary btn-sm" : "btn-secondary btn-sm"} style={{ width: "100%" }}>
                {p.price === "₹0" ? "Start free" : "Get started"}
              </button>
            </div>
          ))}
        </div>

        {/* Scarcity bar */}
        <div className="reveal card glow-border scarcity-bar" style={{ marginTop: 20, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="pill" style={{ color: "var(--amber)", borderColor: "rgba(245,158,11,0.3)", fontSize: 11, padding: "3px 12px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", display: "inline-block" }}></span>
            Limited
          </span>
          <p style={{ fontSize: 13, color: "var(--t2)" }}>
            First 50 users get Growth features at <strong style={{ color: "var(--white)" }}>₹49/mo forever</strong>. <strong style={{ color: "var(--white)" }}>23 spots left.</strong>
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* ── Waitlist ── */}
      <section id="waitlist" className="wrap" style={{ paddingTop: 100, paddingBottom: 100, textAlign: "center", position: "relative" }}>
        <div className="hero-glow" style={{ opacity: 0.4 }}></div>
        {!sent ? (
          <div style={{ maxWidth: 440, margin: "0 auto", position: "relative" }}>
            <p className="reveal section-label">Early access</p>
            <h2 className="reveal d1 section-title">
              Join the waitlist.
            </h2>
            <p className="reveal d2" style={{ fontSize: 14, color: "var(--t2)", marginBottom: 28 }}>
              We&apos;re onboarding in small batches. Drop your email — be among the first to try it.
            </p>
            <form onSubmit={submit} className="reveal d3 waitlist-form" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" style={{ flex: 1 }} id="waitlist-email" />
              <button type="submit" disabled={busy} className="btn-primary" style={{ flexShrink: 0, borderRadius: 10 }} id="waitlist-submit">
                {busy ? "..." : "Join free"}
              </button>
            </form>
            {waitlistError && (
              <p style={{ fontSize: 12, color: "#fca5a5", marginBottom: 12 }}>{waitlistError}</p>
            )}
            <p className="reveal d4" style={{ fontSize: 11, color: "var(--t4)" }}>No spam · No card · Unsubscribe anytime</p>

            <div className="reveal d5" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
              {["A", "P", "R"].map((l, i) => (
                <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: ["#7c3aed", "#ec4899", "#06b6d4"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, border: "2px solid var(--bg)", marginLeft: i > 0 ? -6 : 0 }}>{l}</div>
              ))}
              <p style={{ fontSize: 11, color: "var(--t4)", marginLeft: 6 }}>{waitlistCount} already joined</p>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "glowPulse 2s ease-in-out infinite" }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><path d="M5 10l4 4 6-6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>You&apos;re on the list! 🎉</h2>
            <p style={{ fontSize: 14, color: "var(--t2)" }}>{waitlistMessage || "You are on the waitlist."} We&apos;ll email <strong style={{ color: "var(--white)" }}>{email}</strong> when your spot is ready.</p>
          </div>
        )}
      </section>

      <div className="divider" />

      {/* ── FAQ ── */}
      <section id="faq" className="wrap" style={{ paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
        <p className="reveal section-label">FAQ</p>
        <h2 className="reveal d1 section-title" style={{ marginBottom: 36 }}>
          Questions? Answered.
        </h2>

        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "left" }}>
          {faqs.map((f, i) => (
            <div key={i} className={`reveal d${Math.min(i + 1, 4)} faq-item`}>
              <button className="faq-q" onClick={() => setFaq(faq === i ? null : i)}>
                <span>{f.q}</span>
                <span style={{ fontSize: 18, color: "var(--t4)", transition: "transform 0.2s", transform: faq === i ? "rotate(45deg)" : "none" }}>+</span>
              </button>
              {faq === i && <div className="faq-a">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── Footer ── */}
      <footer className="wrap footer-inner" style={{ paddingTop: 32, paddingBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="5" fill="white"/><path d="M5 14V6l5 4-5 4zm5 0V6l5 4-5 4z" fill="#09090b"/></svg>
          MultiUploads
        </div>
        <p style={{ fontSize: 12, color: "var(--t4)" }}>© 2026 MultiUploads. All rights reserved.</p>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--t3)" }}>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Terms</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>
      <div style={{ height: 16 }} />
    </div>
  );
}
