import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, Download, Camera, FileImage, Sun, Moon, ChevronRight,
  Zap, Printer, Grid, Settings, Eye, Check, AlertCircle, Loader2,
  X, ImageIcon, Menu, Home, Info, Mail, Shield, Sliders,
} from "lucide-react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

const DPI = 300;
const MM  = DPI / 25.4;

const FORMATS = {
  passport_india: { label: "Passport (India/EU)",   mmW: 35, mmH: 45, color: "#818cf8", w: Math.round(35*MM), h: Math.round(45*MM) },
  passport_us:    { label: "Passport (US/Canada)",  mmW: 51, mmH: 51, color: "#a78bfa", w: Math.round(51*MM), h: Math.round(51*MM) },
  stamp:          { label: "Stamp Size",             mmW: 25, mmH: 30, color: "#fbbf24", w: Math.round(25*MM), h: Math.round(30*MM) },
  visa:           { label: "Visa (Schengen)",        mmW: 35, mmH: 45, color: "#34d399", w: Math.round(35*MM), h: Math.round(45*MM) },
};

const BG_PRESETS = [
  { id: "white", value: "#ffffff", label: "White"      },
  { id: "blue",  value: "#c9dff0", label: "Sky Blue"   },
  { id: "gray",  value: "#ececec", label: "Light Gray" },
  { id: "cream", value: "#faf7f0", label: "Cream"      },
];

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  body { font-family: 'Syne', sans-serif; overflow-x: hidden; }
  .glass-dark  { background:rgba(255,255,255,.04); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,.09); }
  .glass-light { background:rgba(255,255,255,.82); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(0,0,0,.08); box-shadow:0 8px 40px rgba(0,0,0,.06); }
  .gtext { background:linear-gradient(135deg,#818cf8,#c084fc,#f472b6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .gbtn { background:linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow:0 0 28px rgba(99,102,241,.45); transition:box-shadow .3s,transform .3s; cursor:pointer; border:none; }
  .gbtn:hover:not(:disabled) { box-shadow:0 0 52px rgba(99,102,241,.7); transform:translateY(-2px); }
  .gbtn:disabled { opacity:.5; cursor:not-allowed; }
  .lift { transition:transform .25s,box-shadow .25s; }
  .lift:hover { transform:translateY(-4px); box-shadow:0 20px 50px rgba(99,102,241,.15); }
  .dragzone { transition:border-color .2s,background .2s; }
  .dragzone.over { border-color:#6366f1!important; background:rgba(99,102,241,.08)!important; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes orb1    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.06)} }
  @keyframes orb2    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,18px) scale(1.04)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  .anim-fade-up { animation:fadeUp .5s ease forwards; }
  .anim-float   { animation:floatY 3.5s ease-in-out infinite; }
  .orb1         { animation:orb1 8s ease-in-out infinite; }
  .orb2         { animation:orb2 10s ease-in-out infinite; }
  .anim-spin    { animation:spin 1s linear infinite; display:inline-block; }
  input[type=range] { -webkit-appearance:none; height:5px; border-radius:3px; outline:none; cursor:pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:17px; height:17px; border-radius:50%; background:#6366f1; cursor:pointer; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:rgba(99,102,241,.4); border-radius:3px; }
  .photo-card .overlay { opacity:0; transition:opacity .25s; }
  .photo-card:hover .overlay { opacity:1; }
  .page-mount { animation:fadeUp .4s ease forwards; }
`;

const fileToBase64 = (f) => new Promise((res,rej) => { const r=new FileReader(); r.onload=(e)=>res(e.target.result); r.onerror=rej; r.readAsDataURL(f); });
const loadImg = (src) => new Promise((res,rej) => { const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; });

export default function App() {
  const isMobile = useIsMobile();

  useEffect(() => {
    const addScript = (src) => { const s=document.createElement("script"); s.src=src; document.head.appendChild(s); };
    addScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    addScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  }, []);

  const [page,       setPage]       = useState("home");
  const [dark,       setDark]       = useState(true);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [uploaded,   setUploaded]   = useState(null);
  const [faceData,   setFaceData]   = useState(null);
  const [photos,     setPhotos]     = useState({});
  const [detecting,  setDetecting]  = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dragging,   setDragging]   = useState(false);
  const [err,        setErr]        = useState(null);
  const [success,    setSuccess]    = useState(null);
  const [bgColor,    setBgColor]    = useState("#ffffff");
  const [brightness, setBrightness] = useState(100);
  const [contrast,   setContrast]   = useState(100);
  const [selFormat,  setSelFormat]  = useState("passport_india");
  const [copies,     setCopies]     = useState(8);
  const [cForm,      setCForm]      = useState({ name:"", email:"", msg:"" });
  const [cSent,      setCSent]      = useState(false);
  const fileRef = useRef(null);

  const t = {
    bg:    dark ? "#080c1a" : "#eef1f9",
    card:  dark ? "glass-dark" : "glass-light",
    text:  dark ? "#f1f5f9" : "#0f172a",
    muted: dark ? "#94a3b8" : "#64748b",
    border:dark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.08)",
    input: dark
      ? { background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#f1f5f9" }
      : { background:"#fff", border:"1px solid #e2e8f0", color:"#0f172a" },
  };

  const flash = (msg, isErr=false) => {
    if(isErr){ setErr(msg); setTimeout(()=>setErr(null),4000); }
    else      { setSuccess(msg); setTimeout(()=>setSuccess(null),3000); }
  };

  const handleFile = async (file) => {
    if(!file) return;
    if(!["image/jpeg","image/jpg","image/png"].includes(file.type)) return flash("Please upload JPG or PNG.",true);
    if(file.size > 20*1024*1024) return flash("File must be under 20 MB.",true);
    const b64 = await fileToBase64(file);
    setUploaded(b64); setFaceData(null); setPhotos({}); setErr(null); setPage("upload");
  };

  const onDrop      = useCallback(async(e)=>{ e.preventDefault(); setDragging(false); await handleFile(e.dataTransfer.files[0]); },[]);
  const onDragOver  = (e)=>{ e.preventDefault(); setDragging(true); };
  const onDragLeave = ()=> setDragging(false);

  const detectFace = async (b64) => {
    setDetecting(true);
    try {
      const raw=b64.split(",")[1], mime=b64.split(";")[0].split(":")[1];
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:300,
          messages:[{ role:"user", content:[
            { type:"image", source:{ type:"base64", media_type:mime, data:raw } },
            { type:"text", text:`Detect the face. Reply ONLY JSON:\n{"faceX":<0-1>,"faceY":<0-1>,"faceW":<0-1>,"faceH":<0-1>,"ok":true}\nNo face: {"faceX":0.5,"faceY":0.38,"faceW":0.42,"faceH":0.38,"ok":false}` }
          ]}]
        })
      });
      const data=await res.json();
      const txt=data.content?.find(c=>c.type==="text")?.text||"";
      const m=txt.match(/\{[\s\S]*?\}/);
      if(m){ const fd=JSON.parse(m[0]); setFaceData(fd); return fd; }
    } catch(_){}
    const def={ faceX:.5, faceY:.38, faceW:.42, faceH:.38, ok:false };
    setFaceData(def); return def;
  };

  const cropPhoto = async (b64,fd,fmtId,bri,con,bg) => {
  const fmt=FORMATS[fmtId], img=await loadImg(b64);
  const iW=img.naturalWidth||img.width, iH=img.naturalHeight||img.height;
  const asp=fmt.mmW/fmt.mmH, fcX=fd.faceX*iW, fcY=fd.faceY*iH, fH=fd.faceH*iH;
  let cropH=(fH*2.2)/0.73, cropW=cropH*asp;
  if(cropW>iW){ cropW=iW; cropH=cropW/asp; }
  if(cropH>iH){ cropH=iH; cropW=cropH*asp; }
  const headTop=fcY-fH*.5-fH*.5;
  const cY=Math.max(0,Math.min(headTop-cropH*.08,iH-cropH));
  const cX=Math.max(0,Math.min(fcX-cropW/2,iW-cropW));

  // Step 1 — draw cropped image on temp canvas
  const tmp=document.createElement("canvas"); tmp.width=fmt.w; tmp.height=fmt.h;
  const tctx=tmp.getContext("2d");
  tctx.filter=`brightness(${bri}%) contrast(${con}%)`;
  tctx.drawImage(img,cX,cY,cropW,cropH,0,0,fmt.w,fmt.h);
  tctx.filter="none";

  // Step 2 — replace background pixels
  const imgData=tctx.getImageData(0,0,fmt.w,fmt.h);
  const d=imgData.data;
  const bgR=parseInt(bg.slice(1,3),16);
  const bgG=parseInt(bg.slice(3,5),16);
  const bgB=parseInt(bg.slice(5,7),16);

  for(let i=0;i<d.length;i+=4){
    const r=d[i], g=d[i+1], b=d[i+2];
    // detect light/white background pixels
    const brightness=(r+g+b)/3;
    const isLight = brightness > 200 && Math.max(r,g,b)-Math.min(r,g,b) < 40;
    if(isLight){ d[i]=bgR; d[i+1]=bgG; d[i+2]=bgB; }
  }
  tctx.putImageData(imgData,0,0);

  // Step 3 — final canvas with bg
  const cv=document.createElement("canvas"); cv.width=fmt.w; cv.height=fmt.h;
  const ctx=cv.getContext("2d");
  ctx.fillStyle=bg; ctx.fillRect(0,0,fmt.w,fmt.h);
  ctx.drawImage(tmp,0,0);
  return cv.toDataURL("image/jpeg",.95);
};

  const makeA4 = async (photob64,fmtId,count) => {
    const fmt=FORMATS[fmtId], a4W=2480, a4H=3508;
    const mg=Math.round(15*MM), gap=Math.round(6*MM);
    const cv=document.createElement("canvas"); cv.width=a4W; cv.height=a4H;
    const ctx=cv.getContext("2d");
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,a4W,a4H);
    const img=await loadImg(photob64);
    const cols=Math.floor((a4W-2*mg+gap)/(fmt.w+gap));
    const rows=Math.floor((a4H-2*mg+gap)/(fmt.h+gap));
    let n=0;
    outer: for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      if(n>=count) break outer;
      const x=mg+c*(fmt.w+gap), y=mg+r*(fmt.h+gap);
      ctx.drawImage(img,x,y,fmt.w,fmt.h);
      ctx.strokeStyle="#d1d5db"; ctx.lineWidth=2; ctx.strokeRect(x,y,fmt.w,fmt.h);
      n++;
    }
    return cv;
  };

  const processAll = async () => {
    if(!uploaded) return;
    setGenerating(true); setErr(null);
    try {
      let fd=faceData; if(!fd) fd=await detectFace(uploaded);
      const res={};
      for(const id of Object.keys(FORMATS)) res[id]=await cropPhoto(uploaded,fd,id,brightness,contrast,bgColor);
      setPhotos(res); flash("Photos generated!"); setPage("preview");
    } catch(e){ flash("Processing failed. Try another image.",true); }
    finally{ setGenerating(false); setDetecting(false); }
  };

  const dlSingle = (b64,fmtId) => { const a=document.createElement("a"); a.href=b64; a.download=`photo2passport_${fmtId}.jpg`; a.click(); };
  const dlPDF = async (fmtId) => {
    try {
      const a4cv=await makeA4(photos[fmtId],fmtId,copies);
      const data=a4cv.toDataURL("image/jpeg",.92);
      const {jsPDF}=window.jspdf;
      const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      pdf.addImage(data,"JPEG",0,0,210,297); pdf.save(`photo2passport_A4_${fmtId}.pdf`);
      flash("PDF downloaded!");
    } catch(e){ flash("PDF failed.",true); }
  };
  const dlZip = async () => {
    try {
      const zip=new window.JSZip(); const fld=zip.folder("photo2passport");
      for(const [id,b64] of Object.entries(photos)) fld.file(`${id}.jpg`,b64.split(",")[1],{base64:true});
      for(const [id,b64] of Object.entries(photos)){
        const cv=await makeA4(b64,id,copies);
        fld.file(`A4_${id}.jpg`,cv.toDataURL("image/jpeg",.9).split(",")[1],{base64:true});
      }
      const blob=await zip.generateAsync({type:"blob"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=`photo2passport.zip`; a.click();
      URL.revokeObjectURL(url); flash("ZIP downloaded!");
    } catch(e){ flash("ZIP failed.",true); }
  };

  const navItems = [
    { id:"home",    label:"Home",    Icon:Home    },
    { id:"upload",  label:"Editor",  Icon:Camera  },
    { id:"preview", label:"Preview", Icon:Eye     },
    { id:"about",   label:"About",   Icon:Info    },
    { id:"contact", label:"Contact", Icon:Mail    },
  ];

  const Navbar = (
    <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:100, background:dark?"rgba(8,12,26,.93)":"rgba(238,241,249,.93)", backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${t.border}` }}>
      <div style={{ maxWidth:1200,margin:"0 auto",padding:"0 16px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div onClick={()=>{ setPage("home"); setMenuOpen(false); }} style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0 }}>
          <div className="gbtn" style={{ width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Camera size={16} color="#fff"/>
          </div>
          <span style={{ fontSize:isMobile?17:20,fontWeight:800,color:t.text,fontFamily:"Syne,sans-serif" }}>
            Photo<span className="gtext">2Passport</span>
          </span>
        </div>
        {!isMobile && (
          <div style={{ display:"flex",gap:2 }}>
            {navItems.map(({id,label})=>(
              <button key={id} onClick={()=>setPage(id)} style={{ background:page===id?(dark?"rgba(99,102,241,.18)":"rgba(99,102,241,.1)"):"transparent", color:page===id?"#818cf8":t.muted, border:"none",padding:"7px 14px",borderRadius:10, fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:14,cursor:"pointer" }}>{label}</button>
            ))}
          </div>
        )}
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <button onClick={()=>setDark(!dark)} style={{ width:34,height:34,borderRadius:10,border:"none",cursor:"pointer", background:dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)", display:"flex",alignItems:"center",justifyContent:"center",color:dark?"#fbbf24":"#64748b",flexShrink:0 }}>
            {dark?<Sun size={15}/>:<Moon size={15}/>}
          </button>
          {isMobile ? (
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{ width:34,height:34,borderRadius:10,border:"none",cursor:"pointer", background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:t.muted }}>
              {menuOpen?<X size={18}/>:<Menu size={18}/>}
            </button>
          ) : (
            <button onClick={()=>{ setPage("upload"); fileRef.current?.click(); }} className="gbtn"
              style={{ color:"#fff",padding:"8px 16px",borderRadius:12,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6 }}>
              <Upload size={14}/> Upload
            </button>
          )}
        </div>
      </div>
      {isMobile && menuOpen && (
        <div style={{ background:dark?"#0a0e1a":"#fff",borderTop:`1px solid ${t.border}`,padding:"10px 12px" }}>
          {navItems.map(({id,label,Icon})=>(
            <button key={id} onClick={()=>{ setPage(id); setMenuOpen(false); }} style={{ display:"flex",alignItems:"center",gap:12,width:"100%", padding:"12px 14px",borderRadius:12,border:"none",cursor:"pointer",marginBottom:4, fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:15, background:page===id?"rgba(99,102,241,.15)":"transparent", color:page===id?"#818cf8":t.muted }}>
              <Icon size={16}/> {label}
            </button>
          ))}
          <button onClick={()=>{ setPage("upload"); fileRef.current?.click(); setMenuOpen(false); }} className="gbtn"
            style={{ width:"100%",color:"#fff",padding:"12px 0",borderRadius:14,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15, display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4 }}>
            <Upload size={16}/> Upload Photo
          </button>
        </div>
      )}
    </nav>
  );

  const Toast = (
    <>
      {err && (
        <div style={{ position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)", background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)", backdropFilter:"blur(16px)",color:"#fca5a5", padding:"11px 18px",borderRadius:14,zIndex:999, display:"flex",alignItems:"center",gap:10, fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:600,maxWidth:"90vw" }}>
          <AlertCircle size={15}/> {err}
          <button onClick={()=>setErr(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"#fca5a5" }}><X size={13}/></button>
        </div>
      )}
      {success && (
        <div style={{ position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)", background:"rgba(52,211,153,.12)",border:"1px solid rgba(52,211,153,.3)", backdropFilter:"blur(16px)",color:"#6ee7b7", padding:"11px 18px",borderRadius:14,zIndex:999, display:"flex",alignItems:"center",gap:10, fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:600 }}>
          <Check size={15}/> {success}
        </div>
      )}
    </>
  );

  const mxw = { maxWidth:1100, margin:"0 auto", padding:isMobile?"0 16px":"0 24px" };

  /* ── HOME ── */
  const HomePage = (
    <div className="page-mount" style={{ minHeight:"100vh",background:t.bg }}>
      <div style={{ paddingTop:isMobile?90:110,paddingBottom:60,position:"relative",overflow:"hidden" }}>
        <div className="orb1" style={{ position:"absolute",top:60,left:"10%",width:isMobile?220:420,height:isMobile?220:420,background:"radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none" }}/>
        <div className="orb2" style={{ position:"absolute",top:120,right:"5%",width:isMobile?160:280,height:isMobile?160:280,background:"radial-gradient(circle,rgba(168,85,247,.16) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none" }}/>
        <div style={{ maxWidth:800,margin:"0 auto",padding:"0 20px",textAlign:"center",position:"relative" }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"7px 16px",borderRadius:40, background:dark?"rgba(99,102,241,.12)":"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.25)", color:"#818cf8",fontSize:11,fontWeight:700,fontFamily:"Space Mono,monospace",marginBottom:24 }}>
            <Zap size={11}/> AI-Powered · Instant · Free
          </div>
          <h1 style={{ fontSize:isMobile?"clamp(28px,8vw,40px)":"clamp(42px,5vw,66px)",fontWeight:800,lineHeight:1.1,color:t.text,marginBottom:20,fontFamily:"Syne,sans-serif" }}>
            Professional Passport<br/>Photos in <span className="gtext">Seconds</span>
          </h1>
          <p style={{ fontSize:isMobile?14:17,lineHeight:1.7,color:t.muted,maxWidth:480,margin:"0 auto 32px" }}>
            Upload any portrait — AI detects your face, crops and aligns it perfectly, and generates print-ready photos.
          </p>
          <div style={{ display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap" }}>
            <button className="gbtn anim-float" onClick={()=>fileRef.current?.click()}
              style={{ color:"#fff",padding:isMobile?"12px 22px":"14px 28px",borderRadius:16,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:isMobile?14:16,display:"flex",alignItems:"center",gap:8 }}>
              <Upload size={17}/> Upload Photo
            </button>
            <button onClick={()=>setPage("about")} style={{ background:dark?"rgba(255,255,255,.06)":"rgba(0,0,0,.05)", border:`1px solid ${t.border}`,color:t.text, padding:isMobile?"12px 18px":"14px 22px",borderRadius:16, fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:isMobile?14:15, display:"flex",alignItems:"center",gap:8,cursor:"pointer" }}>
              Learn More <ChevronRight size={15}/>
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...mxw,paddingBottom:60 }}>
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:40 }}>
          {[
            { Icon:Zap,    color:"#818cf8",title:"AI Detection",   desc:"Claude AI precisely locates your face." },
            { Icon:Grid,   color:"#a78bfa",title:"4 Formats",      desc:"Passport, visa & stamp in one click." },
            { Icon:Printer,color:"#fbbf24",title:"Print PDF",      desc:"A4 layout at 300 DPI — print-ready." },
            { Icon:Shield, color:"#34d399",title:"100% Private",   desc:"All processing in your browser." },
          ].map(({Icon,color,title,desc},i)=>(
            <div key={i} className={`${t.card} lift`} style={{ borderRadius:18,padding:isMobile?14:22 }}>
              <div style={{ width:38,height:38,borderRadius:10,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12 }}>
                <Icon size={18} color={color}/>
              </div>
              <div style={{ fontSize:isMobile?12:14,fontWeight:700,color:t.text,marginBottom:6,fontFamily:"Syne,sans-serif" }}>{title}</div>
              {!isMobile && <p style={{ fontSize:12,lineHeight:1.6,color:t.muted }}>{desc}</p>}
            </div>
          ))}
        </div>

        <div className={t.card} style={{ borderRadius:22,padding:isMobile?"24px 16px":"40px 36px",marginBottom:40 }}>
          <h2 style={{ fontSize:isMobile?22:28,fontWeight:800,textAlign:"center",color:t.text,marginBottom:32,fontFamily:"Syne,sans-serif" }}>
            How It <span className="gtext">Works</span>
          </h2>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:20 }}>
            {[
              { n:"01",title:"Upload",   desc:"Drop or choose a JPG/PNG." },
              { n:"02",title:"AI Crops", desc:"AI locates and centres your face." },
              { n:"03",title:"Customize",desc:"Pick background, format & brightness." },
              { n:"04",title:"Download", desc:"Export PNG, PDF or ZIP." },
            ].map((s,i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",border:"2px solid rgba(99,102,241,.4)", background:"rgba(99,102,241,.1)",display:"flex",alignItems:"center",justifyContent:"center", margin:"0 auto 12px",fontSize:11,fontWeight:700,color:"#818cf8",fontFamily:"Space Mono,monospace" }}>{s.n}</div>
                <div style={{ fontSize:isMobile?12:14,fontWeight:700,color:t.text,marginBottom:6,fontFamily:"Syne,sans-serif" }}>{s.title}</div>
                <p style={{ fontSize:11,lineHeight:1.6,color:t.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize:isMobile?20:26,fontWeight:800,color:t.text,textAlign:"center",marginBottom:20,fontFamily:"Syne,sans-serif" }}>
          Supported <span className="gtext">Formats</span>
        </h2>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:40 }}>
          {Object.entries(FORMATS).map(([id,fmt])=>(
            <div key={id} className={`${t.card} lift`} style={{ borderRadius:16,padding:"16px 14px",textAlign:"center" }}>
              <div style={{ width:26,height:32,borderRadius:5,border:`2px solid ${fmt.color}`,background:`${fmt.color}14`,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <FileImage size={12} color={fmt.color}/>
              </div>
              <div style={{ fontWeight:700,fontSize:12,color:t.text,marginBottom:4,fontFamily:"Syne,sans-serif" }}>{fmt.label}</div>
              <div style={{ fontSize:10,color:t.muted,fontFamily:"Space Mono,monospace" }}>{fmt.mmW}x{fmt.mmH}mm</div>
            </div>
          ))}
        </div>

        <div style={{ borderRadius:22,padding:isMobile?"28px 16px":"44px 40px",textAlign:"center", background:"linear-gradient(135deg,rgba(99,102,241,.15),rgba(168,85,247,.12))", border:"1px solid rgba(99,102,241,.25)" }}>
          <h2 style={{ fontSize:isMobile?20:30,fontWeight:800,color:t.text,marginBottom:10,fontFamily:"Syne,sans-serif" }}>Ready to create your photos?</h2>
          <p style={{ color:t.muted,marginBottom:22,fontSize:14 }}>Free · Instant · No sign-up</p>
          <button className="gbtn" onClick={()=>fileRef.current?.click()}
            style={{ color:"#fff",padding:"13px 28px",borderRadius:14,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,display:"inline-flex",alignItems:"center",gap:8 }}>
            <Upload size={17}/> Upload Now
          </button>
        </div>
      </div>
    </div>
  );

  /* ── EDITOR ── */
  const UploadPage = (
    <div className="page-mount" style={{ minHeight:"100vh",background:t.bg,paddingTop:70 }}>
      <div style={{ ...mxw,paddingTop:24,paddingBottom:40 }}>
        <h1 style={{ fontSize:isMobile?26:34,fontWeight:800,color:t.text,marginBottom:4,fontFamily:"Syne,sans-serif" }}>
          Photo <span className="gtext">Editor</span>
        </h1>
        <p style={{ color:t.muted,marginBottom:22,fontSize:13 }}>Configure settings then click Generate.</p>

        <div className={t.card} style={{ borderRadius:20,overflow:"hidden",marginBottom:14 }}>
          {!uploaded ? (
            <div className={`dragzone${dragging?" over":""}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${dragging?"#6366f1":t.border}`,borderRadius:20,padding:isMobile?"44px 16px":"64px 40px",textAlign:"center",cursor:"pointer" }}>
              <div style={{ width:60,height:60,borderRadius:16,background:"rgba(99,102,241,.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
                <Upload size={28} color="#818cf8"/>
              </div>
              <h3 style={{ fontSize:isMobile?17:21,fontWeight:700,color:t.text,marginBottom:8,fontFamily:"Syne,sans-serif" }}>Drop your photo here</h3>
              <p style={{ fontSize:13,color:t.muted,marginBottom:16 }}>JPG · PNG · Max 20 MB</p>
              <div style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"9px 18px",borderRadius:12,background:dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)",color:t.text,fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:13 }}>
                <FileImage size={14}/> Browse Files
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding:"13px 15px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <span style={{ fontWeight:700,color:t.text,fontFamily:"Syne,sans-serif",fontSize:14 }}>Uploaded Photo</span>
                <button onClick={()=>{ setUploaded(null); setFaceData(null); setPhotos({}); }} style={{ background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.2)",color:"#f87171",borderRadius:10,padding:"5px 11px",fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
                  <X size={12}/> Remove
                </button>
              </div>
              <div style={{ padding:14 }}>
                <img src={uploaded} alt="Uploaded" style={{ width:"100%",maxHeight:260,objectFit:"contain",borderRadius:12,filter:`brightness(${brightness}%) contrast(${contrast}%)` }}/>
                {faceData && (
                  <div style={{ marginTop:10,padding:"9px 13px",borderRadius:12,background:faceData.ok?"rgba(52,211,153,.1)":"rgba(251,191,36,.1)",border:`1px solid ${faceData.ok?"rgba(52,211,153,.25)":"rgba(251,191,36,.25)"}`,display:"flex",alignItems:"center",gap:8,fontSize:12,color:faceData.ok?"#6ee7b7":"#fde68a" }}>
                    <Check size={13}/> {faceData.ok?"Face detected — crop calculated":"Using center crop (no clear face found)"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:14 }}>
          <div className={t.card} style={{ borderRadius:18,padding:16 }}>
            <div style={{ fontSize:13,fontWeight:700,color:t.text,marginBottom:12,fontFamily:"Syne,sans-serif",display:"flex",alignItems:"center",gap:7 }}>
              <Grid size={13} color="#818cf8"/> Format
            </div>
            {Object.entries(FORMATS).map(([id,fmt])=>(
              <button key={id} onClick={()=>setSelFormat(id)} style={{ display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 11px",borderRadius:11,marginBottom:6,border:`1px solid ${selFormat===id?"#6366f1":t.border}`,background:selFormat===id?"rgba(99,102,241,.12)":"transparent",cursor:"pointer",transition:"all .2s" }}>
                <div style={{ width:14,height:20,borderRadius:3,border:`2px solid ${fmt.color}`,flexShrink:0 }}/>
                <div style={{ textAlign:"left",flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:t.text,fontFamily:"Syne,sans-serif" }}>{fmt.label}</div>
                  <div style={{ fontSize:10,color:t.muted,fontFamily:"Space Mono,monospace" }}>{fmt.mmW}x{fmt.mmH}mm</div>
                </div>
                {selFormat===id && <Check size={12} color="#818cf8"/>}
              </button>
            ))}
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div className={t.card} style={{ borderRadius:18,padding:16 }}>
              <div style={{ fontSize:13,fontWeight:700,color:t.text,marginBottom:12,fontFamily:"Syne,sans-serif",display:"flex",alignItems:"center",gap:7 }}>
                <Sliders size={13} color="#a78bfa"/> Background
              </div>
              <div style={{ display:"flex",gap:9,flexWrap:"wrap",alignItems:"center" }}>
                {BG_PRESETS.map((bg)=>(
                  <button key={bg.id} onClick={()=>setBgColor(bg.value)} style={{ width:32,height:32,borderRadius:9,backgroundColor:bg.value,cursor:"pointer",border:bgColor===bg.value?"3px solid #6366f1":`2px solid ${t.border}`,transform:bgColor===bg.value?"scale(1.1)":"scale(1)",transition:"all .2s" }}/>
                ))}
                <input type="color" value={bgColor} onChange={(e)=>setBgColor(e.target.value)} style={{ width:32,height:32,borderRadius:9,border:`2px dashed ${t.border}`,cursor:"pointer",padding:0,background:"transparent" }}/>
              </div>
            </div>

            <div className={t.card} style={{ borderRadius:18,padding:16 }}>
              <div style={{ fontSize:13,fontWeight:700,color:t.text,marginBottom:12,fontFamily:"Syne,sans-serif",display:"flex",alignItems:"center",gap:7 }}>
                <Settings size={13} color="#fbbf24"/> Adjustments
              </div>
              {[{label:"Brightness",val:brightness,set:setBrightness},{label:"Contrast",val:contrast,set:setContrast}].map(({label,val,set})=>(
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                    <span style={{ fontSize:11,color:t.muted,fontFamily:"Syne,sans-serif" }}>{label}</span>
                    <span style={{ fontSize:10,color:"#818cf8",fontFamily:"Space Mono,monospace" }}>{val}%</span>
                  </div>
                  <input type="range" min={50} max={150} value={val} onChange={(e)=>set(+e.target.value)} style={{ width:"100%",accentColor:"#6366f1" }}/>
                </div>
              ))}
              <button onClick={()=>{ setBrightness(100); setContrast(100); }} style={{ fontSize:11,padding:"4px 11px",borderRadius:8,border:`1px solid ${t.border}`,background:"transparent",color:t.muted,fontFamily:"Syne,sans-serif",cursor:"pointer" }}>↺ Reset</button>
            </div>

            <div className={t.card} style={{ borderRadius:18,padding:16 }}>
              <div style={{ fontSize:13,fontWeight:700,color:t.text,marginBottom:10,fontFamily:"Syne,sans-serif",display:"flex",alignItems:"center",gap:7 }}>
                <Printer size={13} color="#34d399"/> Copies on A4
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <input type="range" min={1} max={24} value={copies} onChange={(e)=>setCopies(+e.target.value)} style={{ flex:1,accentColor:"#6366f1" }}/>
                <span style={{ fontSize:20,fontWeight:700,color:t.text,fontFamily:"Syne,sans-serif",minWidth:26 }}>{copies}</span>
              </div>
            </div>
          </div>
        </div>

        {uploaded && (
          <button onClick={processAll} disabled={detecting||generating} className="gbtn"
            style={{ width:"100%",color:"#fff",padding:"15px 0",borderRadius:16,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
            {detecting||generating
              ? <><span className="anim-spin"><Loader2 size={19}/></span> {detecting?"Detecting face…":"Generating…"}</>
              : <><Zap size={19}/> Generate Passport Photos</>}
          </button>
        )}
      </div>
    </div>
  );

  /* ── PREVIEW ── */
  const PreviewPage = Object.keys(photos).length===0 ? (
    <div className="page-mount" style={{ minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px 0" }}>
      <div style={{ textAlign:"center" }}>
        <ImageIcon size={52} color={t.muted} style={{ margin:"0 auto 16px" }}/>
        <h2 style={{ fontSize:24,fontWeight:700,color:t.text,marginBottom:10,fontFamily:"Syne,sans-serif" }}>No Photos Yet</h2>
        <p style={{ color:t.muted,marginBottom:22,fontSize:14 }}>Upload and process a photo first.</p>
        <button className="gbtn" onClick={()=>setPage("upload")} style={{ color:"#fff",padding:"12px 24px",borderRadius:13,fontFamily:"Syne,sans-serif",fontWeight:700,display:"inline-flex",alignItems:"center",gap:8 }}>
          <Upload size={15}/> Go to Editor
        </button>
      </div>
    </div>
  ) : (
    <div className="page-mount" style={{ minHeight:"100vh",background:t.bg,paddingTop:70 }}>
      <div style={{ ...mxw,paddingTop:24,paddingBottom:40 }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:isMobile?24:32,fontWeight:800,color:t.text,marginBottom:4,fontFamily:"Syne,sans-serif" }}>
              Your <span className="gtext">Photos</span>
            </h1>
            <p style={{ color:t.muted,fontSize:13 }}>All formats at 300 DPI — ready to print.</p>
          </div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            <button onClick={dlZip} style={{ padding:"9px 16px",borderRadius:11,border:`1px solid ${t.border}`,background:"transparent",color:t.text,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
              <Download size={13}/> ZIP All
            </button>
            <button onClick={()=>setPage("upload")} style={{ padding:"9px 16px",borderRadius:11,border:"1px solid rgba(99,102,241,.35)",background:"rgba(99,102,241,.1)",color:"#818cf8",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6 }}>
              <Camera size={13}/> Edit Again
            </button>
          </div>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:24 }}>
          {Object.entries(photos).map(([id,b64])=>{
            const fmt=FORMATS[id];
            return (
              <div key={id} className={`${t.card} photo-card`} style={{ borderRadius:16,overflow:"hidden" }}>
                <div style={{ aspectRatio:`${fmt.mmW}/${fmt.mmH}`,overflow:"hidden",position:"relative" }}>
                  <img src={b64} alt={fmt.label} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  <div className="overlay" style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.6),transparent)",display:"flex",alignItems:"flex-end",padding:8 }}>
                    <button onClick={()=>dlSingle(b64,id)} style={{ width:"100%",padding:"7px 0",borderRadius:9,background:"rgba(255,255,255,.18)",backdropFilter:"blur(8px)",color:"#fff",border:"none",cursor:"pointer",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",gap:4 }}>
                      <Download size={12}/> Save
                    </button>
                  </div>
                </div>
                <div style={{ padding:10,borderTop:`1px solid ${t.border}` }}>
                  <div style={{ fontWeight:700,fontSize:11,color:t.text,marginBottom:3,fontFamily:"Syne,sans-serif" }}>{fmt.label}</div>
                  <div style={{ fontSize:9,color:t.muted,fontFamily:"Space Mono,monospace",marginBottom:8 }}>{fmt.mmW}x{fmt.mmH}mm</div>
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>dlSingle(b64,id)} style={{ flex:1,padding:"6px 0",borderRadius:8,border:"none",background:"rgba(99,102,241,.18)",color:"#818cf8",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:3 }}><Download size={10}/> PNG</button>
                    <button onClick={()=>dlPDF(id)} style={{ flex:1,padding:"6px 0",borderRadius:8,border:"none",background:"rgba(168,85,247,.18)",color:"#c084fc",fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:3 }}><Printer size={10}/> PDF</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={t.card} style={{ borderRadius:20,padding:isMobile?"18px 14px":24 }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:isMobile?16:20,fontWeight:700,color:t.text,marginBottom:4,fontFamily:"Syne,sans-serif" }}>A4 Printable Layout</h3>
              <p style={{ fontSize:12,color:t.muted }}>{copies} copies of {FORMATS[selFormat].label} at 300 DPI</p>
            </div>
            <button onClick={()=>dlPDF(selFormat)} className="gbtn"
              style={{ color:"#fff",padding:"10px 20px",borderRadius:12,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6 }}>
              <Printer size={14}/> Print PDF
            </button>
          </div>
          <div style={{ display:"flex",gap:7,flexWrap:"wrap",marginBottom:16 }}>
            {Object.entries(FORMATS).map(([id,fmt])=>(
              <button key={id} onClick={()=>setSelFormat(id)} style={{ padding:"5px 12px",borderRadius:9,border:`1px solid ${selFormat===id?"#6366f1":t.border}`,background:selFormat===id?"rgba(99,102,241,.15)":"transparent",color:selFormat===id?"#818cf8":t.muted,fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:11,cursor:"pointer" }}>{fmt.label}</button>
            ))}
          </div>
          <div style={{ maxWidth:isMobile?160:200,margin:"0 auto",padding:7,background:"#fff",borderRadius:7,boxShadow:"0 8px 32px rgba(0,0,0,.2)" }}>
            <div style={{ position:"relative",paddingTop:"141.4%" }}>
              <div style={{ position:"absolute",inset:"5%",display:"flex",flexWrap:"wrap",gap:"2%",alignContent:"flex-start" }}>
                {Array.from({length:Math.min(copies,12)}).map((_,i)=>(
                  <div key={i} style={{ width:`${Math.floor(88/Math.ceil(Math.sqrt(Math.min(copies,12))))-1}%`,aspectRatio:`${FORMATS[selFormat].mmW}/${FORMATS[selFormat].mmH}`,overflow:"hidden",border:"1px solid #e5e7eb",borderRadius:2 }}>
                    <img src={photos[selFormat]} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── ABOUT ── */
  const AboutPage = (
    <div className="page-mount" style={{ minHeight:"100vh",background:t.bg,paddingTop:70 }}>
      <div style={{ maxWidth:760,margin:"0 auto",padding:isMobile?"24px 16px 40px":"44px 24px" }}>
        <div className={t.card} style={{ borderRadius:22,padding:isMobile?"24px 18px":"40px 36px" }}>
          <h1 style={{ fontSize:isMobile?26:36,fontWeight:800,color:t.text,marginBottom:8,fontFamily:"Syne,sans-serif" }}>
            About <span className="gtext">Photo2Passport</span>
          </h1>
          <p style={{ fontSize:isMobile?13:15,lineHeight:1.75,color:t.muted,marginBottom:14 }}>
            Photo2Passport is a modern AI-powered browser app that simplifies the creation of professional passport and identity photos. No studio, no software, no sign-up required.
          </p>
          <p style={{ fontSize:13,lineHeight:1.75,color:t.muted,marginBottom:28 }}>
            Powered by Claude AI for precise face detection and the HTML5 Canvas API for high-fidelity 300 DPI image processing.
          </p>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:28 }}>
            {[{val:"4+",label:"Formats"},{val:"300 DPI",label:"Quality"},{val:"100%",label:"Private"}].map((s,i)=>(
              <div key={i} style={{ textAlign:"center",padding:"16px 8px",borderRadius:13,background:dark?"rgba(255,255,255,.05)":"rgba(0,0,0,.04)" }}>
                <div className="gtext" style={{ fontSize:isMobile?20:26,fontWeight:800,marginBottom:4,fontFamily:"Syne,sans-serif" }}>{s.val}</div>
                <div style={{ fontSize:11,color:t.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
          <h2 style={{ fontSize:isMobile?16:20,fontWeight:700,color:t.text,marginBottom:14,fontFamily:"Syne,sans-serif" }}>Features</h2>
          <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:9,marginBottom:28 }}>
            {["Claude AI face detection & auto-crop","Passport, visa, and stamp photo formats","Custom background color picker","Brightness & contrast controls","A4 print layout (up to 20 copies)","Download PNG, PDF, or ZIP bundle","300 DPI high-resolution output","Zero server uploads — 100% private","Dark and light theme","Fully mobile responsive"].map((f,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:9,fontSize:12,color:t.muted }}>
                <Check size={13} color="#818cf8" style={{ flexShrink:0 }}/> {f}
              </div>
            ))}
          </div>
          <div style={{ padding:18,borderRadius:14,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:7 }}>
              <Shield size={15} color="#818cf8"/>
              <span style={{ fontWeight:700,fontSize:13,color:t.text,fontFamily:"Syne,sans-serif" }}>Privacy First</span>
            </div>
            <p style={{ fontSize:12,color:t.muted,lineHeight:1.65 }}>Your photos never leave your device. All processing happens in your browser. No data is stored on any server.</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── CONTACT ── */
  const ContactPage = (
    <div className="page-mount" style={{ minHeight:"100vh",background:t.bg,paddingTop:70 }}>
      <div style={{ maxWidth:520,margin:"0 auto",padding:isMobile?"24px 16px 40px":"44px 24px" }}>
        <h1 style={{ fontSize:isMobile?26:32,fontWeight:800,color:t.text,marginBottom:8,fontFamily:"Syne,sans-serif" }}>
          Get in <span className="gtext">Touch</span>
        </h1>
        <p style={{ color:t.muted,marginBottom:24,fontSize:13 }}>Questions or feedback? We'd love to hear from you.</p>
        <div className={t.card} style={{ borderRadius:20,padding:isMobile?"22px 16px":28 }}>
          {cSent ? (
            <div style={{ textAlign:"center",padding:"20px 0" }}>
              <div style={{ width:52,height:52,borderRadius:"50%",background:"rgba(52,211,153,.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px" }}>
                <Check size={26} color="#34d399"/>
              </div>
              <h3 style={{ fontSize:20,fontWeight:700,color:t.text,marginBottom:7,fontFamily:"Syne,sans-serif" }}>Message Sent!</h3>
              <p style={{ color:t.muted,marginBottom:20,fontSize:13 }}>We'll get back to you soon.</p>
              <button onClick={()=>{ setCSent(false); setCForm({name:"",email:"",msg:""}); }} className="gbtn"
                style={{ color:"#fff",padding:"10px 22px",borderRadius:12,fontFamily:"Syne,sans-serif",fontWeight:700,cursor:"pointer" }}>
                Send Another
              </button>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              {[{id:"name",label:"Full Name",type:"text",ph:"Jane Smith"},{id:"email",label:"Email",type:"email",ph:"jane@example.com"}].map(f=>(
                <div key={f.id}>
                  <label style={{ display:"block",fontSize:12,fontWeight:700,color:t.text,marginBottom:6,fontFamily:"Syne,sans-serif" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} value={cForm[f.id]} onChange={(e)=>setCForm({...cForm,[f.id]:e.target.value})}
                    style={{ ...t.input,width:"100%",padding:"11px 13px",borderRadius:12,fontFamily:"Syne,sans-serif",fontSize:13,outline:"none" }}/>
                </div>
              ))}
              <div>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:t.text,marginBottom:6,fontFamily:"Syne,sans-serif" }}>Message</label>
                <textarea rows={4} placeholder="How can we help?" value={cForm.msg} onChange={(e)=>setCForm({...cForm,msg:e.target.value})}
                  style={{ ...t.input,width:"100%",padding:"11px 13px",borderRadius:12,fontFamily:"Syne,sans-serif",fontSize:13,outline:"none",resize:"vertical" }}/>
              </div>
              <button onClick={()=>{ if(cForm.name&&cForm.email) setCSent(true); else flash("Please fill all fields.",true); }} className="gbtn"
                style={{ color:"#fff",padding:"13px 0",borderRadius:13,fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                <Mail size={16}/> Send Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"Syne,sans-serif",background:t.bg }}>
      <style>{GLOBAL_STYLE}</style>
      <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" style={{ display:"none" }} onChange={(e)=>handleFile(e.target.files[0])}/>
      {Navbar}
      {Toast}
      {page==="home"    && HomePage}
      {page==="upload"  && UploadPage}
      {page==="preview" && PreviewPage}
      {page==="about"   && AboutPage}
      {page==="contact" && ContactPage}
    </div>
  );
}
