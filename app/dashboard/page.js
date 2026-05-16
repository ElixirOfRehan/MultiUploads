"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════
   MULTIUPLOADS — FULL DASHBOARD
   Video manager + Analytics + AI Clips
   + Accounts + Settings + Video Editor
   ══════════════════════════════════════ */

/* ── Helpers ── */
function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toString(); }

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function Badge({ status }) {
  const c = { live: ["#22c55e","rgba(34,197,94,0.12)","rgba(34,197,94,0.25)"], processing: ["#f59e0b","rgba(245,158,11,0.12)","rgba(245,158,11,0.25)"], queued: ["#a1a1aa","rgba(161,161,170,0.1)","rgba(161,161,170,0.2)"], failed: ["#ef4444","rgba(239,68,68,0.12)","rgba(239,68,68,0.25)"] }[status] || ["#a1a1aa","rgba(161,161,170,0.1)","rgba(161,161,170,0.2)"];
  return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:999,fontSize:11,fontWeight:600,background:c[1],color:c[0],border:`1px solid ${c[2]}`,textTransform:"capitalize" }}><span style={{ width:5,height:5,borderRadius:"50%",background:c[0] }}></span>{status}</span>;
}

/* ── Platform Meta ── */
const PM = {
  youtube:   { name:"YouTube",   color:"#ff0000", icon:"▶" },
  instagram: { name:"Instagram", color:"#e1306c", icon:"◉" },
  tiktok:    { name:"TikTok",    color:"#00f2ea", icon:"♪" },
  facebook:  { name:"Facebook",  color:"#1877f2", icon:"f" },
  x:         { name:"X",         color:"#aaa",    icon:"𝕏" },
  linkedin:  { name:"LinkedIn",  color:"#0a66c2", icon:"in" },
};

/* ── Mock Videos ── */
const mockVideos = []; /*
  { id:1, title:"How I Built My Morning Routine in 30 Days", thumb:"🎬", thumbUrl:null, dur:"12:34", date:"2026-04-12", status:"live",
    desc:"In this video I share my complete morning routine transformation over 30 days. From waking up at 5AM to cold showers and journaling.",
    tags:["morning routine","productivity","self improvement","30 day challenge"],
    visibility:"public", category:"Education", language:"English", comments:true, ageRestricted:false, license:"Standard",
    platforms:{ youtube:{status:"live",views:4520,likes:312,title:"How I Built My Morning Routine in 30 Days",desc:"My complete morning routine transformation...",tags:["morning routine","productivity"],visibility:"public"}, instagram:{status:"live",views:8930,likes:1024,title:"Morning Routine Transformation 🌅",desc:"30 days of discipline. Full video on YT!",tags:["morningroutine","discipline","selfcare"],visibility:"public"}, tiktok:{status:"live",views:15200,likes:2100,title:"POV: You actually wake up at 5AM for 30 days",desc:"The results were insane #morningroutine #productivity",tags:["morningroutine","5amclub","productivity"],visibility:"public"} } },
  { id:2, title:"5 Editing Tricks Every Creator Should Know", thumb:"🎥", thumbUrl:null, dur:"8:21", date:"2026-04-10", status:"live",
    desc:"Master these 5 video editing techniques that will instantly improve your content quality.",
    tags:["editing","video editing","creator tips","content creation"],
    visibility:"public", category:"Education", language:"English", comments:true, ageRestricted:false, license:"Standard",
    platforms:{ youtube:{status:"live",views:2100,likes:189,title:"5 Editing Tricks Every Creator Should Know",desc:"These editing tricks changed my content game...",tags:["editing","tips"],visibility:"public"}, instagram:{status:"processing",views:0,likes:0,title:"5 Editing Tricks 🎬",desc:"Save this for later! #editingtips",tags:["editingtips","reels"],visibility:"public"} } },
  { id:3, title:"Behind the Scenes - Studio Setup Tour", thumb:"📹", thumbUrl:null, dur:"15:47", date:"2026-04-08", status:"live",
    desc:"Full tour of my home studio setup including camera, lighting, audio, and editing station.",
    tags:["studio tour","setup","creator setup","behind the scenes"],
    visibility:"public", category:"Science & Technology", language:"English", comments:true, ageRestricted:false, license:"Creative Commons",
    platforms:{ youtube:{status:"live",views:6780,likes:520,title:"Behind the Scenes - Studio Setup Tour",desc:"My complete studio setup...",tags:["studio","setup"],visibility:"public"}, tiktok:{status:"live",views:22400,likes:3800,title:"My ₹50K Studio Setup 🔥",desc:"Everything you need #studiotour #creator",tags:["studiotour","setup"],visibility:"public"} } },
  { id:4, title:"Why Most Creators Fail (And How to Fix It)", thumb:"💡", thumbUrl:null, dur:"10:15", date:"2026-04-05", status:"processing",
    desc:"The real reasons why 95% of creators quit within the first year and actionable steps to avoid it.",
    tags:["creator","motivation","growth","youtube tips"],
    visibility:"public", category:"Education", language:"English", comments:true, ageRestricted:false, license:"Standard",
    platforms:{ youtube:{status:"processing",views:0,likes:0,title:"Why Most Creators Fail",desc:"",tags:[],visibility:"public"}, instagram:{status:"queued",views:0,likes:0,title:"",desc:"",tags:[],visibility:"public"}, tiktok:{status:"queued",views:0,likes:0,title:"",desc:"",tags:[],visibility:"public"} } },
  { id:5, title:"Day in My Life as a Content Creator", thumb:"🌅", thumbUrl:null, dur:"6:42", date:"2026-04-02", status:"live",
    desc:"A typical day creating content — from ideation to publishing.",
    tags:["day in my life","content creator","vlog"],
    visibility:"public", category:"Entertainment", language:"English", comments:true, ageRestricted:false, license:"Standard",
    platforms:{ youtube:{status:"live",views:9300,likes:710,title:"Day in My Life as a Content Creator",desc:"",tags:["ditl","vlog"],visibility:"public"}, instagram:{status:"live",views:12500,likes:1890,title:"Creator Life 🎬",desc:"",tags:["creatorlife"],visibility:"public"}, tiktok:{status:"live",views:31000,likes:5200,title:"POV: Content creator life",desc:"",tags:["creatorlife"],visibility:"public"}, facebook:{status:"live",views:1200,likes:89,title:"Day in My Life",desc:"",tags:[],visibility:"public"} } },
  { id:6, title:"Honest Review - Best Camera Under ₹30K", thumb:"📸", thumbUrl:null, dur:"18:03", date:"2026-03-28", status:"failed",
    desc:"Comparing 5 cameras under ₹30,000 for content creation.",
    tags:["camera","review","budget camera","content creation"],
    visibility:"unlisted", category:"Science & Technology", language:"English", comments:true, ageRestricted:false, license:"Standard",
    platforms:{ youtube:{status:"live",views:11200,likes:890,title:"Best Camera Under ₹30K",desc:"",tags:["camera","review"],visibility:"public"}, instagram:{status:"failed",views:0,likes:0,title:"",desc:"",tags:[],visibility:"public"} } },
*/

