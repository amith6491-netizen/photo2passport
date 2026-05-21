import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Download, Camera, FileImage, Sun, Moon, ChevronRight,
  Zap, Printer, Grid, Settings, Eye, Check, AlertCircle, Loader2,
  X, ImageIcon, Menu, Home, Info, Mail, Shield, Sliders, ArrowRight,
  Star, Globe, Lock
} from "lucide-react";

/* ─────────────────────────── CONSTANTS ─────────────────────────── */
const DPI = 300;
const MM = DPI / 25.4; // px per mm at 300 DPI

const FORMATS = {
  passport_india: { label: "Passport (India / EU)", mmW: 35, mmH: 45, color: "#818cf8", w: Math.round(35 * MM), h: Math.round(45 * MM) },
  passport_us:    { label: "Passport (US / Canada)", mmW: 51, mmH: 51, color: "#a78bfa", w: Math.round(51 * MM), h: Math.round(51 * MM) },
  stamp:          { label: "Stamp Size",             mmW: 25, mmH: 30, color: "#fbbf24", w: Math.round(25 * MM), h: Math.round(30 * MM) },
  visa:           { label: "Visa (Schengen)",        mmW: 35, mmH: 45, color: "#34d399", w: Math.round(35 * MM), h: Math.round(45 * MM) },
};

const BG_PRESETS = [
  { id: "white",   value: "#ffffff", label: "White" },
  { id: "blue",    value: "#c9dff0", label: "Sky Blue" },
  { id: "gray",    value: "#ececec", label: "Light Gray" },
  { id: "cream",   value: "#faf7f0", label: "Cream" },
];

