"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/data");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setVideos(data.videos || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId, plan) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, plan } : u));
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserRole = async (userId, role) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
      }
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm("Are you sure? This will delete the user and all their videos.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== userId));
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border-h)", borderTopColor: "var(--white)", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ fontSize: 14, color: "var(--t3)" }}>Loading admin panel...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (session?.user?.role !== "admin") return null;

  const S = {
    select: { height: 32, padding: "0 10px", fontSize: 12, color: "var(--white)", background: "var(--bg)", border: "1px solid var(--border-h)", borderRadius: 6, outline: "none", cursor: "pointer" },
  };

  const planColors = { free: "var(--t3)", lite: "#3b82f6", growth: "#f59e0b", pro: "#22c55e" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{ width: 200, borderRight: "1px solid var(--border)", padding: "20px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, background: "var(--bg)", zIndex: 40 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 18px", marginBottom: 28, textDecoration: "none", color: "var(--white)", fontSize: 15, fontWeight: 700 }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="5" fill="white"/><path d="M5 14V6l5 4-5 4zm5 0V6l5 4-5 4z" fill="#09090b"/></svg>
          MultiUploads
        </Link>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px", flex: 1 }}>
          {[
            { id: "overview", label: "Overview", icon: "◆" },
            { id: "users", label: "Users", icon: "👥" },
            { id: "videos", label: "Videos", icon: "▶" },
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: tab === item.id ? "var(--bg-card)" : "transparent", color: tab === item.id ? "var(--white)" : "var(--t3)", fontSize: 13, fontWeight: tab === item.id ? 600 : 400, cursor: "pointer", width: "100%", textAlign: "left" }}>
              <span style={{ width: 18, textAlign: "center", fontSize: 13, opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ height: 1, background: "var(--border)", margin: "12px 4px" }}></div>

          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, color: "var(--t3)", fontSize: 13, textDecoration: "none" }}>
            <span style={{ width: 18, textAlign: "center", fontSize: 13, opacity: 0.7 }}>←</span>
            Dashboard
          </Link>
        </div>

        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#ef4444", border: "1px solid var(--border-h)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>A</div>
          <div><p style={{ fontSize: 12, fontWeight: 500 }}>{session.user.name}</p><p style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>Admin</p></div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 200, padding: "24px 28px" }}>
        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Admin Panel</h1>
            <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 24 }}>Manage users, content, and platform settings</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
              {[
                { l: "Total Users", v: stats?.totalUsers || 0, c: "#3b82f6" },
                { l: "Total Videos", v: stats?.totalVideos || 0, c: "#22c55e" },
                { l: "Active Today", v: stats?.activeToday || 0, c: "#f59e0b" },
                { l: "Pro Users", v: stats?.proUsers || 0, c: "#a855f7" },
              ].map((s, i) => (
                <div key={i} className="card" style={{ padding: 18 }}>
                  <p style={{ fontSize: 11, color: "var(--t3)", marginBottom: 6 }}>{s.l}</p>
                  <p style={{ fontSize: 28, fontWeight: 700 }}>{s.v}</p>
                  <div style={{ width: "100%", height: 3, borderRadius: 2, background: "var(--bg-hover)", marginTop: 8 }}>
                    <div style={{ height: "100%", borderRadius: 2, background: s.c, width: `${Math.min((s.v / (stats?.totalUsers || 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Plan distribution */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Plan Distribution</h3>
              {["free", "lite", "growth", "pro"].map(plan => {
                const count = users.filter(u => u.plan === plan).length;
                const pct = users.length ? Math.round((count / users.length) * 100) : 0;
                return (
                  <div key={plan} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize", width: 60, color: planColors[plan] }}>{plan}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--bg)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: planColors[plan], transition: "width 0.5s" }}></div>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--t2)", width: 60, textAlign: "right" }}>{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>

            {/* Recent users */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Users</h3>
              {users.slice(0, 5).map(u => (
                <div key={u._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: u.role === "admin" ? "#ef4444" : "var(--bg-hover)", border: "1px solid var(--border-h)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>{u.name?.[0] || "?"}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: "var(--t4)" }}>{u.email}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 999, background: `${planColors[u.plan]}15`, color: planColors[u.plan], fontWeight: 600, textTransform: "capitalize" }}>{u.plan}</span>
                    {u.role === "admin" && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 600 }}>Admin</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Users</h1>
                <p style={{ fontSize: 12, color: "var(--t3)" }}>{users.length} registered users</p>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 80px 80px 100px 100px", gap: 10, padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <span>User</span>
                <span>Provider</span>
                <span>Plan</span>
                <span>Role</span>
                <span>Videos</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>

              {users.map(u => (
                <div key={u._id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 80px 80px 100px 100px", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border)", alignItems: "center", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {/* User info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.role === "admin" ? "#ef4444" : "var(--bg-hover)", border: "1px solid var(--border-h)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{u.name?.[0] || "?"}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</p>
                      <p style={{ fontSize: 11, color: "var(--t4)" }}>{u.email}</p>
                    </div>
                  </div>
                  {/* Provider */}
                  <span style={{ fontSize: 12, color: "var(--t3)", textTransform: "capitalize" }}>{u.provider || "credentials"}</span>
                  {/* Plan */}
                  <select style={S.select} value={u.plan} onChange={e => updateUserPlan(u._id, e.target.value)} disabled={actionLoading === u._id}>
                    <option value="free">Free</option>
                    <option value="lite">Lite</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                  </select>
                  {/* Role */}
                  <select style={S.select} value={u.role} onChange={e => updateUserRole(u._id, e.target.value)} disabled={actionLoading === u._id}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {/* Videos */}
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{u.videosUploaded || 0}</span>
                  {/* Actions */}
                  <div style={{ textAlign: "right" }}>
                    <button onClick={() => deleteUser(u._id)} disabled={actionLoading === u._id || u.role === "admin"}
                      style={{ height: 28, padding: "0 10px", fontSize: 11, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: u.role === "admin" ? "not-allowed" : "pointer", opacity: u.role === "admin" ? 0.3 : 1 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIDEOS TAB */}
        {tab === "videos" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>All Videos</h1>
            <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 24 }}>Videos across all users</p>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 90px 110px 100px", gap: 10, padding: "12px 18px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 600, color: "var(--t4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <span>Video</span>
                <span>Owner</span>
                <span>Status</span>
                <span>Platforms</span>
                <span>Created</span>
              </div>

              {videos.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--t3)" }}>
                  No videos found yet.
                </div>
              ) : videos.map((video) => (
                <div key={video._id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 90px 110px 100px", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video.title}</p>
                    <p style={{ fontSize: 11, color: "var(--t4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video.description || "No description"}</p>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500 }}>{video.userId?.name || "Unknown"}</p>
                    <p style={{ fontSize: 11, color: "var(--t4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video.userId?.email || ""}</p>
                  </div>
                  <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 999, background: "var(--bg-hover)", color: "var(--t2)", fontWeight: 600, textTransform: "capitalize", justifySelf: "start" }}>{video.status}</span>
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>{Object.keys(video.platforms || {}).length}</span>
                  <span style={{ fontSize: 12, color: "var(--t3)" }}>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