/* ── Connected Accounts Data ── */
const connectedAccounts = []; /*
  { platform:"youtube", name:"Rehan Creates", subs:"2.4K", connected:true, lastSync:"2 hours ago" },
  { platform:"instagram", name:"@rehancreates", subs:"8.1K", connected:true, lastSync:"1 hour ago" },
  { platform:"tiktok", name:"@rehancreates", subs:"12.3K", connected:true, lastSync:"30 min ago" },
  { platform:"facebook", name:"Rehan Creates", subs:"1.1K", connected:true, lastSync:"3 hours ago" },
  { platform:"x", name:"", subs:"", connected:false, lastSync:"" },
  { platform:"linkedin", name:"", subs:"", connected:false, lastSync:"" },
*/

const sidebarItems = [
  { id:"videos",   label:"My Videos", icon:"▶" },
  { id:"upload",   label:"Upload",    icon:"↑" },
  { id:"analytics",label:"Analytics", icon:"◆" },
  { id:"clips",    label:"AI Clips",  icon:"✂" },
  { id:"accounts", label:"Accounts",  icon:"⊕" },
  { id:"settings", label:"Settings",  icon:"⚙" },
];

/* ═══════════ MAIN COMPONENT ═══════════ */
/* Default gradient thumbnails for preview */
const defaultThumbs = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("videos");
  const [pFilter, setPFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [editVideo, setEditVideo] = useState(null);
  const [editPlatform, setEditPlatform] = useState("all");
  const [videos, setVideos] = useState(mockVideos);
  const [accountList, setAccountList] = useState(connectedAccounts);
  const [dataLoading, setDataLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileName: "",
    fileSize: 0,
    thumbnailUrl: "",
    duration: "0:00",
    selectedPlatforms: [],
  });
  const thumbInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadDashboard() {
      setDataLoading(true);
      setPageError("");

      try {
        const res = await fetch("/api/videos", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load dashboard data.");
        }

        if (cancelled) return;

        setVideos(data.videos || []);
        setAccountList(data.connectedAccounts || []);
      } catch (error) {
        if (cancelled) return;

        setVideos([]);
        setAccountList([]);
        setPageError(error.message || "Failed to load dashboard data.");
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    const connectedPlatforms = accountList.filter((account) => account.connected).map((account) => account.platform);

    setUploadForm((prev) => (
      prev.selectedPlatforms.length > 0
        ? prev
        : { ...prev, selectedPlatforms: connectedPlatforms }
    ));
  }, [accountList]);

  if (status === "loading" || (status === "authenticated" && dataLoading)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border-h)", borderTopColor: "var(--white)", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ fontSize: 14, color: "var(--t3)" }}>Loading dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const filtered = pFilter === "all" ? videos : videos.filter(v => v.platforms[pFilter]);
  const totalViews = videos.reduce((s,v) => s + Object.values(v.platforms || {}).reduce((a,p) => a+p.views,0),0);
  const totalLikes = videos.reduce((s,v) => s + Object.values(v.platforms || {}).reduce((a,p) => a+p.likes,0),0);
  const activePlatforms = accountList.filter((account) => account.connected).length;
  const avgViews = videos.length ? fmt(Math.round(totalViews / videos.length)) : "0";
  const bestPlatform = Object.entries(PM).reduce((best, [key, meta]) => {
    const views = videos.reduce((sum, video) => sum + (video.platforms[key]?.views || 0), 0);
    if (!best || views > best.views) {
      return { name: meta.name, views };
    }
    return best;
  }, null)?.name || "N/A";

  const openEditor = (video) => { setEditVideo({...video}); setEditPlatform("all"); };

  const handleThumbUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditVideo(prev => ({ ...prev, thumbUrl: url }));
  };

  const saveEdit = async () => {
    if (!editVideo) return;
    if (editVideo.thumbUrl?.startsWith("blob:")) {
      setPageError("Hosted thumbnail URLs are supported here. Local thumbnail file uploads need a storage backend before they can be saved.");
      return;
    }

    setSaving(true);
    setPageError("");

    try {
      const res = await fetch(`/api/videos/${editVideo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editVideo),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save video changes.");
      }

      setVideos(prev => prev.map(v => v.id === data.video.id ? data.video : v));
      setEditVideo(null);
      setPageSuccess("Video changes saved.");
    } catch (error) {
      setPageError(error.message || "Failed to save video changes.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Shared styles ── */
  const handleUploadFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPageError("");
    setPageSuccess("");
    setUploadForm((prev) => ({
      ...prev,
      fileName: file.name,
      fileSize: file.size,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
  };

  const toggleUploadPlatform = (platform) => {
    setUploadForm((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((value) => value !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  };

  const handleCreateVideo = async () => {
    if (!uploadForm.title.trim()) {
      setPageError("Add a title before creating a video record.");
      return;
    }

    if (uploadForm.selectedPlatforms.length === 0) {
      setPageError("Select at least one connected platform.");
      return;
    }

    setUploading(true);
    setPageError("");
    setPageSuccess("");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create the video record.");
      }

      setVideos((prev) => [data.video, ...prev]);
      setUploadForm({
        title: "",
        description: "",
        fileUrl: "",
        fileName: "",
        fileSize: 0,
        thumbnailUrl: "",
        duration: "0:00",
        selectedPlatforms: accountList.filter((account) => account.connected).map((account) => account.platform),
      });
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
      setPageSuccess("Video saved and queued for distribution.");
      setTab("videos");
    } catch (error) {
      setPageError(error.message || "Failed to create the video record.");
    } finally {
      setUploading(false);
    }
  };

  const S = {
    label: { fontSize:12, fontWeight:600, color:"var(--t3)", marginBottom:6, display:"block" },
    input: { width:"100%", height:40, padding:"0 14px", fontSize:14, color:"var(--white)", background:"var(--bg)", border:"1px solid var(--border-h)", borderRadius:8, outline:"none" },
    textarea: { width:"100%", minHeight:100, padding:"10px 14px", fontSize:14, color:"var(--white)", background:"var(--bg)", border:"1px solid var(--border-h)", borderRadius:8, outline:"none", resize:"vertical", fontFamily:"inherit", lineHeight:1.6 },
    select: { width:"100%", height:40, padding:"0 14px", fontSize:14, color:"var(--white)", background:"var(--bg)", border:"1px solid var(--border-h)", borderRadius:8, outline:"none", cursor:"pointer" },
    toggle: (on) => ({ width:40, height:22, borderRadius:11, background:on?"#22c55e":"var(--t5)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s" }),
    toggleDot: (on) => ({ position:"absolute", top:3, left:on?21:3, width:16, height:16, borderRadius:"50%", background:"white", transition:"left 0.2s" }),
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)" }}>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{ width:200, borderRight:"1px solid var(--border)", padding:"20px 0", display:"flex", flexDirection:"column", position:"fixed", top:0, bottom:0, left:0, background:"var(--bg)", zIndex:40 }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, padding:"0 18px", marginBottom:28, textDecoration:"none", color:"var(--white)", fontSize:15, fontWeight:700 }}>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><rect width="20" height="20" rx="5" fill="white"/><path d="M5 14V6l5 4-5 4zm5 0V6l5 4-5 4z" fill="#09090b"/></svg>
          MultiUploads
        </Link>
        <div style={{ display:"flex", flexDirection:"column", gap:2, padding:"0 8px", flex:1 }}>
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setEditVideo(null); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:"none", background:tab===item.id?"var(--bg-card)":"transparent", color:tab===item.id?"var(--white)":"var(--t3)", fontSize:13, fontWeight:tab===item.id?600:400, cursor:"pointer", width:"100%", textAlign:"left" }}>
              <span style={{ width:18, textAlign:"center", fontSize:13, opacity:0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ padding:"14px 18px", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:"50%", background:"var(--bg-hover)", border:"1px solid var(--border-h)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600 }}>{session?.user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:12, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session?.user?.name || "User"}</p>
            <p style={{ fontSize:10, color:"var(--t4)", textTransform:"capitalize" }}>{session?.user?.plan || "free"} plan</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })} title="Sign out" style={{ background:"none", border:"none", color:"var(--t4)", cursor:"pointer", fontSize:14, padding:4 }}>⏻</button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ flex:1, marginLeft:200, padding:"24px 28px" }}>
        {pageError && (
          <div style={{ marginBottom:16, padding:"12px 14px", borderRadius:10, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#fca5a5", fontSize:13 }}>
            {pageError}
          </div>
        )}
        {pageSuccess && (
          <div style={{ marginBottom:16, padding:"12px 14px", borderRadius:10, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", color:"#86efac", fontSize:13 }}>
            {pageSuccess}
          </div>
        )}

        {/* ════ VIDEOS TAB ════ */}
        {tab === "videos" && !editVideo && (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.02em", marginBottom:2 }}>My Videos</h1>
                <p style={{ fontSize:12, color:"var(--t3)" }}>{videos.length} videos · {fmt(totalViews)} total views</p>
              </div>
              <button className="btn-primary" style={{ height:38, padding:"0 20px", fontSize:13, borderRadius:9 }} onClick={() => setTab("upload")}>
                <span>+</span> Upload Video
              </button>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
              {[{ l:"Total Views",v:fmt(totalViews),c:"+12.3%" },{ l:"Total Likes",v:fmt(totalLikes),c:"+8.7%" },{ l:"Videos",v:videos.length },{ l:"Platforms",v:activePlatforms }].map((s,i) => (
                <div key={i} className="card" style={{ padding:16 }}>
                  <p style={{ fontSize:11, color:"var(--t3)", marginBottom:4 }}>{s.l}</p>
                  <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                    <p style={{ fontSize:22, fontWeight:700 }}>{s.v}</p>
                    {s.c && <span style={{ fontSize:10, color:"#22c55e", fontWeight:600 }}>{s.c}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:18, overflowX:"auto" }}>
              <button onClick={() => setPFilter("all")} style={{ padding:"7px 16px", borderRadius:7, border:pFilter==="all"?"1px solid var(--border-h)":"1px solid transparent", background:pFilter==="all"?"var(--bg-card)":"transparent", color:pFilter==="all"?"var(--white)":"var(--t3)", fontSize:12, fontWeight:500, cursor:"pointer" }}>All Platforms</button>
              {Object.entries(PM).map(([k,m]) => {
                if (!videos.some(v => v.platforms[k])) return null;
                return <button key={k} onClick={() => setPFilter(k)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:7, border:pFilter===k?`1px solid ${m.color}40`:"1px solid transparent", background:pFilter===k?`${m.color}10`:"transparent", color:pFilter===k?m.color:"var(--t3)", fontSize:12, fontWeight:500, cursor:"pointer" }}><span style={{ width:6,height:6,borderRadius:"50%",background:m.color }}></span>{m.name}</button>;
              })}
            </div>

            {/* Video Table */}
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 110px 80px 70px", gap:10, padding:"10px 18px", borderBottom:"1px solid var(--border)", fontSize:10, fontWeight:600, color:"var(--t4)", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                <span></span><span>Video</span><span>Status</span><span>Platforms</span><span style={{ textAlign:"right" }}>Views</span><span style={{ textAlign:"right" }}>Likes</span>
              </div>
              {filtered.map(v => {
                const vw = Object.values(v.platforms).reduce((s,p) => s+p.views,0);
                const vl = Object.values(v.platforms).reduce((s,p) => s+p.likes,0);
                return (
                  <div key={v.id} onClick={() => openEditor(v)} style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 110px 80px 70px", gap:10, padding:"14px 18px", borderBottom:"1px solid var(--border)", alignItems:"center", cursor:"pointer", transition:"background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background="var(--bg-hover)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <input type="checkbox" checked={selected.includes(v.id)} onChange={e => { e.stopPropagation(); setSelected(p => p.includes(v.id)?p.filter(x=>x!==v.id):[...p,v.id]); }} style={{ width:14,height:14,accentColor:"white",cursor:"pointer" }} />
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:72,height:44,borderRadius:6,background:"var(--bg-hover)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{v.thumb}</div>
                      <div style={{ minWidth:0 }}><p style={{ fontSize:13, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{v.title}</p><p style={{ fontSize:11, color:"var(--t4)", marginTop:1 }}>{v.dur} · {v.date}</p></div>
                    </div>
                    <div><Badge status={v.status} /></div>
                    <div style={{ display:"flex", gap:5 }}>
                      {Object.entries(v.platforms).map(([k,d]) => { const m=PM[k]; return m ? <div key={k} title={`${m.name}: ${d.status}`} style={{ width:22,height:22,borderRadius:5,background:d.status==="live"?`${m.color}18`:"var(--bg-hover)",border:`1px solid ${d.status==="live"?`${m.color}30`:"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:d.status==="live"?m.color:"var(--t4)",fontWeight:700 }}>{m.icon}</div> : null; })}
                    </div>
                    <p style={{ textAlign:"right", fontSize:13, fontWeight:500, fontVariantNumeric:"tabular-nums" }}>{fmt(vw)}</p>
                    <p style={{ textAlign:"right", fontSize:13, fontWeight:500, color:"var(--t2)", fontVariantNumeric:"tabular-nums" }}>{fmt(vl)}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ════ VIDEO EDITOR ════ */}
        {tab === "videos" && editVideo && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <button onClick={() => setEditVideo(null)} style={{ background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:18, padding:"4px 8px" }}>←</button>
              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.02em" }}>Edit Video</h1>
                <p style={{ fontSize:12, color:"var(--t3)" }}>{editVideo.title}</p>
              </div>
              <button className="btn-secondary" style={{ height:36, padding:"0 16px", fontSize:13, borderRadius:8 }} onClick={() => setEditVideo(null)}>Cancel</button>
              <button className="btn-primary" style={{ height:36, padding:"0 20px", fontSize:13, borderRadius:8, opacity:saving ? 0.7 : 1 }} onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>

            {/* Platform Tabs for Editor */}
            <div style={{ display:"flex", gap:6, marginBottom:20, borderBottom:"1px solid var(--border)", paddingBottom:12 }}>
              <button onClick={() => setEditPlatform("all")} style={{ padding:"8px 16px", borderRadius:7, border:"none", background:editPlatform==="all"?"var(--bg-card)":"transparent", color:editPlatform==="all"?"var(--white)":"var(--t3)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                All Platforms
              </button>
              {Object.entries(editVideo.platforms).map(([k]) => {
                const m = PM[k]; if (!m) return null;
                return <button key={k} onClick={() => setEditPlatform(k)} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:7, border:"none", background:editPlatform===k?`${m.color}15`:"transparent", color:editPlatform===k?m.color:"var(--t3)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                  <span style={{ width:6,height:6,borderRadius:"50%",background:m.color }}></span>{m.name}
                  <Badge status={editVideo.platforms[k].status} />
                </button>;
              })}
            </div>

            {editPlatform === "all" ? (
              /* ── ALL PLATFORMS EDITOR ── */
              <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {/* Title */}
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Basic Details</h3>
                    <label style={S.label}>Title <span style={{ color:"var(--t4)", fontWeight:400 }}>— applies to all platforms</span></label>
                    <input style={S.input} value={editVideo.title} onChange={e => setEditVideo({...editVideo, title:e.target.value})} />
                    <label style={{ ...S.label, marginTop:14 }}>Description</label>
                    <textarea style={S.textarea} value={editVideo.desc} onChange={e => setEditVideo({...editVideo, desc:e.target.value})} />
                    <label style={{ ...S.label, marginTop:14 }}>Tags <span style={{ color:"var(--t4)", fontWeight:400 }}>— comma separated</span></label>
                    <input style={S.input} value={editVideo.tags.join(", ")} onChange={e => setEditVideo({...editVideo, tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)})} />
                  </div>

                  {/* Visibility & Schedule */}
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Visibility & Distribution</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <label style={S.label}>Visibility</label>
                        <select style={S.select} value={editVideo.visibility} onChange={e => setEditVideo({...editVideo, visibility:e.target.value})}>
                          <option value="public">Public</option>
                          <option value="unlisted">Unlisted</option>
                          <option value="private">Private</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Category</label>
                        <select style={S.select} value={editVideo.category} onChange={e => setEditVideo({...editVideo, category:e.target.value})}>
                          {["Education","Entertainment","Science & Technology","People & Blogs","Film & Animation","Music","Gaming","Sports","News & Politics","Comedy"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Language</label>
                        <select style={S.select} value={editVideo.language} onChange={e => setEditVideo({...editVideo, language:e.target.value})}>
                          {["English","Hindi","Tamil","Telugu","Bengali","Marathi","Gujarati","Kannada","Malayalam","Punjabi"].map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>License</label>
                        <select style={S.select} value={editVideo.license} onChange={e => setEditVideo({...editVideo, license:e.target.value})}>
                          <option value="Standard">Standard License</option>
                          <option value="Creative Commons">Creative Commons</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Advanced Settings</h3>
                    {[
                      { key:"comments", label:"Allow Comments", sub:"Let viewers comment on your video" },
                      { key:"ageRestricted", label:"Age Restriction", sub:"Restrict to viewers 18+" },
                    ].map(t => (
                      <div key={t.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                        <div><p style={{ fontSize:13, fontWeight:500 }}>{t.label}</p><p style={{ fontSize:11, color:"var(--t4)" }}>{t.sub}</p></div>
                        <button style={S.toggle(editVideo[t.key])} onClick={() => setEditVideo({...editVideo, [t.key]:!editVideo[t.key]})}>
                          <span style={S.toggleDot(editVideo[t.key])}></span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Sidebar — Preview */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Preview</h3>
                    <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:10, overflow:"hidden", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48, marginBottom:12, position:"relative" }}>
                      {editVideo.thumbUrl ? (
                          <Image src={editVideo.thumbUrl} alt="Thumbnail" fill unoptimized sizes="320px" style={{ objectFit:"cover" }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", background: defaultThumbs[(editVideo.id - 1) % defaultThumbs.length], display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:48, filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>{editVideo.thumb}</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize:12, color:"var(--t3)" }}>Duration: {editVideo.dur}</p>
                    <p style={{ fontSize:12, color:"var(--t3)" }}>Uploaded: {editVideo.date}</p>
                    <p style={{ fontSize:12, color:"var(--t3)", marginTop:4 }}>Status: <Badge status={editVideo.status} /></p>
                  </div>

                  <div className="card" style={{ padding:14 }}>
                    <input type="file" ref={thumbInputRef} accept="image/*" onChange={handleThumbUpload} style={{ display:"none" }} />
                    <div onClick={() => thumbInputRef.current?.click()} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", padding:"6px 0" }}>
                      <div style={{ width:56, height:34, borderRadius:6, overflow:"hidden", border:"1px solid var(--border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                        {editVideo.thumbUrl ? (
                          <Image src={editVideo.thumbUrl} alt="Thumbnail preview" fill unoptimized sizes="56px" style={{ objectFit:"cover" }} />
                        ) : (
                          <div style={{ width:"100%", height:"100%", background: defaultThumbs[(editVideo.id - 1) % defaultThumbs.length], display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{editVideo.thumb}</div>
                        )}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:12, fontWeight:500 }}>{editVideo.thumbUrl ? "Change thumbnail" : "Upload thumbnail"}</p>
                        <p style={{ fontSize:10, color:"var(--t4)" }}>JPG, PNG · 1280×720</p>
                      </div>
                      <span style={{ fontSize:14, color:"var(--t4)" }}>↑</span>
                    </div>
                  </div>

                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Platform Status</h3>
                    {Object.entries(editVideo.platforms).map(([k,d]) => { const m=PM[k]; if(!m) return null;
                      return <div key={k} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}><span style={{ width:7,height:7,borderRadius:"50%",background:m.color }}></span><span style={{ fontSize:12 }}>{m.name}</span></div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}><Badge status={d.status} /><span style={{ fontSize:11, color:"var(--t3)" }}>{fmt(d.views)} views</span></div>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ── PLATFORM-SPECIFIC EDITOR ── */
              <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ width:8,height:8,borderRadius:"50%",background:PM[editPlatform]?.color }}></span>
                      {PM[editPlatform]?.name} — Details
                    </h3>
                    <p style={{ fontSize:11, color:"var(--t4)", marginBottom:14 }}>Changes here only affect {PM[editPlatform]?.name}</p>
                    <label style={S.label}>Title for {PM[editPlatform]?.name}</label>
                    <input style={S.input} value={editVideo.platforms[editPlatform]?.title || ""} onChange={e => {
                      const p = {...editVideo.platforms}; p[editPlatform] = {...p[editPlatform], title:e.target.value};
                      setEditVideo({...editVideo, platforms:p});
                    }} placeholder={editVideo.title} />
                    <label style={{ ...S.label, marginTop:14 }}>Description for {PM[editPlatform]?.name}</label>
                    <textarea style={S.textarea} value={editVideo.platforms[editPlatform]?.desc || ""} onChange={e => {
                      const p = {...editVideo.platforms}; p[editPlatform] = {...p[editPlatform], desc:e.target.value};
                      setEditVideo({...editVideo, platforms:p});
                    }} placeholder={editVideo.desc} />
                    <label style={{ ...S.label, marginTop:14 }}>Tags for {PM[editPlatform]?.name}</label>
                    <input style={S.input} value={(editVideo.platforms[editPlatform]?.tags || []).join(", ")} onChange={e => {
                      const p = {...editVideo.platforms}; p[editPlatform] = {...p[editPlatform], tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)};
                      setEditVideo({...editVideo, platforms:p});
                    }} />
                    <label style={{ ...S.label, marginTop:14 }}>Visibility on {PM[editPlatform]?.name}</label>
                    <select style={S.select} value={editVideo.platforms[editPlatform]?.visibility || "public"} onChange={e => {
                      const p = {...editVideo.platforms}; p[editPlatform] = {...p[editPlatform], visibility:e.target.value};
                      setEditVideo({...editVideo, platforms:p});
                    }}>
                      <option value="public">Public</option><option value="unlisted">Unlisted</option><option value="private">Private</option>
                    </select>
                  </div>

                  {/* Platform-specific settings */}
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>{PM[editPlatform]?.name} Settings</h3>
                    {editPlatform === "youtube" && <>
                      <label style={S.label}>Playlist</label><select style={S.select}><option>None</option><option>Creator Tips</option><option>Vlogs</option><option>Reviews</option></select>
                      <label style={{ ...S.label, marginTop:12 }}>End Screen</label><select style={S.select}><option>Default</option><option>Subscribe + Video</option><option>Playlist</option></select>
                      <label style={{ ...S.label, marginTop:12 }}>Cards</label><select style={S.select}><option>None</option><option>Link to website</option><option>Link to video</option></select>
                    </>}
                    {editPlatform === "instagram" && <>
                      <label style={S.label}>Post Type</label><select style={S.select}><option>Reel</option><option>Feed Post</option><option>Story</option></select>
                      <label style={{ ...S.label, marginTop:12 }}>Cover Frame</label>
                      <div style={{ width:"100%",height:60,borderRadius:8,border:"2px dashed var(--border-h)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"var(--t4)",cursor:"pointer" }}>Click to select cover</div>
                      <label style={{ ...S.label, marginTop:12 }}>Location</label><input style={S.input} placeholder="Add location..." />
                    </>}
                    {editPlatform === "tiktok" && <>
                      <label style={S.label}>Allow Duets</label>
                      <button style={S.toggle(true)}><span style={S.toggleDot(true)}></span></button>
                      <label style={{ ...S.label, marginTop:12 }}>Allow Stitch</label>
                      <button style={S.toggle(true)}><span style={S.toggleDot(true)}></span></button>
                      <label style={{ ...S.label, marginTop:12 }}>Sound</label><input style={S.input} placeholder="Original sound" />
                    </>}
                    {editPlatform === "facebook" && <>
                      <label style={S.label}>Post to</label><select style={S.select}><option>Timeline</option><option>Page</option><option>Group</option></select>
                      <label style={{ ...S.label, marginTop:12 }}>Audience</label><select style={S.select}><option>Public</option><option>Friends</option><option>Only me</option></select>
                    </>}
                  </div>
                </div>

                {/* Right — Platform Stats */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>{PM[editPlatform]?.name} Performance</h3>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                      <div style={{ padding:12, borderRadius:8, background:"var(--bg)", textAlign:"center" }}>
                        <p style={{ fontSize:20, fontWeight:700 }}>{fmt(editVideo.platforms[editPlatform]?.views || 0)}</p>
                        <p style={{ fontSize:10, color:"var(--t4)" }}>Views</p>
                      </div>
                      <div style={{ padding:12, borderRadius:8, background:"var(--bg)", textAlign:"center" }}>
                        <p style={{ fontSize:20, fontWeight:700 }}>{fmt(editVideo.platforms[editPlatform]?.likes || 0)}</p>
                        <p style={{ fontSize:10, color:"var(--t4)" }}>Likes</p>
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{ padding:20 }}>
                    <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Preview</h3>
                    <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:10, background:"var(--bg-hover)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>{editVideo.thumb}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════ UPLOAD TAB ════ */}
        {tab === "upload" && (
          <div style={{ maxWidth:560, margin:"0 auto", paddingTop:40 }}>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6, textAlign:"center" }}>Add Video</h1>
            <p style={{ fontSize:13, color:"var(--t3)", marginBottom:32, textAlign:"center" }}>Save a real video record, choose where it should go, and keep the distribution workflow fully dynamic.</p>
            <div className="card" style={{ padding:32 }}>
              <input type="file" ref={uploadInputRef} accept="video/*" onChange={handleUploadFileChange} style={{ display:"none" }} />
              <div onClick={() => uploadInputRef.current?.click()} style={{ border:"2px dashed var(--border-h)", borderRadius:14, padding:"40px 24px", textAlign:"center", cursor:"pointer", marginBottom:24 }}>
                <p style={{ fontSize:36, marginBottom:10 }}>📁</p>
                <p style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>{uploadForm.fileName || "Click to choose a local file"}</p>
                <p style={{ fontSize:12, color:"var(--t4)" }}>
                  {uploadForm.fileName ? `${formatBytes(uploadForm.fileSize)} selected` : "We save the file metadata here and can pair it with storage integration later."}
                </p>
              </div>
              <label style={S.label}>Title</label>
              <input style={{ ...S.input, marginBottom:12 }} placeholder="Enter video title..." value={uploadForm.title} onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))} />
              <label style={S.label}>Description</label>
              <textarea style={{ ...S.textarea, marginBottom:12 }} placeholder="Describe your video..." value={uploadForm.description} onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 120px", gap:12, marginBottom:12 }}>
                <div>
                  <label style={S.label}>Source URL</label>
                  <input style={S.input} placeholder="https://cdn.example.com/video.mp4" value={uploadForm.fileUrl} onChange={(e) => setUploadForm((prev) => ({ ...prev, fileUrl: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Duration</label>
                  <input style={S.input} placeholder="12:34" value={uploadForm.duration} onChange={(e) => setUploadForm((prev) => ({ ...prev, duration: e.target.value }))} />
                </div>
              </div>
              <label style={S.label}>Thumbnail URL</label>
              <input style={{ ...S.input, marginBottom:12 }} placeholder="https://cdn.example.com/thumb.jpg" value={uploadForm.thumbnailUrl} onChange={(e) => setUploadForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))} />
              <label style={S.label}>Distribute to</label>
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {accountList.filter(a => a.connected).map(a => { const m=PM[a.platform];
                  return <label key={a.platform} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg)", fontSize:12, cursor:"pointer" }}>
                    <input type="checkbox" checked={uploadForm.selectedPlatforms.includes(a.platform)} onChange={() => toggleUploadPlatform(a.platform)} style={{ accentColor:m?.color }} /> <span style={{ width:6,height:6,borderRadius:"50%",background:m?.color }}></span>{m?.name}
                  </label>;
                })}
              </div>
              <button className="btn-primary" style={{ width:"100%", height:44, fontSize:14, borderRadius:10, opacity:uploading ? 0.7 : 1 }} onClick={handleCreateVideo} disabled={uploading}>{uploading ? "Saving..." : "Save & Queue Video"}</button>
            </div>
          </div>
        )}

        {/* ════ ANALYTICS TAB ════ */}
        {tab === "analytics" && (
          <>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Analytics</h1>
            <p style={{ fontSize:12, color:"var(--t3)", marginBottom:24 }}>Overview of your content performance across all platforms</p>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
              {[{ l:"Total Views",v:fmt(totalViews),c:"+12.3%",col:"#22c55e" },{ l:"Total Likes",v:fmt(totalLikes),c:"+8.7%",col:"#22c55e" },{ l:"Avg Views/Video",v:avgViews,col:"" },{ l:"Best Platform",v:bestPlatform,col:"" }].map((s,i) => (
                <div key={i} className="card" style={{ padding:16 }}>
                  <p style={{ fontSize:11, color:"var(--t3)", marginBottom:4 }}>{s.l}</p>
                  <p style={{ fontSize:22, fontWeight:700 }}>{s.v} {s.c && <span style={{ fontSize:10, color:s.col, fontWeight:600 }}>{s.c}</span>}</p>
                </div>
              ))}
            </div>

            {/* Per-platform breakdown */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Platform Breakdown</h3>
              {Object.entries(PM).map(([k,m]) => {
                const pv = videos.reduce((s,v) => s + (v.platforms[k]?.views || 0), 0);
                const pl = videos.reduce((s,v) => s + (v.platforms[k]?.likes || 0), 0);
                const vc = videos.filter(v => v.platforms[k]).length;
                if (vc === 0) return null;
                const pct = totalViews ? Math.round((pv / totalViews) * 100) : 0;
                return <div key={k} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ width:8,height:8,borderRadius:"50%",background:m.color }}></span>
                  <span style={{ fontSize:13, fontWeight:500, width:90 }}>{m.name}</span>
                  <div style={{ flex:1, height:8, borderRadius:4, background:"var(--bg)", overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", borderRadius:4, background:m.color, transition:"width 0.5s" }}></div>
                  </div>
                  <span style={{ fontSize:12, color:"var(--t2)", width:60, textAlign:"right" }}>{fmt(pv)}</span>
                  <span style={{ fontSize:11, color:"var(--t4)", width:40, textAlign:"right" }}>{pct}%</span>
                </div>;
              })}
            </div>

            {/* Top videos */}
            <div className="card" style={{ padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Top Performing Videos</h3>
              {[...videos].sort((a,b) => Object.values(b.platforms).reduce((s,p)=>s+p.views,0) - Object.values(a.platforms).reduce((s,p)=>s+p.views,0)).slice(0,3).map((v,i) => {
                const vw = Object.values(v.platforms).reduce((s,p)=>s+p.views,0);
                return <div key={v.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:"var(--t4)", width:24 }}>#{i+1}</span>
                  <span style={{ fontSize:20 }}>{v.thumb}</span>
                  <span style={{ fontSize:13, fontWeight:500, flex:1 }}>{v.title}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>{fmt(vw)} views</span>
                </div>;
              })}
            </div>
          </>
        )}

        {/* ════ AI CLIPS TAB ════ */}
        {tab === "clips" && (
          <>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>AI Clip Engine</h1>
            <p style={{ fontSize:12, color:"var(--t3)", marginBottom:24 }}>Automatically generate short-form clips from your best moments</p>

            <div className="card" style={{ padding:32, textAlign:"center", marginBottom:20 }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>✂</div>
              <h3 style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>Coming Soon</h3>
              <p style={{ fontSize:13, color:"var(--t2)", maxWidth:400, margin:"0 auto 20px", lineHeight:1.6 }}>
                Our AI analyzes retention data 3 days after publishing, finds peak engagement moments, and generates contextual clips ready for Reels, Shorts, and TikTok.
              </p>
              <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, fontSize:11, fontWeight:600, background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)" }}>
                Available in Growth & Pro plans
              </span>
            </div>

            <div className="card" style={{ padding:20 }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>How it works</h3>
              {[
                { n:"01", t:"Publish your video", d:"Upload and distribute your long-form video as usual." },
                { n:"02", t:"We analyze retention", d:"After 3 days live, our AI maps audience attention peaks across platforms." },
                { n:"03", t:"Smart clips generated", d:"We expand peak moments into contextual clips that make sense standalone." },
                { n:"04", t:"Review & distribute", d:"Preview clips, edit if needed, and redistribute to short-form platforms." },
              ].map(s => (
                <div key={s.n} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"var(--t4)", fontFamily:"monospace", width:24 }}>{s.n}</span>
                  <div><p style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{s.t}</p><p style={{ fontSize:12, color:"var(--t3)" }}>{s.d}</p></div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════ ACCOUNTS TAB ════ */}
        {tab === "accounts" && (
          <>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Connected Accounts</h1>
            <p style={{ fontSize:12, color:"var(--t3)", marginBottom:24 }}>Manage your platform connections. OAuth actions stay disabled until each platform integration is configured.</p>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {accountList.map(a => {
                const m = PM[a.platform];
                return (
                  <div key={a.platform} className="card" style={{ padding:18, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:`${m?.color}15`, border:`1px solid ${m?.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:m?.color, fontWeight:700 }}>{m?.icon}</div>
                      <div>
                        <p style={{ fontSize:14, fontWeight:500 }}>{m?.name}</p>
                        {a.connected ? <p style={{ fontSize:11, color:"var(--t3)" }}>{a.name || "Connected"}{a.subs ? ` · ${a.subs} followers` : ""}{a.lastSync ? ` · Synced ${a.lastSync}` : ""}</p>
                          : <p style={{ fontSize:11, color:"var(--t4)" }}>Not connected</p>}
                      </div>
                    </div>
                    {a.connected
                      ? <div style={{ display:"flex", gap:8 }}>
                          <button className="btn-secondary" style={{ height:32, padding:"0 14px", fontSize:11, borderRadius:7, opacity:0.6, cursor:"not-allowed" }} disabled title="Platform OAuth actions are not configured yet.">Sync Disabled</button>
                          <button style={{ height:32, padding:"0 14px", fontSize:11, borderRadius:7, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#ef4444", cursor:"not-allowed", opacity:0.6 }} disabled title="Platform OAuth actions are not configured yet.">Disconnect</button>
                        </div>
                      : <button className="btn-primary" style={{ height:32, padding:"0 16px", fontSize:11, borderRadius:7, opacity:0.6, cursor:"not-allowed" }} disabled title="Platform OAuth actions are not configured yet.">OAuth Required</button>
                    }
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ════ SETTINGS TAB ════ */}
        {tab === "settings" && (
          <>
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Settings</h1>
            <p style={{ fontSize:12, color:"var(--t3)", marginBottom:24 }}>Manage your account and preferences</p>

            {/* Profile */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Profile</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={S.label}>Display Name</label><input style={S.input} defaultValue={session?.user?.name || ""} /></div>
                <div><label style={S.label}>Email</label><input style={S.input} defaultValue={session?.user?.email || ""} /></div>
              </div>
              <div style={{ marginTop:12 }}><label style={S.label}>Bio</label><textarea style={S.textarea} defaultValue="Content creator sharing tech and productivity tips." /></div>
            </div>

            {/* Defaults */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Upload Defaults</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div><label style={S.label}>Default Visibility</label><select style={S.select}><option>Public</option><option>Unlisted</option><option>Private</option></select></div>
                <div><label style={S.label}>Default Category</label><select style={S.select}><option>Education</option><option>Entertainment</option><option>Science & Tech</option></select></div>
                <div><label style={S.label}>Default Language</label><select style={S.select}><option>English</option><option>Hindi</option></select></div>
                <div><label style={S.label}>Auto-captions</label><select style={S.select}><option>Enabled</option><option>Disabled</option></select></div>
              </div>
            </div>

            {/* Notifications */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Notifications</h3>
              {[
                { l:"Upload complete", s:"Get notified when video is live on all platforms", on:true },
                { l:"Upload failed", s:"Alert when a platform upload fails", on:true },
                { l:"Weekly analytics", s:"Receive a weekly summary of your stats", on:false },
                { l:"New features", s:"Be the first to know about new features", on:true },
              ].map((n,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                  <div><p style={{ fontSize:13, fontWeight:500 }}>{n.l}</p><p style={{ fontSize:11, color:"var(--t4)" }}>{n.s}</p></div>
                  <button style={S.toggle(n.on)}><span style={S.toggleDot(n.on)}></span></button>
                </div>
              ))}
            </div>

            {/* Plan */}
            <div className="card" style={{ padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Current Plan</h3>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <p style={{ fontSize:16, fontWeight:600, textTransform:"capitalize" }}>{session?.user?.plan || "free"}</p>
                  <p style={{ fontSize:12, color:"var(--t3)" }}>Plan upgrades unlock higher limits and additional platform automation.</p>
                </div>
                <button className="btn-primary" style={{ height:36, padding:"0 20px", fontSize:13, borderRadius:8, opacity:0.6, cursor:"not-allowed" }} disabled title="Billing is not configured yet.">Billing Soon</button>
              </div>
            </div>

            {/* Danger */}
            <div className="card" style={{ padding:20, borderColor:"rgba(239,68,68,0.2)" }}>
              <h3 style={{ fontSize:14, fontWeight:600, marginBottom:12, color:"#ef4444" }}>Danger Zone</h3>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div><p style={{ fontSize:13, fontWeight:500 }}>Delete Account</p><p style={{ fontSize:11, color:"var(--t4)" }}>Permanently delete all data and connected accounts</p></div>
                <button style={{ height:34, padding:"0 16px", fontSize:12, borderRadius:7, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.08)", color:"#ef4444", cursor:"not-allowed", fontWeight:500, opacity:0.6 }} disabled title="Account deletion is not configured yet.">Delete Account</button>
              </div>
            </div>

            <div style={{ marginTop:20, display:"flex", gap:10 }}>
              <button className="btn-primary" style={{ height:40, padding:"0 24px", fontSize:14, borderRadius:9, opacity:0.6, cursor:"not-allowed" }} disabled title="Settings persistence is not configured yet.">Save Settings</button>
              <button className="btn-secondary" style={{ height:40, padding:"0 24px", fontSize:14, borderRadius:9, opacity:0.6, cursor:"not-allowed" }} disabled>Cancel</button>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