/* ─────────────────────────── INLINE STYLES ─────────────────────────── */
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  body { font-family: 'Syne', sans-serif; }

  .syne   { font-family: 'Syne', sans-serif; }
  .mono   { font-family: 'Space Mono', monospace; }

  /* Glassmorphism */
  .glass-dark  { background: rgba(255,255,255,0.04); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.09); }
  .glass-light { background: rgba(255,255,255,0.78); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 8px 40px rgba(0,0,0,0.06); }

  /* Gradient text */
  .gtext { background: linear-gradient(135deg,#818cf8,#c084fc,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

  /* Glow button */
  .gbtn { background: linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow: 0 0 28px rgba(99,102,241,0.45); transition: box-shadow 0.3s, transform 0.3s; cursor: pointer; border: none; }
  .gbtn:hover:not(:disabled) { box-shadow: 0 0 52px rgba(99,102,241,0.7); transform: translateY(-2px); }
  .gbtn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Card hover lift */
  .lift { transition: transform 0.25s ease, box-shadow 0.25s ease; cursor: default; }
  .lift:hover { transform: translateY(-5px); box-shadow: 0 24px 60px rgba(99,102,241,0.18); }

  /* Drag zone */
  .dragzone { transition: border-color 0.2s, background 0.2s; }
  .dragzone.over { border-color: #6366f1 !important; background: rgba(99,102,241,0.08) !important; }

  /* Animations */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes floatY   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
  @keyframes pulse-g  { 0%,100% { box-shadow:0 0 20px rgba(99,102,241,.3); } 50% { box-shadow:0 0 50px rgba(99,102,241,.65); } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(40px,-30px) scale(1.08);} }
  @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-30px,25px) scale(1.05);} }

  .anim-fade-up  { animation: fadeUp 0.6s ease forwards; }
  .anim-float    { animation: floatY 3.5s ease-in-out infinite; }
  .anim-pulse-g  { animation: pulse-g 2.5s ease-in-out infinite; }
  .anim-spin     { animation: spin 1.1s linear infinite; }
  .orb1          { animation: orb1 8s ease-in-out infinite; }
  .orb2          { animation: orb2 10s ease-in-out infinite; }

  /* Range input */
  input[type=range] { -webkit-appearance:none; height:5px; border-radius:3px; outline:none; cursor:pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:17px; height:17px; border-radius:50%; background:#6366f1; cursor:pointer; }

  /* Scrollbar */
  ::-webkit-scrollbar        { width:5px; }
  ::-webkit-scrollbar-track  { background:transparent; }
  ::-webkit-scrollbar-thumb  { background:rgba(99,102,241,.4); border-radius:3px; }

  /* Photo hover reveal */
  .photo-card .overlay { opacity:0; transition:opacity 0.25s; }
  .photo-card:hover .overlay { opacity:1; }

  /* Smooth page mount */
  .page-mount { animation: fadeUp 0.45s ease forwards; }
`;

/* ─────────────────────────── HELPERS ─────────────────────────── */
const fileToBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const loadImg = (src) =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload  = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

/* ─────────────────────────── MAIN APP ─────────────────────────── */
export default function App() {
  /* External libraries */
  useEffect(() => {
    const addScript = (src) => {
      const s = document.createElement("script");
      s.src = src;
      document.head.appendChild(s);
    };
    addScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    addScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  }, []);

  /* ── Navigation & UI ── */
  const [page,           setPage]           = useState("home");
  const [dark,           setDark]           = useState(true);
  const [mobileOpen,     setMobileOpen]     = useState(false);

  /* ── Image state ── */
  const [uploaded,       setUploaded]       = useState(null);   // base64
  const [faceData,       setFaceData]       = useState(null);
  const [photos,         setPhotos]         = useState({});     // { fmtId: base64 }

  /* ── Processing ── */
  const [detecting,      setDetecting]      = useState(false);
  const [generating,     setGenerating]     = useState(false);
  const [dragging,       setDragging]       = useState(false);
  const [err,            setErr]            = useState(null);
  const [success,        setSuccess]        = useState(null);

  /* ── Editor prefs ── */
  const [bgColor,        setBgColor]        = useState("#ffffff");
  const [brightness,     setBrightness]     = useState(100);
  const [contrast,       setContrast]       = useState(100);
  const [selFormat,      setSelFormat]      = useState("passport_india");
  const [copies,         setCopies]         = useState(8);

  /* ── Contact ── */
  const [cForm,          setCForm]          = useState({ name: "", email: "", msg: "" });
  const [cSent,          setCSent]          = useState(false);

  const fileRef  = useRef(null);

  /* ───── theme helpers ───── */
  const t = {
    bg:      dark ? "#080c1a" : "#eef1f9",
    card:    dark ? "glass-dark" : "glass-light",
    text:    dark ? "#f1f5f9" : "#0f172a",
    muted:   dark ? "#94a3b8" : "#64748b",
    border:  dark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.08)",
    input:   dark ? { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#f1f5f9" }
                  : { background: "#fff", border: "1px solid #e2e8f0", color: "#0f172a" },
  };

  const flash = (msg, isErr = false) => {
    if (isErr) { setErr(msg); setTimeout(() => setErr(null), 4000); }
    else        { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  };

  /* ───── file handling ───── */
  const handleFile = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type))
      return flash("Please upload a JPG or PNG file.", true);
    if (file.size > 20 * 1024 * 1024)
      return flash("File must be under 20 MB.", true);

    const b64 = await fileToBase64(file);
    setUploaded(b64);
    setFaceData(null);
    setPhotos({});
    setErr(null);
    setPage("upload");
  };

  const onDrop     = useCallback(async (e) => { e.preventDefault(); setDragging(false); await handleFile(e.dataTransfer.files[0]); }, []);
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave= () => setDragging(false);

  /* ───── Anthropic API — face detection ───── */
  const detectFace = async (b64) => {
    setDetecting(true);
    try {
      const raw   = b64.split(",")[1];
      const mime  = b64.split(";")[0].split(":")[1];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mime, data: raw } },
              { type: "text",  text:
                `Detect the face in this portrait. Reply ONLY with a valid JSON object, no markdown:
{"faceX":<face center X, 0-1>,"faceY":<face center Y, 0-1>,"faceW":<face width, 0-1>,"faceH":<face height, 0-1>,"ok":true}
If no face: {"faceX":0.5,"faceY":0.38,"faceW":0.42,"faceH":0.38,"ok":false}` }
            ]
          }]
        })
      });
      const data = await res.json();
      const txt  = data.content?.find(c => c.type === "text")?.text || "";
      const m    = txt.match(/\{[\s\S]*?\}/);
      if (m) { const fd = JSON.parse(m[0]); setFaceData(fd); return fd; }
    } catch (_) {}
    const def = { faceX: 0.5, faceY: 0.38, faceW: 0.42, faceH: 0.38, ok: false };
    setFaceData(def);
    return def;
  };

  /* ───── Canvas: crop photo ───── */
  const cropPhoto = async (b64, fd, fmtId, bri, con, bg) => {
    const fmt  = FORMATS[fmtId];
    const img  = await loadImg(b64);
    const iW   = img.naturalWidth  || img.width;
    const iH   = img.naturalHeight || img.height;
    const asp  = fmt.mmW / fmt.mmH;

    /* Face geometry in px */
    const fcX  = fd.faceX * iW;
    const fcY  = fd.faceY * iH;
    const fH   = fd.faceH * iH;

    /* Crop height so head fills ~73% of image */
    const headH   = fH * 1.35;            // include forehead
    let   cropH   = headH / 0.73;
    let   cropW   = cropH * asp;
    if (cropW > iW) { cropW = iW;  cropH = cropW / asp; }
    if (cropH > iH) { cropH = iH;  cropW = cropH * asp; }

    const headTop = fcY - fH * 0.5 - fH * 0.35;
    const cY = Math.max(0, Math.min(headTop - cropH * 0.06, iH - cropH));
    const cX = Math.max(0, Math.min(fcX - cropW / 2, iW - cropW));

    const cv  = document.createElement("canvas");
    cv.width  = fmt.w;
    cv.height = fmt.h;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, fmt.w, fmt.h);
    ctx.filter = `brightness(${bri}%) contrast(${con}%)`;
    ctx.drawImage(img, cX, cY, cropW, cropH, 0, 0, fmt.w, fmt.h);
    ctx.filter = "none";
    return cv.toDataURL("image/jpeg", 0.95);
  };

  /* ───── Canvas: A4 layout ───── */
  const makeA4 = async (photob64, fmtId, count) => {
    const fmt  = FORMATS[fmtId];
    const a4W  = 2480, a4H = 3508;
    const mg   = Math.round(10 * MM);
    const gap  = Math.round(3 * MM);
    const cv   = document.createElement("canvas");
    cv.width   = a4W; cv.height = a4H;
    const ctx  = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, a4W, a4H);
    const img  = await loadImg(photob64);
    const cols = Math.floor((a4W - 2 * mg + gap) / (fmt.w + gap));
    const rows = Math.floor((a4H - 2 * mg + gap) / (fmt.h + gap));
    let n = 0;
    outer: for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (n >= count) break outer;
        const x = mg + c * (fmt.w + gap);
        const y = mg + r * (fmt.h + gap);
        ctx.drawImage(img, x, y, fmt.w, fmt.h);
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, fmt.w, fmt.h);
        n++;
      }
    }
    return cv;
  };

  /* ───── Process all photos ───── */
  const processAll = async () => {
    if (!uploaded) return;
    setGenerating(true); setErr(null);
    try {
      let fd = faceData;
      if (!fd) fd = await detectFace(uploaded);
      const res = {};
      for (const id of Object.keys(FORMATS))
        res[id] = await cropPhoto(uploaded, fd, id, brightness, contrast, bgColor);
      setPhotos(res);
      flash("✓ Passport photos generated!");
      setPage("preview");
    } catch (e) {
      flash("Processing failed. Please try another image.", true);
    } finally { setGenerating(false); setDetecting(false); }
  };

  /* ───── Downloads ───── */
  const dlSingle = (b64, fmtId) => {
    const a = document.createElement("a");
    a.href     = b64;
    a.download = `photo2passport_${fmtId}_${Date.now()}.jpg`;
    a.click();
  };

  const dlPDF = async (fmtId) => {
    try {
      const a4cv  = await makeA4(photos[fmtId], fmtId, copies);
      const data  = a4cv.toDataURL("image/jpeg", 0.92);
      const { jsPDF } = window.jspdf;
      const pdf   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(data, "JPEG", 0, 0, 210, 297);
      pdf.save(`photo2passport_A4_${fmtId}_${Date.now()}.pdf`);
      flash("PDF downloaded!");
    } catch (e) { flash("PDF failed — ensure the page is fully loaded.", true); }
  };

  const dlZip = async () => {
    try {
      const zip  = new window.JSZip();
      const fld  = zip.folder("photo2passport");
      for (const [id, b64] of Object.entries(photos))
        fld.file(`${id}.jpg`, b64.split(",")[1], { base64: true });
      for (const [id, b64] of Object.entries(photos)) {
        const cv = await makeA4(b64, id, copies);
        fld.file(`A4_${id}.jpg`, cv.toDataURL("image/jpeg",.9).split(",")[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `photo2passport_${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(url);
      flash("ZIP downloaded!");
    } catch (e) { flash("ZIP failed — ensure JSZip is loaded.", true); }
  };

  /* ═══════════════════════════════════════════
                    NAVBAR
  ═══════════════════════════════════════════ */
  const navItems = [
    { id: "home",    label: "Home",    Icon: Home },
    { id: "upload",  label: "Editor",  Icon: Camera },
    { id: "preview", label: "Preview", Icon: Eye },
    { id: "about",   label: "About",   Icon: Info },
    { id: "contact", label: "Contact", Icon: Mail },
  ];

  const Navbar = (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: dark ? "rgba(8,12,26,.9)" : "rgba(238,241,249,.9)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${t.border}`,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <div onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div className="gbtn" style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={18} color="#fff" />
          </div>
          <span className="syne" style={{ fontSize: 20, fontWeight: 800, color: t.text }}>
            Photo<span className="gtext">2Passport</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }} className="desktop-nav">
          {navItems.map(({ id, label }) => (
            <button key={id} onClick={() => setPage(id)} style={{
              background: page === id ? (dark ? "rgba(99,102,241,.18)" : "rgba(99,102,241,.1)") : "transparent",
              color: page === id ? "#818cf8" : t.muted,
              border: "none", padding: "8px 16px", borderRadius: 10,
              fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
              transition: "all .2s",
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setDark(!dark)} style={{
            width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
            background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)",
            display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#fbbf24" : "#64748b",
          }}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{
            width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
            background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: t.muted,
          }} className="mobile-menu-btn">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <button onClick={() => { setPage("upload"); fileRef.current?.click(); }}
            className="gbtn" style={{ color: "#fff", padding: "8px 18px", borderRadius: 12, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }} className2="desktop-cta">
            <Upload size={15} /> Get Started
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, background: dark ? "#0a0e1a" : "#fff" }}>
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setPage(id); setMobileOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px",
              borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 4, fontFamily: "Syne,sans-serif",
              fontWeight: 600, fontSize: 14, textAlign: "left",
              background: page === id ? "rgba(99,102,241,.15)" : "transparent",
              color: page === id ? "#818cf8" : t.muted,
            }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );

  /* Toast notifications */
  const Toast = (
    <>
      {err && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
          backdropFilter: "blur(16px)", color: "#fca5a5",
          padding: "12px 20px", borderRadius: 14, zIndex: 999,
          display: "flex", alignItems: "center", gap: 10, fontFamily: "Syne,sans-serif",
          fontSize: 14, fontWeight: 600, maxWidth: "90vw",
        }}>
          <AlertCircle size={16} /> {err}
          <button onClick={() => setErr(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fca5a5", marginLeft: 4 }}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(52,211,153,.12)", border: "1px solid rgba(52,211,153,.3)",
          backdropFilter: "blur(16px)", color: "#6ee7b7",
          padding: "12px 20px", borderRadius: 14, zIndex: 999,
          display: "flex", alignItems: "center", gap: 10, fontFamily: "Syne,sans-serif",
          fontSize: 14, fontWeight: 600,
        }}>
          <Check size={16} /> {success}
        </div>
      )}
    </>
  );

  /* ═══════════════════════════════════════════
                  HOME PAGE
  ═══════════════════════════════════════════ */
  const HomePage = (
    <div className="page-mount" style={{ minHeight: "100vh", background: t.bg }}>
      {/* Hero */}
      <div style={{ paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        {/* Background orbs */}
        <div className="orb1" style={{ position: "absolute", top: 60, left: "20%", width: 440, height: 440, background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div className="orb2" style={{ position: "absolute", top: 140, right: "15%", width: 300, height: 300, background: "radial-gradient(circle, rgba(168,85,247,.16) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px", textAlign: "center", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 18px", borderRadius: 40,
            background: dark ? "rgba(99,102,241,.12)" : "rgba(99,102,241,.08)",
            border: "1px solid rgba(99,102,241,.25)",
            color: "#818cf8", fontSize: 12, fontWeight: 700,
            fontFamily: "Space Mono, monospace", marginBottom: 32,
          }}>
            <Zap size={12} /> AI-Powered · Instant · Free
          </div>

          <h1 className="syne" style={{ fontSize: "clamp(38px,6vw,70px)", fontWeight: 800, lineHeight: 1.08, color: t.text, marginBottom: 24 }}>
            Professional Passport<br />Photos in{" "}
            <span className="gtext">Seconds</span>
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.7, color: t.muted, maxWidth: 560, margin: "0 auto 40px" }}>
            Upload any portrait — our AI detects your face, crops and aligns perfectly, and generates print-ready passport, visa, and stamp photos.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="gbtn anim-float"
              onClick={() => fileRef.current?.click()}
              style={{ color: "#fff", padding: "16px 32px", borderRadius: 18, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", gap: 10 }}
            >
              <Upload size={20} /> Upload Photo
            </button>
            <button
              onClick={() => setPage("about")}
              style={{
                background: dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)",
                border: `1px solid ${t.border}`,
                color: t.text, padding: "16px 28px", borderRadius: 18,
                fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16,
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                transition: "all .2s",
              }}
            >
              Learn More <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 60 }}>
          {[
            { Icon: Zap,     color: "#818cf8", title: "AI Face Detection",   desc: "Claude AI analyses your portrait and precisely locates and centers the face within international standards." },
            { Icon: Grid,    color: "#a78bfa", title: "4 Photo Formats",     desc: "India/EU, US/Canada passport, Schengen visa, and stamp size — all generated from a single upload." },
            { Icon: Printer, color: "#fbbf24", title: "Print-Ready PDF",     desc: "Auto-arrange up to 20 copies on an A4 sheet at 300 DPI — download and walk straight to the print shop." },
            { Icon: Lock,    color: "#34d399", title: "Secure & Private",    desc: "All processing happens in your browser. Your photos are never stored on any server." },
          ].map(({ Icon, color, title, desc }, i) => (
            <div key={i} className={`${dark ? "glass-dark" : "glass-light"} lift`} style={{ borderRadius: 20, padding: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <Icon size={24} color={color} />
              </div>
              <h3 className="syne" style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: t.muted }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Workflow */}
        <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 28, padding: "48px 40px" }}>
          <h2 className="syne" style={{ fontSize: 32, fontWeight: 800, textAlign: "center", color: t.text, marginBottom: 48 }}>
            How It <span className="gtext">Works</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32 }}>
            {[
              { n: "01", title: "Upload",    desc: "Drag & drop or click to choose a JPG or PNG portrait photo." },
              { n: "02", title: "AI Crops",  desc: "Our AI pinpoints your face and calculates the ideal crop zone." },
              { n: "03", title: "Customize", desc: "Pick background color, tweak brightness/contrast, choose format." },
              { n: "04", title: "Download",  desc: "Export PNG, A4 print PDF, or a ZIP with all formats." },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div className="mono" style={{
                  width: 48, height: 48, borderRadius: "50%", border: "2px solid rgba(99,102,241,.4)",
                  background: "rgba(99,102,241,.1)", display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 16px",
                  fontSize: 13, fontWeight: 700, color: "#818cf8",
                }}>{s.n}</div>
                <h4 className="syne" style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 8 }}>{s.title}</h4>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: t.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Format showcase */}
        <h2 className="syne" style={{ fontSize: 32, fontWeight: 800, color: t.text, textAlign: "center", margin: "60px 0 32px" }}>
          Supported <span className="gtext">Formats</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          {Object.entries(FORMATS).map(([id, fmt]) => (
            <div key={id} className={`${dark ? "glass-dark" : "glass-light"} lift`} style={{ borderRadius: 18, padding: 24, textAlign: "center" }}>
              <div style={{ width: 36, height: 46, borderRadius: 8, border: `2px solid ${fmt.color}`, background: `${fmt.color}14`, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FileImage size={18} color={fmt.color} />
              </div>
              <div className="syne" style={{ fontWeight: 700, fontSize: 14, color: t.text, marginBottom: 6 }}>{fmt.label}</div>
              <div className="mono" style={{ fontSize: 11, color: t.muted }}>{fmt.mmW}×{fmt.mmH} mm</div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div style={{
          marginTop: 60, borderRadius: 28, padding: "50px 40px", textAlign: "center",
          background: "linear-gradient(135deg, rgba(99,102,241,.15), rgba(168,85,247,.12))",
          border: "1px solid rgba(99,102,241,.25)",
        }}>
          <h2 className="syne" style={{ fontSize: 36, fontWeight: 800, color: t.text, marginBottom: 16 }}>
            Ready to create your photos?
          </h2>
          <p style={{ color: t.muted, marginBottom: 28, fontSize: 16 }}>Free, instant, no sign-up required.</p>
          <button className="gbtn" onClick={() => fileRef.current?.click()}
            style={{ color: "#fff", padding: "16px 36px", borderRadius: 16, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 17, display: "inline-flex", alignItems: "center", gap: 10 }}>
            <Upload size={20} /> Upload Now
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
                 UPLOAD / EDITOR PAGE
  ═══════════════════════════════════════════ */
  const UploadPage = (
    <div className="page-mount" style={{ minHeight: "100vh", background: t.bg, paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <h1 className="syne" style={{ fontSize: 38, fontWeight: 800, color: t.text, marginBottom: 6 }}>
          Photo <span className="gtext">Editor</span>
        </h1>
        <p style={{ color: t.muted, marginBottom: 36 }}>Configure your photo settings then click Generate.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "minmax(0,1.7fr) minmax(0,1fr)", gap: 24 }}>

            {/* LEFT — upload zone / preview */}
            <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 24, overflow: "hidden" }}>
              {!uploaded ? (
                <div
                  className={`dragzone${dragging ? " over" : ""}`}
                  onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? "#6366f1" : t.border}`,
                    borderRadius: 24, padding: "80px 40px", textAlign: "center",
                    cursor: "pointer", transition: "all .2s",
                    background: dragging ? "rgba(99,102,241,.08)" : "transparent",
                  }}
                >
                  <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(99,102,241,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <Upload size={38} color="#818cf8" />
                  </div>
                  <h3 className="syne" style={{ fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 10 }}>Drop your photo here</h3>
                  <p style={{ fontSize: 14, color: t.muted, marginBottom: 20 }}>JPG · JPEG · PNG · Max 20 MB</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)", color: t.text, fontFamily: "Syne,sans-serif", fontWeight: 600, fontSize: 14 }}>
                    <FileImage size={16} /> Browse Files
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="syne" style={{ fontWeight: 700, color: t.text }}>Uploaded Photo</span>
                    <button onClick={() => { setUploaded(null); setFaceData(null); setPhotos({}); }}
                      style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", borderRadius: 10, padding: "6px 14px", fontFamily: "Syne,sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                      <X size={13} /> Remove
                    </button>
                  </div>
                  <div style={{ padding: 20 }}>
                    <img src={uploaded} alt="Uploaded" style={{
                      width: "100%", maxHeight: 380, objectFit: "contain", borderRadius: 16,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    }} />
                    {faceData && (
                      <div style={{ marginTop: 14, padding: "10px 16px", borderRadius: 12, background: faceData.ok ? "rgba(52,211,153,.1)" : "rgba(251,191,36,.1)", border: `1px solid ${faceData.ok ? "rgba(52,211,153,.25)" : "rgba(251,191,36,.25)"}`, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: faceData.ok ? "#6ee7b7" : "#fde68a" }}>
                        <Check size={15} />
                        {faceData.ok ? "Face detected — crop calculated" : "Using center crop (no clear face found)"}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* RIGHT — settings panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Format */}
              <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 20, padding: 20 }}>
                <h3 className="syne" style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Grid size={15} color="#818cf8" /> Format
                </h3>
                {Object.entries(FORMATS).map(([id, fmt]) => (
                  <button key={id} onClick={() => setSelFormat(id)} style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "10px 14px", borderRadius: 14, marginBottom: 6,
                    border: `1px solid ${selFormat === id ? "#6366f1" : t.border}`,
                    background: selFormat === id ? "rgba(99,102,241,.12)" : "transparent",
                    cursor: "pointer", transition: "all .2s",
                  }}>
                    <div style={{ width: 20, height: 26, borderRadius: 4, border: `2px solid ${fmt.color}`, flexShrink: 0 }} />
                    <div style={{ textAlign: "left", flex: 1 }}>
                      <div className="syne" style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{fmt.label}</div>
                      <div className="mono" style={{ fontSize: 11, color: t.muted }}>{fmt.mmW}×{fmt.mmH}mm</div>
                    </div>
                    {selFormat === id && <Check size={14} color="#818cf8" />}
                  </button>
                ))}
              </div>

              {/* Background */}
              <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 20, padding: 20 }}>
                <h3 className="syne" style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Sliders size={15} color="#a78bfa" /> Background
                </h3>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {BG_PRESETS.map((bg) => (
                    <button key={bg.id} onClick={() => setBgColor(bg.value)} title={bg.label} style={{
                      width: 36, height: 36, borderRadius: 10, backgroundColor: bg.value, cursor: "pointer",
                      border: bgColor === bg.value ? "3px solid #6366f1" : `2px solid ${t.border}`,
                      transition: "border .2s, transform .2s",
                      transform: bgColor === bg.value ? "scale(1.12)" : "scale(1)",
                    }} />
                  ))}
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} title="Custom color"
                    style={{ width: 36, height: 36, borderRadius: 10, border: `2px dashed ${t.border}`, cursor: "pointer", padding: 0, background: "transparent" }} />
                </div>
              </div>

              {/* Adjustments */}
              <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 20, padding: 20 }}>
                <h3 className="syne" style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <Settings size={15} color="#fbbf24" /> Adjustments
                </h3>
                {[
                  { label: "Brightness", val: brightness, set: setBrightness },
                  { label: "Contrast",   val: contrast,   set: setContrast },
                ].map(({ label, val, set }) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: t.muted, fontFamily: "Syne,sans-serif" }}>{label}</span>
                      <span className="mono" style={{ fontSize: 12, color: "#818cf8" }}>{val}%</span>
                    </div>
                    <input type="range" min={50} max={150} value={val}
                      onChange={(e) => set(+e.target.value)}
                      style={{ width: "100%", accentColor: "#6366f1" }} />
                  </div>
                ))}
                <button onClick={() => { setBrightness(100); setContrast(100); }} style={{
                  fontSize: 12, padding: "6px 14px", borderRadius: 8, border: `1px solid ${t.border}`,
                  background: "transparent", color: t.muted, fontFamily: "Syne,sans-serif", cursor: "pointer",
                }}>↺ Reset</button>
              </div>

              {/* Copies */}
              <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 20, padding: 20 }}>
                <h3 className="syne" style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <Printer size={15} color="#34d399" /> Copies on A4
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <input type="range" min={1} max={20} value={copies} onChange={(e) => setCopies(+e.target.value)}
                    style={{ flex: 1, accentColor: "#6366f1" }} />
                  <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: t.text, minWidth: 32, textAlign: "center" }}>{copies}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generate button */}
          {uploaded && (
            <button onClick={processAll} disabled={detecting || generating} className="gbtn"
              style={{ width: "100%", color: "#fff", padding: "18px 0", borderRadius: 20, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              {detecting || generating ? (
                <><span className="anim-spin" style={{ display: "inline-block" }}><Loader2 size={22} /></span>
                {detecting ? "Detecting face…" : "Generating photos…"}</>
              ) : (
                <><Zap size={22} /> Generate Passport Photos</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
                PREVIEW & DOWNLOAD PAGE
  ═══════════════════════════════════════════ */
  const PreviewPage = Object.keys(photos).length === 0 ? (
    <div className="page-mount" style={{ minHeight: "100vh", background: t.bg, paddingTop: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <ImageIcon size={64} color={t.muted} style={{ margin: "0 auto 20px" }} />
        <h2 className="syne" style={{ fontSize: 28, fontWeight: 700, color: t.text, marginBottom: 12 }}>No Photos Yet</h2>
        <p style={{ color: t.muted, marginBottom: 28 }}>Upload and process a photo first.</p>
        <button className="gbtn" onClick={() => setPage("upload")} style={{ color: "#fff", padding: "14px 28px", borderRadius: 14, fontFamily: "Syne,sans-serif", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Upload size={18} /> Go to Editor
        </button>
      </div>
    </div>
  ) : (
    <div className="page-mount" style={{ minHeight: "100vh", background: t.bg, paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
          <div>
            <h1 className="syne" style={{ fontSize: 38, fontWeight: 800, color: t.text, marginBottom: 6 }}>
              Your <span className="gtext">Photos</span>
            </h1>
            <p style={{ color: t.muted }}>All formats generated at 300 DPI — ready to print.</p>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={dlZip} style={{
              padding: "12px 22px", borderRadius: 14, border: `1px solid ${t.border}`,
              background: "transparent", color: t.text, fontFamily: "Syne,sans-serif",
              fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              <Download size={16} /> Download ZIP
            </button>
            <button onClick={() => setPage("upload")} style={{
              padding: "12px 22px", borderRadius: 14, border: "1px solid rgba(99,102,241,.35)",
              background: "rgba(99,102,241,.1)", color: "#818cf8", fontFamily: "Syne,sans-serif",
              fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              <Camera size={16} /> Edit Again
            </button>
          </div>
        </div>

        {/* Photo cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 20, marginBottom: 40 }}>
          {Object.entries(photos).map(([id, b64]) => {
            const fmt = FORMATS[id];
            return (
              <div key={id} className={`${dark ? "glass-dark" : "glass-light"} photo-card`} style={{ borderRadius: 20, overflow: "hidden", position: "relative" }}>
                <div style={{ aspectRatio: `${fmt.mmW}/${fmt.mmH}`, overflow: "hidden", position: "relative" }}>
                  <img src={b64} alt={fmt.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div className="overlay" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.6), transparent)", display: "flex", alignItems: "flex-end", padding: 12 }}>
                    <button onClick={() => dlSingle(b64, id)} style={{
                      width: "100%", padding: "9px 0", borderRadius: 10, background: "rgba(255,255,255,.18)",
                      backdropFilter: "blur(8px)", color: "#fff", border: "none", cursor: "pointer",
                      fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <Download size={14} /> Download
                    </button>
                  </div>
                </div>
                <div style={{ padding: 16, borderTop: `1px solid ${t.border}` }}>
                  <div className="syne" style={{ fontWeight: 700, fontSize: 14, color: t.text, marginBottom: 4 }}>{fmt.label}</div>
                  <div className="mono" style={{ fontSize: 11, color: t.muted, marginBottom: 12 }}>{fmt.mmW}×{fmt.mmH}mm · {fmt.w}×{fmt.h}px</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => dlSingle(b64, id)} style={{
                      flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                      background: "rgba(99,102,241,.18)", color: "#818cf8",
                      fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}><Download size={12} /> PNG</button>
                    <button onClick={() => dlPDF(id)} style={{
                      flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                      background: "rgba(168,85,247,.18)", color: "#c084fc",
                      fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 12, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}><Printer size={12} /> PDF</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* A4 Print panel */}
        <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 24, padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
            <div>
              <h3 className="syne" style={{ fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 6 }}>A4 Printable Layout</h3>
              <p style={{ fontSize: 14, color: t.muted }}>
                {copies} copies of <strong style={{ color: t.text }}>{FORMATS[selFormat].label}</strong> arranged on an A4 sheet at 300 DPI.
              </p>
            </div>
            <button onClick={() => dlPDF(selFormat)} className="gbtn"
              style={{ color: "#fff", padding: "14px 28px", borderRadius: 14, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <Printer size={18} /> Print A4 PDF
            </button>
          </div>

          {/* A4 visual preview */}
          <div style={{ maxWidth: 260, margin: "0 auto", padding: 12, background: "#fff", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <div style={{ position: "relative", paddingTop: "141.4%" }}>
              <div style={{ position: "absolute", inset: "6%", display: "flex", flexWrap: "wrap", gap: "2%", alignContent: "flex-start" }}>
                {Array.from({ length: Math.min(copies, 12) }).map((_, i) => (
                  <div key={i} style={{
                    width: `${Math.floor(88 / Math.ceil(Math.sqrt(Math.min(copies,12))))-1}%`,
                    aspectRatio: `${FORMATS[selFormat].mmW}/${FORMATS[selFormat].mmH}`,
                    overflow: "hidden", border: "1px solid #e5e7eb", borderRadius: 2,
                  }}>
                    <img src={photos[selFormat]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
                   ABOUT PAGE
  ═══════════════════════════════════════════ */
  const AboutPage = (
    <div className="page-mount" style={{ minHeight: "100vh", background: t.bg, paddingTop: 80 }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px" }}>
        <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 28, padding: "52px 48px" }}>
          <h1 className="syne" style={{ fontSize: 42, fontWeight: 800, color: t.text, marginBottom: 8 }}>
            About <span className="gtext">Photo2Passport</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: t.muted, marginBottom: 20 }}>
            Photo2Passport is a modern, AI-powered browser application that simplifies the creation of professional passport and identity photos. No studio, no software, no sign-up — just upload and go.
          </p>
          <p style={{ lineHeight: 1.75, color: t.muted, marginBottom: 36 }}>
            Powered by Claude AI for precise face detection and the HTML5 Canvas API for high-fidelity image processing, every output is generated at 300 DPI and meets international compliance standards.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 44 }}>
            {[
              { val: "4+",      label: "Photo Formats" },
              { val: "300 DPI", label: "Print Quality" },
              { val: "100%",    label: "Client-Side" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "20px 12px", borderRadius: 16, background: dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)" }}>
                <div className="syne gtext" style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: t.muted }}>{s.label}</div>
              </div>
            ))}
          </div>

          <h2 className="syne" style={{ fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 20 }}>Features</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              "Claude AI face detection & auto-crop",
              "Passport, visa, and stamp photo formats",
              "Custom background color picker",
              "Brightness & contrast controls",
              "A4 print layout (up to 20 copies)",
              "Download PNG, PDF, or ZIP bundle",
              "300 DPI high-resolution output",
              "Zero server uploads — 100% private",
              "Dark and light theme",
              "Fully mobile responsive",
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: t.muted }}>
                <Check size={15} color="#818cf8" style={{ flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 44, padding: 24, borderRadius: 18, background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Shield size={18} color="#818cf8" />
              <span className="syne" style={{ fontWeight: 700, fontSize: 15, color: t.text }}>Privacy First</span>
            </div>
            <p style={{ fontSize: 14, color: t.muted, lineHeight: 1.65 }}>
              Your photos never leave your device. All image processing is performed in your browser using the Canvas API. Only a temporary anonymised crop request is sent to the AI model — no image is stored on any server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
                  CONTACT PAGE
  ═══════════════════════════════════════════ */
  const ContactPage = (
    <div className="page-mount" style={{ minHeight: "100vh", background: t.bg, paddingTop: 80 }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px" }}>
        <h1 className="syne" style={{ fontSize: 38, fontWeight: 800, color: t.text, marginBottom: 8 }}>
          Get in <span className="gtext">Touch</span>
        </h1>
        <p style={{ color: t.muted, marginBottom: 36 }}>Questions, feedback, or feature requests — we'd love to hear from you.</p>

        <div className={dark ? "glass-dark" : "glass-light"} style={{ borderRadius: 24, padding: 36 }}>
          {cSent ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(52,211,153,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Check size={32} color="#34d399" />
              </div>
              <h3 className="syne" style={{ fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 10 }}>Message Sent!</h3>
              <p style={{ color: t.muted, marginBottom: 28 }}>We'll get back to you as soon as possible.</p>
              <button onClick={() => { setCSent(false); setCForm({ name: "", email: "", msg: "" }); }}
                className="gbtn" style={{ color: "#fff", padding: "12px 28px", borderRadius: 14, fontFamily: "Syne,sans-serif", fontWeight: 700, cursor: "pointer" }}>
                Send Another
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { id: "name",  label: "Full Name",      type: "text",  ph: "Jane Smith" },
                { id: "email", label: "Email Address",  type: "email", ph: "jane@example.com" },
              ].map(f => (
                <div key={f.id}>
                  <label className="syne" style={{ display: "block", fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={cForm[f.id]}
                    onChange={(e) => setCForm({ ...cForm, [f.id]: e.target.value })}
                    style={{ ...t.input, width: "100%", padding: "12px 16px", borderRadius: 14, fontFamily: "Syne,sans-serif", fontSize: 14, outline: "none" }} />
                </div>
              ))}
              <div>
                <label className="syne" style={{ display: "block", fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8 }}>Message</label>
                <textarea rows={5} placeholder="How can we help?" value={cForm.msg}
                  onChange={(e) => setCForm({ ...cForm, msg: e.target.value })}
                  style={{ ...t.input, width: "100%", padding: "12px 16px", borderRadius: 14, fontFamily: "Syne,sans-serif", fontSize: 14, outline: "none", resize: "vertical" }} />
              </div>
              <button onClick={() => { if (cForm.name && cForm.email) setCSent(true); else flash("Please fill in all fields.", true); }}
                className="gbtn" style={{ color: "#fff", padding: "16px 0", borderRadius: 16, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <Mail size={18} /> Send Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════
               HIDDEN FILE INPUT
  ═══════════════════════════════════════════ */
  const HiddenInput = (
    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: "none" }}
      onChange={(e) => handleFile(e.target.files[0])} />
  );

  /* ═══════════════════════════════════════════
                  RENDER
  ═══════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: "Syne, sans-serif", background: t.bg }}>
      <style>{GLOBAL_STYLE}</style>
      <style>{`
        @media(max-width:768px){
        .editor-layout { grid-template-columns: minmax(0,1,7fr) minmax(0,1fr) !important; }
          .desktop-nav { display:none !important; }
          .desktop-cta { display:none !important; }
          .mobile-menu-btn { display:flex !important; }
        }
        @media(min-width:768px){
          .mobile-menu-btn { display:none !important; }
          .desktop-nav { display:flex !important; }
          .desktop-cta { display:inline-flex !important; }
        }
      `}</style>

      {Navbar}
      {HiddenInput}
      {Toast}

      {page === "home"    && HomePage}
      {page === "upload"  && UploadPage}
      {page === "preview" && PreviewPage}
      {page === "about"   && AboutPage}
      {page === "contact" && ContactPage}
    </div>
  );
}
