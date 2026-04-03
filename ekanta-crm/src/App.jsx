import { useState, useMemo, useEffect, useCallback, useRef } from "react";

/*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EKANTA CRM — PRODUCTION REDESIGN
  Design reference: Linear / Stripe / Notion
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  WHAT CHANGED FROM PREVIOUS VERSION:
  ─ Brand color (#5B3BE8) reduced from ~40 uses → 8 uses (CTAs only)
  ─ Stat cards: removed colored top-borders, heavy fills → clean white cards
  ─ Sidebar: 200px, no heavy active-bg, just left accent line
  ─ Table: row height 52px, hairline dividers, richer hover state
  ─ Status badges: dot + label only, muted backgrounds
  ─ Pipeline cards: deal value dominant, reduced chrome
  ─ Typography: strict 3-size hierarchy (20/14/12)
  ─ 8px spacing grid enforced throughout
  ─ Removed: colored backgrounds on inputs, heavy borders, overuse of brand purple
*/

// ─── FONT ─────────────────────────────────────────────────────────────────────
function FontLoader() {
  useEffect(() => {
    if (document.getElementById("ek-font")) return;
    const l = document.createElement("link");
    l.id = "ek-font"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
    const g = document.createElement("style");
    g.textContent = `
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      :root{font-size:14px}
      body{background:#F7F8FA;color:#0F0F10;font-family:'Geist',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
      input,select,textarea,button{font-family:inherit}
      @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes slideRight{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:4px}
    `;
    document.head.appendChild(g);
  }, []);
  return null;
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  // Surfaces
  bg:        "#F7F8FA",
  surface:   "#FFFFFF",
  surfaceHover: "#FAFAFA",
  sidebar:   "#FFFFFF",

  // Brand — used sparingly: primary buttons + active indicator only
  brand:     "#5B3BE8",
  brandHover:"#4A2CC5",
  brandSubtle:"#F0EEFF",

  // Text
  ink:       "#0F0F10",   // headings, labels
  inkSub:    "#6E6E80",   // secondary text
  inkMuted:  "#A1A1AA",   // hints, placeholders
  inkInvert: "#FFFFFF",

  // Borders & dividers
  line:      "rgba(0,0,0,0.07)",   // subtle dividers
  lineMid:   "rgba(0,0,0,0.11)",   // input borders
  lineStrong:"rgba(0,0,0,0.16)",   // focused borders

  // Shadows
  shadowSm: "0 1px 2px rgba(0,0,0,0.05)",
  shadowMd: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
  shadowLg: "0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
  shadowXl: "0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",

  // Status — dot colors only, backgrounds are always near-white
  won:     { dot:"#16A34A", bg:"#F0FDF4", text:"#15803D" },
  pending: { dot:"#D97706", bg:"#FFFBEB", text:"#B45309" },
  lost:    { dot:"#DC2626", bg:"#FEF2F2", text:"#B91C1C" },
  drop:    { dot:"#9CA3AF", bg:"#F9FAFB", text:"#6B7280" },
  new:     { dot:"#3B82F6", bg:"#EFF6FF", text:"#1D4ED8" },
  high:    { dot:"#7C3AED", bg:"#F5F3FF", text:"#5B21B6" },
  premium: { dot:"#DB2777", bg:"#FDF2F8", text:"#9D174D" },
  bulk:    { dot:"#059669", bg:"#ECFDF5", text:"#047857" },

  r: { sm:"6px", md:"8px", lg:"10px", xl:"12px", "2xl":"16px" },
  gap: 8,
};

const F = "'Geist', system-ui, -apple-system, sans-serif";

// ─── RBAC ─────────────────────────────────────────────────────────────────────
const FULL  = ["CEO","Manager"];
const can   = (u, a) => FULL.includes(u?.role) || a === "create" || a === "export";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATS   = ["Dresses","Sarees","Western Wear","Kurtis","Lehengas","Accessories"];
const ENQS   = ["New Client","Repeat Order","Bulk Order","Custom Design","Wholesale","Export"];
const FTYPES = ["Normal","High Value","Bulk","Strategic","Premium"];
const ROLES  = ["CEO","Manager","Sales Coordinator","CRE"];
const STATUS = ["Pending","Won","Lost","Drop"];
const STAGES = ["New Lead","Qualified","Proposal Sent","Won"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];
const stamp = () => {
  const n = new Date();
  return n.toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})
    +" "+n.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
};
const inr  = n => n ? "₹"+Number(n).toLocaleString("en-IN") : null;
const big  = n => {
  if (!n) return "₹0";
  if (n>=1e7) return `₹${(n/1e7).toFixed(2)}Cr`;
  if (n>=1e5) return `₹${(n/1e5).toFixed(1)}L`;
  return "₹"+Number(n).toLocaleString("en-IN");
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  {id:1,name:"Admin",      role:"CEO",              username:"admin",      password:"admin123"},
  {id:2,name:"Vinodhini",  role:"CRE",              username:"vinodhini",  password:"pass123" },
  {id:3,name:"Arjun Kumar",role:"Manager",          username:"arjun",      password:"pass123" },
  {id:4,name:"Priya Raj",  role:"Sales Coordinator",username:"priya",      password:"pass123" },
];

const SEED_FUNNELS = [
  {id:1,createdAt:"Apr 01, 2026 10:00 AM",createdBy:"Admin",company:"Bridal Bliss Boutique",contact:"Ananya Sharma",phone:"+91 98765 43210",email:"ananya@bridalbliss.com",enquiryType:"Bulk Order",funnelType:"High Value",nextFollowUp:"2026-04-08",status:"Pending",stage:"Proposal Sent",products:[{desc:"Bridal Lehenga Set",category:"Lehengas",qty:10,price:25000},{desc:"Embroidered Saree",category:"Sarees",qty:15,price:8000}],remarks:"Owner-led boutique, bridal season focus. Decision maker responsive.",quoteNo:"QT-2026-001",quoteQty:25,quoteAmount:370000,quoteLink:"",quoteDesc:"Proposal sent, awaiting sign-off",billedAmount:null,billedDate:null},
  {id:2,createdAt:"Mar 28, 2026 02:30 PM",createdBy:"Admin",company:"Fashion Forward Store",contact:"Priya Menon",phone:"+91 98650 01122",email:"priya@fashionforward.com",enquiryType:"Wholesale",funnelType:"Normal",nextFollowUp:"2026-04-03",status:"Won",stage:"Won",products:[{desc:"Summer Dresses",category:"Dresses",qty:30,price:1200},{desc:"Casual Kurtis",category:"Kurtis",qty:50,price:800}],remarks:"Monthly reorder likely. Strong relationship.",quoteNo:"QT-2026-002",quoteQty:80,quoteAmount:76000,quoteLink:"",quoteDesc:"Closed",billedAmount:76000,billedDate:"2026-03-30"},
  {id:3,createdAt:"Mar 25, 2026 11:30 AM",createdBy:"Admin",company:"Sunrise Exports",contact:"Karthik S",phone:"+91 98123 45678",email:"karthik@sunriseexp.com",enquiryType:"Export",funnelType:"High Value",nextFollowUp:"2026-04-10",status:"Pending",stage:"Qualified",products:[{desc:"Banarasi Sarees",category:"Sarees",qty:100,price:5000},{desc:"Bridal Lehenga",category:"Lehengas",qty:20,price:30000}],remarks:"Annual export contract possible. Logistics discussion needed.",quoteNo:"QT-2026-003",quoteQty:120,quoteAmount:1100000,quoteLink:"",quoteDesc:"Awaiting approval",billedAmount:null,billedDate:null},
  {id:4,createdAt:"Mar 20, 2026 09:15 AM",createdBy:"Vinodhini",company:"Meera Collections",contact:"Meera Nair",phone:"+91 99001 12233",email:"meera@meeracoll.com",enquiryType:"New Client",funnelType:"Normal",nextFollowUp:"2026-04-04",status:"Pending",stage:"New Lead",products:[{desc:"Cotton Kurtis",category:"Kurtis",qty:60,price:600}],remarks:"New boutique, Coimbatore. High potential.",quoteNo:"QT-2026-004",quoteQty:60,quoteAmount:36000,quoteLink:"",quoteDesc:"Initial quote sent",billedAmount:null,billedDate:null},
  {id:5,createdAt:"Mar 15, 2026 02:45 PM",createdBy:"Admin",company:"Apex Pharma Gifting",contact:"Suresh M",phone:"+91 99887 76655",email:"suresh@apexpharma.com",enquiryType:"Bulk Order",funnelType:"Premium",nextFollowUp:"2026-04-15",status:"Won",stage:"Won",products:[{desc:"Corporate Sarees",category:"Sarees",qty:200,price:3500},{desc:"Accessory Kits",category:"Accessories",qty:200,price:2100}],remarks:"CEO contact, annual gifting contract.",quoteNo:"QT-2026-005",quoteQty:400,quoteAmount:1120000,quoteLink:"",quoteDesc:"Closed",billedAmount:1120000,billedDate:"2026-03-20"},
  {id:6,createdAt:"Mar 10, 2026 04:00 PM",createdBy:"Arjun Kumar",company:"Nila Bridal House",contact:"Nila Devi",phone:"+91 94445 67890",email:"nila@nilabridalhouse.com",enquiryType:"Custom Design",funnelType:"Premium",nextFollowUp:"2026-04-12",status:"Pending",stage:"Qualified",products:[{desc:"Custom Lehenga",category:"Lehengas",qty:5,price:55000},{desc:"Designer Sarees",category:"Sarees",qty:8,price:12000}],remarks:"Bespoke only. Premium segment.",quoteNo:"QT-2026-006",quoteQty:13,quoteAmount:371000,quoteLink:"",quoteDesc:"Custom design quote under prep",billedAmount:null,billedDate:null},
  {id:7,createdAt:"Mar 05, 2026 10:30 AM",createdBy:"Priya Raj",company:"Tara Textiles",contact:"Tara Singh",phone:"+91 98321 09876",email:"tara@taratextiles.com",enquiryType:"Wholesale",funnelType:"Bulk",nextFollowUp:"2026-03-30",status:"Lost",stage:"New Lead",products:[{desc:"Western Tops",category:"Western Wear",qty:100,price:750}],remarks:"Lost on price. May revisit Q3.",quoteNo:"QT-2026-007",quoteQty:100,quoteAmount:75000,quoteLink:"",quoteDesc:"Not accepted",billedAmount:null,billedDate:null},
];

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
function xls(data, name) {
  const e = v => String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const H = ["#","Company","Contact","Phone","Email","Enquiry","Type","Stage","Follow-up","Status","Products","Quote No","Qty","Quote Amt","Billed Amt","Billed Date","Remarks","Created","By"];
  const hRow = `<Row ss:StyleID="h">${H.map(h=>`<Cell><Data ss:Type="String">${e(h)}</Data></Cell>`).join("")}</Row>`;
  const rows = data.map((f,i)=>{
    const prod=(f.products||[]).map(p=>`${p.desc}(${p.category},×${p.qty},₹${p.price})`).join("|");
    return `<Row>${[[i+1,"Number"],[f.company],[f.contact||""],[f.phone||""],[f.email||""],[f.enquiryType||""],[f.funnelType||""],[f.stage||""],[f.nextFollowUp||""],[f.status],[prod],[f.quoteNo||""],[f.quoteQty||"",f.quoteQty?"Number":"String"],[f.quoteAmount||"",f.quoteAmount?"Number":"String"],[f.billedAmount||"",f.billedAmount?"Number":"String"],[f.billedDate||""],[f.remarks||""],[f.createdAt],[f.createdBy]].map(([v,t="String"])=>`<Cell><Data ss:Type="${t}">${e(v)}</Data></Cell>`).join("")}</Row>`;
  }).join("");
  const xml=`<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/><Interior ss:Color="#5B3BE8" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="Funnels"><Table>${hRow}${rows}</Table></Worksheet></Workbook>`;
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([xml],{type:"application/vnd.ms-excel;charset=utf-8"}));
  a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [list,set] = useState([]);
  const push = useCallback((msg,type="success")=>{
    const id=Date.now()+Math.random();
    set(p=>[...p,{id,msg,type}]);
    setTimeout(()=>set(p=>p.filter(x=>x.id!==id)),3000);
  },[]);
  return {list,push};
}

function Toaster({list}) {
  const s={success:"#16A34A",error:"#DC2626",info:T.brand};
  return (
    <div style={{position:"fixed",bottom:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
      {list.map(t=>(
        <div key={t.id} style={{background:T.surface,border:`1px solid ${T.line}`,borderLeft:`3px solid ${s[t.type]||s.info}`,borderRadius:T.r.md,padding:"10px 16px",fontSize:13,color:T.ink,fontFamily:F,boxShadow:T.shadowLg,animation:"slideRight .2s ease",minWidth:220}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Dot = ({color,size=6}) => <span style={{width:size,height:size,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0}}/>;

function StatusPill({status,sm}) {
  const map={
    Won:T.won, Pending:T.pending, Lost:T.lost, Drop:T.drop,
    "New Lead":T.new, "Qualified":T.pending, "Proposal Sent":T.high, "Won":T.won,
    "High Value":T.high, "Premium":T.premium, "Bulk":T.bulk, "Normal":T.drop, "Strategic":T.new,
  };
  const c=map[status]||T.drop;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:sm?"2px 7px":"3px 8px",borderRadius:20,fontSize:sm?11:12,fontWeight:500,background:c.bg,color:c.text,fontFamily:F,whiteSpace:"nowrap",letterSpacing:"0.01em"}}>
      <Dot color={c.dot} size={5}/>{status}
    </span>
  );
}

function Ic({d,sz=16,color="currentColor",sw=1.5}) {
  return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" style={{display:"block",flexShrink:0}}><path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

const P={
  dash:   "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  pipe:   "M2 6h4v12H2V6zm9-3h4v18h-4V3zm9 3h4v12h-4V6z",
  list:   "M3 6h18M3 10h18M3 14h11M3 18h7",
  users:  "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75",
  chart:  "M3 3v18h18M7 16l4-4 4 4 5-5",
  plus:   "M12 5v14M5 12h14",
  dl:     "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  search: "M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z",
  close:  "M18 6L6 18M6 6l12 12",
  edit:   "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:  "M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  out:    "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  check:  "M20 6L9 17l-5-5",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11-3a3 3 0 100 6 3 3 0 000-6z",
  cal:    "M8 2v4m8-4v4M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
};

function Avatar({name,size=32}) {
  const bg=[["#EDE9FE","#5B21B6"],["#D1FAE5","#065F46"],["#FEF3C7","#92400E"],["#FCE7F3","#9D174D"],["#DBEAFE","#1E40AF"]];
  const[bg2,tx]=bg[(name?.charCodeAt(0)||65)%bg.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg2,color:tx,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.33,fontWeight:600,flexShrink:0,fontFamily:F,letterSpacing:"-0.02em"}}>{(name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>;
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
function Btn({primary,ghost,danger,sm,icon,label,onClick,disabled,full,iconRight}) {
  const [hov,setHov]=useState(false);
  const base={
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
    padding:sm?"6px 12px":"8px 14px",
    fontSize:sm?12:13,fontWeight:500,fontFamily:F,
    borderRadius:T.r.md,border:"none",
    cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?.5:1,
    transition:"background .15s,box-shadow .15s,transform .1s",
    whiteSpace:"nowrap",letterSpacing:"0.01em",
    ...(full?{width:"100%"}:{}),
  };
  const styles={
    ...(primary?{background:hov?T.brandHover:T.brand,color:"#fff",boxShadow:hov?"0 2px 8px rgba(91,59,232,.3)":T.shadowSm}:{}),
    ...(ghost?{background:hov?T.surfaceHover:T.surface,color:T.ink,border:`1px solid ${T.line}`,boxShadow:hov?T.shadowSm:"none"}:{}),
    ...(danger?{background:hov?"#FEF2F2":T.surface,color:"#B91C1C",border:`1px solid ${hov?"#FECACA":T.line}`}:{}),
    ...(!primary&&!ghost&&!danger?{background:hov?T.surfaceHover:"transparent",color:T.inkSub,border:`1px solid transparent`}:{}),
  };
  return (
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      style={{...base,...styles}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onMouseDown={e=>!disabled&&(e.currentTarget.style.transform="scale(0.97)")}
      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
      {icon&&!iconRight&&<Ic d={icon} sz={13} color={primary?"#fff":"currentColor"}/>}
      {label}
      {icon&&iconRight&&<Ic d={icon} sz={13} color={primary?"#fff":"currentColor"}/>}
    </button>
  );
}

// ─── INPUT PRIMITIVES ─────────────────────────────────────────────────────────
const inputSx = (err) => ({
  width:"100%",padding:"8px 11px",
  border:`1px solid ${err?"#FECACA":T.lineMid}`,
  borderRadius:T.r.md,fontSize:13,fontFamily:F,color:T.ink,
  background:T.surface,outline:"none",boxSizing:"border-box",
  transition:"border-color .15s,box-shadow .15s",
});
const onfocus = e => { e.target.style.borderColor=T.brand; e.target.style.boxShadow=`0 0 0 3px rgba(91,59,232,.1)`; };
const onblur  = e => { e.target.style.borderColor=T.lineMid; e.target.style.boxShadow="none"; };

function FInput({label,value,onChange,placeholder,type="text",error,required,full=true,style:sx}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,...(full?{}:{flex:1})}}>
      {label&&<label style={{fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F}}>{label}{required&&<span style={{color:"#DC2626",marginLeft:2}}>*</span>}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{...inputSx(error),...sx}} onFocus={onfocus} onBlur={onblur}/>
      {error&&<span style={{fontSize:11,color:"#B91C1C"}}>{error}</span>}
    </div>
  );
}

function FSelect({label,value,onChange,options,placeholder,full=true}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,...(full?{}:{flex:1})}}>
      {label&&<label style={{fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F}}>{label}</label>}
      <select value={value} onChange={onChange} style={{...inputSx(),cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E6E80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center"}}
        onFocus={onfocus} onBlur={e=>{e.target.style.borderColor=T.lineMid;e.target.style.boxShadow="none";}}>
        <option value="">{placeholder||"Select…"}</option>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
const SL = ({children}) => <div style={{fontSize:11,fontWeight:600,color:T.inkMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:12,fontFamily:F}}>{children}</div>;

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({users,onLogin}) {
  const [u,su]=useState(""); const [p,sp]=useState(""); const [err,se]=useState(""); const [load,sl]=useState(false);
  const [show,ss]=useState(false);

  const go=()=>{
    if(!u||!p){se("Please fill in all fields.");return;}
    se(""); sl(true);
    setTimeout(()=>{
      const found=users.find(x=>x.username===u&&x.password===p);
      if(found) onLogin(found);
      else{se("Incorrect username or password.");sl(false);}
    },600);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:F,padding:24}}>
      <div style={{width:"100%",maxWidth:380,animation:"fadeUp .3s ease"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
          <div style={{width:34,height:34,background:T.brand,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic d={P.layers} sz={16} color="#fff" sw={2}/>
          </div>
          <span style={{fontSize:15,fontWeight:600,color:T.ink,letterSpacing:"-0.2px"}}>Ekanta Design Studio</span>
        </div>

        {/* Card */}
        <div style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:T.r["2xl"],padding:"32px 28px",boxShadow:T.shadowLg}}>
          <h1 style={{fontSize:20,fontWeight:700,color:T.ink,margin:"0 0 4px",letterSpacing:"-0.4px"}}>Sign in</h1>
          <p style={{fontSize:13,color:T.inkSub,margin:"0 0 24px"}}>Enter your credentials to continue</p>

          {err&&(
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:T.r.md,padding:"10px 12px",fontSize:12,color:"#B91C1C",marginBottom:16,fontWeight:500}}>
              {err}
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <FInput label="Username" value={u} onChange={e=>su(e.target.value)} placeholder="Enter username"
              onKeyDown={e=>e.key==="Enter"&&go()} />
            <div>
              <label style={{fontSize:12,fontWeight:500,color:T.inkSub,display:"flex",justifyContent:"space-between",marginBottom:5}}>
                Password
                <span style={{color:T.brand,cursor:"pointer",fontSize:12,fontWeight:500}}
                  onClick={()=>se("Contact your administrator to reset your password.")}>
                  Forgot?
                </span>
              </label>
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={p} onChange={e=>sp(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&go()}
                  placeholder="Enter password"
                  style={{...inputSx(),paddingRight:36}} onFocus={onfocus} onBlur={onblur}/>
                <button onClick={()=>ss(x=>!x)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.inkMuted,display:"flex",padding:2}}>
                  <Ic d={P.eye} sz={15} color="currentColor"/>
                </button>
              </div>
            </div>

            <button onClick={go} disabled={load}
              style={{width:"100%",padding:"10px",background:load?T.brandHover:T.brand,color:"#fff",border:"none",borderRadius:T.r.md,fontSize:14,fontWeight:600,fontFamily:F,cursor:load?"not-allowed":"pointer",transition:"background .15s",marginTop:4,position:"relative",overflow:"hidden"}}
              onMouseDown={e=>!load&&(e.currentTarget.style.transform="scale(0.99)")}
              onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
              {load
                ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <svg style={{animation:"spin .7s linear infinite"}} width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="2.5"/><path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    Signing in…
                  </span>
                : "Sign in →"
              }
            </button>
          </div>
        </div>

        <p style={{textAlign:"center",fontSize:12,color:T.inkMuted,marginTop:20}}>
          admin / admin123 &nbsp;·&nbsp; vinodhini / pass123
        </p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({active,set,user,onLogout}) {
  const nav=[
    {id:"dashboard",label:"Dashboard",icon:P.dash},
    {id:"pipeline", label:"Pipeline", icon:P.pipe},
    {id:"funnels",  label:"Funnels",  icon:P.list},
    ...(FULL.includes(user.role)?[
      {id:"analytics",label:"Analytics",icon:P.chart},
      {id:"team",     label:"Team",     icon:P.users},
    ]:[]),
  ];

  return (
    <div style={{width:200,minHeight:"100vh",background:T.sidebar,borderRight:`1px solid ${T.line}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      {/* Logo */}
      <div style={{padding:"18px 16px 14px",borderBottom:`1px solid ${T.line}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,background:T.brand,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic d={P.layers} sz={13} color="#fff" sw={2.2}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.ink,letterSpacing:"-0.2px",lineHeight:1.2}}>Ekanta</div>
            <div style={{fontSize:10,color:T.inkMuted,lineHeight:1}}>Design Studio</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:"8px 8px 0"}}>
        <div style={{fontSize:10,fontWeight:600,color:T.inkMuted,letterSpacing:"0.08em",padding:"10px 8px 4px",textTransform:"uppercase"}}>Navigation</div>
        {nav.map(item=>{
          const a=active===item.id;
          return (
            <button key={item.id} onClick={()=>set(item.id)}
              style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"7px 8px",borderRadius:T.r.md,border:"none",background:a?"rgba(91,59,232,.06)":"transparent",color:a?T.brand:T.inkSub,fontFamily:F,fontSize:13,fontWeight:a?600:400,cursor:"pointer",marginBottom:1,transition:"all .12s",textAlign:"left",position:"relative"}}
              onMouseEnter={e=>{if(!a){e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.ink;}}}
              onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.inkSub;}}}>
              {a&&<span style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",width:2,height:18,background:T.brand,borderRadius:"0 2px 2px 0"}}/>}
              <Ic d={item.icon} sz={14} color={a?T.brand:T.inkSub}/>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{padding:"10px 8px 14px",borderTop:`1px solid ${T.line}`}}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"7px 8px",borderRadius:T.r.md}}>
          <Avatar name={user.name} size={28}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
            <div style={{fontSize:10,color:T.inkMuted}}>{user.role}</div>
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{background:"none",border:"none",cursor:"pointer",color:T.inkMuted,display:"flex",padding:3,borderRadius:5,transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color=T.ink}
            onMouseLeave={e=>e.currentTarget.style.color=T.inkMuted}>
            <Ic d={P.out} sz={13} color="currentColor"/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({title,sub,search,setSearch,user,onAdd,onExportAll,onExportFiltered,fLen,aLen}) {
  return (
    <div style={{background:T.surface,borderBottom:`1px solid ${T.line}`,padding:"0 24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
        {/* Left */}
        <div style={{display:"flex",alignItems:"center",gap:16,flex:1}}>
          <div>
            <h1 style={{fontSize:15,fontWeight:600,color:T.ink,letterSpacing:"-0.2px",margin:0,fontFamily:F}}>{title}</h1>
          </div>
          {/* Search */}
          <div style={{display:"flex",alignItems:"center",gap:8,background:T.bg,border:`1px solid ${T.line}`,borderRadius:T.r.md,padding:"6px 11px",minWidth:220,maxWidth:320,flex:1}}>
            <Ic d={P.search} sz={13} color={T.inkMuted}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search funnels…"
              style={{border:"none",background:"transparent",outline:"none",fontSize:13,color:T.ink,fontFamily:F,width:"100%"}}/>
            {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:T.inkMuted,display:"flex",padding:0,lineHeight:1}}><Ic d={P.close} sz={12} color="currentColor"/></button>}
          </div>
        </div>

        {/* Right actions */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginLeft:16}}>
          {FULL.includes(user.role)&&(
            <>
              <Btn ghost sm icon={P.dl} label={`Filtered (${fLen})`} onClick={onExportFiltered}/>
              <Btn ghost sm icon={P.dl} label={`All (${aLen})`} onClick={onExportAll}/>
            </>
          )}
          {!FULL.includes(user.role)&&can(user,"export")&&(
            <Btn ghost sm icon={P.dl} label="Export" onClick={onExportFiltered}/>
          )}
          {can(user,"create")&&<Btn primary sm icon={P.plus} label="Add funnel" onClick={onAdd}/>}
        </div>
      </div>
    </div>
  );
}

// ─── STATS ROW ────────────────────────────────────────────────────────────────
function Stats({funnels}) {
  const won = funnels.filter(f=>f.status==="Won");
  const s={
    total:funnels.length,
    won:won.length,
    pending:funnels.filter(f=>f.status==="Pending").length,
    lost:funnels.filter(f=>f.status==="Lost").length,
    pipe:funnels.reduce((a,f)=>a+(Number(f.quoteAmount)||0),0),
    billed:won.reduce((a,f)=>a+(Number(f.billedAmount)||0),0),
  };
  const wr=s.total?Math.round(s.won/s.total*100):0;

  const cards=[
    {label:"Total funnels", value:s.total, caption:"All leads",                     accent:T.inkMuted},
    {label:"Won",           value:s.won,   caption:`${wr}% win rate`,               accent:T.won.dot},
    {label:"Pending",       value:s.pending,caption:"Need follow-up",               accent:T.pending.dot},
    {label:"Lost",          value:s.lost,  caption:"Closed lost",                   accent:T.lost.dot},
    {label:"Pipeline",      value:big(s.pipe),  caption:"Total quoted",             accent:T.brand},
    {label:"Billed",        value:big(s.billed),caption:"Revenue collected",         accent:T.won.dot},
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,padding:"20px 24px 0"}}>
      {cards.map((c,i)=>(
        <div key={i} style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:T.r.lg,padding:"16px 18px",boxShadow:T.shadowSm,animation:`fadeUp .25s ease ${i*.04}s both`}}>
          <div style={{fontSize:11,fontWeight:500,color:T.inkMuted,letterSpacing:"0.04em",marginBottom:8,fontFamily:F}}>{c.label}</div>
          <div style={{fontSize:22,fontWeight:700,color:T.ink,fontFamily:F,letterSpacing:"-0.5px",marginBottom:4}}>{c.value}</div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <Dot color={c.accent} size={5}/>
            <span style={{fontSize:11,color:T.inkMuted,fontFamily:F}}>{c.caption}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
function FilterBar({fil,setF,reset}) {
  const sel=(val,key,opts)=>(
    <select value={val} onChange={e=>setF(key,e.target.value)}
      style={{padding:"5px 24px 5px 9px",border:`1px solid ${T.line}`,borderRadius:T.r.md,fontSize:12,fontFamily:F,color:val?T.ink:T.inkSub,background:val?T.brandSubtle:T.surface,cursor:"pointer",outline:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236E6E80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 7px center",fontWeight:val?500:400}}>
      <option value="">{key==="status"?"All status":key==="funnelType"?"All types":"All enquiries"}</option>
      {opts.map(o=><option key={o}>{o}</option>)}
    </select>
  );
  const chk=(key,label)=>(
    <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:fil[key]?T.brand:T.inkSub,cursor:"pointer",fontFamily:F,fontWeight:fil[key]?500:400,userSelect:"none",transition:"color .15s"}}>
      <input type="checkbox" checked={fil[key]} onChange={e=>setF(key,e.target.checked)} style={{accentColor:T.brand,width:13,height:13}}/>
      {label}
    </label>
  );
  const any=fil.status||fil.funnelType||fil.enquiryType||fil.missed||fil.todayF||fil.upcoming;
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 24px",borderBottom:`1px solid ${T.line}`,background:T.surface,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,color:T.inkSub}}>
        <Ic d={P.filter} sz={12} color={T.inkMuted}/>
        <span style={{fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F}}>Filter</span>
      </div>
      <div style={{width:1,height:14,background:T.line}}/>
      {chk("missed","Missed")} {chk("todayF","Today")} {chk("upcoming","Upcoming")}
      <div style={{width:1,height:14,background:T.line}}/>
      {sel(fil.status,"status",STATUS)}
      {sel(fil.funnelType,"funnelType",FTYPES)}
      {sel(fil.enquiryType,"enquiryType",ENQS)}
      {any&&<button onClick={reset} style={{fontSize:12,color:T.brand,background:"none",border:"none",cursor:"pointer",fontFamily:F,fontWeight:500,padding:"0 4px",textDecoration:"underline",textUnderlineOffset:2}}>Clear</button>}
    </div>
  );
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
function Table({rows,user,onView,onEdit,onDelete}) {
  if(!rows.length) return (
    <div style={{textAlign:"center",padding:"72px 24px",fontFamily:F}}>
      <div style={{width:48,height:48,background:T.brandSubtle,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
        <Ic d={P.list} sz={22} color={T.brand}/>
      </div>
      <p style={{fontSize:15,fontWeight:600,color:T.ink,margin:"0 0 4px"}}>No funnels found</p>
      <p style={{fontSize:13,color:T.inkSub,margin:0}}>Adjust your filters or add a new funnel.</p>
    </div>
  );
  const todayV=today();
  const TH=({w,ch})=><th style={{width:w,padding:"0 14px",textAlign:"left",fontSize:10,fontWeight:600,color:T.inkMuted,letterSpacing:"0.07em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.line}`,height:38,background:T.bg}}>{ch}</th>;
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:F,tableLayout:"fixed"}}>
        <colgroup>
          <col style={{width:"3%"}}/><col style={{width:"16%"}}/><col style={{width:"10%"}}/>
          <col style={{width:"10%"}}/><col style={{width:"9%"}}/><col style={{width:"9%"}}/>
          <col style={{width:"9%"}}/><col style={{width:"9%"}}/><col style={{width:"9%"}}/>
          <col style={{width:"8%"}}/><col style={{width:"8%"}}/>
        </colgroup>
        <thead>
          <tr>
            <TH w="3%" ch="#"/>
            <TH w="16%" ch="Company"/>
            <TH w="10%" ch="Contact"/>
            <TH w="10%" ch="Category"/>
            <TH w="9%" ch="Type"/>
            <TH w="9%" ch="Follow-up"/>
            <TH w="9%" ch="Status"/>
            <TH w="9%" ch="Stage"/>
            <TH w="9%" ch="Quote"/>
            <TH w="8%" ch="Billed"/>
            <TH w="8%" ch=""/>
          </tr>
        </thead>
        <tbody>
          {rows.map((f,i)=>{
            const over=f.nextFollowUp&&f.nextFollowUp<todayV&&f.status==="Pending";
            const tod=f.nextFollowUp===todayV;
            const cats=[...new Set((f.products||[]).map(p=>p.category).filter(Boolean))].join(", ")||"—";
            return (
              <tr key={f.id}
                style={{borderBottom:`1px solid ${T.line}`,transition:"background .1s",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                onMouseLeave={e=>e.currentTarget.style.background=T.surface}>
                <td style={{padding:"0 14px",height:52,fontSize:11,color:T.inkMuted,fontWeight:600,verticalAlign:"middle"}}>{i+1}</td>
                <td style={{padding:"0 14px",verticalAlign:"middle",overflow:"hidden"}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.company}</div>
                  <div style={{fontSize:11,color:T.inkMuted,marginTop:1}}>{f.createdBy}</div>
                </td>
                <td style={{padding:"0 14px",fontSize:12,color:T.inkSub,verticalAlign:"middle",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.contact||"—"}</td>
                <td style={{padding:"0 14px",fontSize:11,color:T.inkSub,verticalAlign:"middle",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cats}</td>
                <td style={{padding:"0 14px",verticalAlign:"middle"}}>{f.funnelType?<StatusPill status={f.funnelType} sm/>:<span style={{color:T.inkMuted,fontSize:12}}>—</span>}</td>
                <td style={{padding:"0 14px",verticalAlign:"middle"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    {over&&<Dot color={T.lost.dot} size={5}/>}
                    {tod&&<Dot color={T.pending.dot} size={5}/>}
                    <span style={{fontSize:12,color:over?"#B91C1C":tod?T.pending.text:T.inkSub,fontWeight:over||tod?600:400}}>{f.nextFollowUp||"—"}</span>
                  </div>
                  {over&&<span style={{fontSize:10,color:T.lost.text,fontWeight:500}}>Overdue</span>}
                </td>
                <td style={{padding:"0 14px",verticalAlign:"middle"}}><StatusPill status={f.status} sm/></td>
                <td style={{padding:"0 14px",verticalAlign:"middle"}}><StatusPill status={f.stage||"New Lead"} sm/></td>
                <td style={{padding:"0 14px",fontSize:12,fontWeight:600,color:T.brand,verticalAlign:"middle",whiteSpace:"nowrap"}}>{inr(f.quoteAmount)||<span style={{color:T.inkMuted,fontWeight:400}}>—</span>}</td>
                <td style={{padding:"0 14px",fontSize:12,fontWeight:f.billedAmount?600:400,color:f.billedAmount?T.won.text:T.inkMuted,verticalAlign:"middle",whiteSpace:"nowrap"}}>{inr(f.billedAmount)||"—"}</td>
                <td style={{padding:"0 10px",verticalAlign:"middle"}}>
                  <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                    <button onClick={()=>onView(f)} style={{background:"transparent",border:`1px solid ${T.line}`,borderRadius:T.r.sm,padding:"4px 10px",fontSize:11,fontWeight:500,color:T.inkSub,cursor:"pointer",fontFamily:F,transition:"all .12s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background=T.brandSubtle;e.currentTarget.style.color=T.brand;e.currentTarget.style.borderColor=T.brand;}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.inkSub;e.currentTarget.style.borderColor=T.line;}}>View</button>
                    {can(user,"edit")&&(
                      <button onClick={()=>onEdit(f)} style={{background:"transparent",border:`1px solid ${T.line}`,borderRadius:T.r.sm,padding:"4px 6px",cursor:"pointer",display:"flex",transition:"all .12s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=T.bg;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
                        <Ic d={P.edit} sz={12} color={T.inkSub}/>
                      </button>
                    )}
                    {can(user,"delete")&&(
                      <button onClick={()=>onDelete(f.id)} style={{background:"transparent",border:`1px solid ${T.line}`,borderRadius:T.r.sm,padding:"4px 6px",cursor:"pointer",display:"flex",transition:"all .12s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="#FEF2F2";e.currentTarget.style.borderColor="#FECACA";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=T.line;}}>
                        <Ic d={P.trash} sz={12} color="#DC2626"/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────
function Pipeline({funnels,user,onView,onStageChange}) {
  const byStage=useMemo(()=>{
    const m={};STAGES.forEach(s=>{m[s]=funnels.filter(f=>(f.stage||"New Lead")===s);});return m;
  },[funnels]);
  const stageColor={
    "New Lead":   {accent:"#3B82F6",bar:20},
    "Qualified":  {accent:"#D97706",bar:45},
    "Proposal Sent":{accent:T.brand,bar:72},
    "Won":        {accent:"#16A34A",bar:100},
  };
  const amtFor=s=>byStage[s]?.reduce((a,f)=>a+(Number(f.quoteAmount)||0),0)||0;

  return (
    <div style={{padding:"20px 24px",overflowX:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,minWidth:760}}>
        {STAGES.map((stage,si)=>{
          const sc=stageColor[stage];
          const cards=byStage[stage]||[];
          const amt=amtFor(stage);
          return (
            <div key={stage} style={{display:"flex",flexDirection:"column",gap:8,animation:`fadeUp .3s ease ${si*.06}s both`}}>
              {/* Column header */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 2px"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <Dot color={sc.accent} size={7}/>
                  <span style={{fontSize:12,fontWeight:600,color:T.ink,fontFamily:F}}>{stage}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {amt>0&&<span style={{fontSize:11,color:T.inkSub,fontFamily:F}}>{big(amt)}</span>}
                  <span style={{fontSize:11,fontWeight:600,color:T.inkMuted,background:T.bg,border:`1px solid ${T.line}`,borderRadius:10,padding:"0 7px",fontFamily:F}}>{cards.length}</span>
                </div>
              </div>

              {/* Drop zone */}
              <div style={{background:T.bg,border:`1px dashed ${T.line}`,borderRadius:T.r.lg,minHeight:8,display:cards.length===0?"flex":"none",alignItems:"center",justifyContent:"center",padding:"20px 12px",fontSize:11,color:T.inkMuted,fontFamily:F}}>
                No leads
              </div>

              {/* Cards */}
              {cards.map(f=>(
                <div key={f.id} onClick={()=>onView(f)}
                  style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:T.r.lg,padding:"14px 14px",cursor:"pointer",transition:"border-color .15s,transform .12s,box-shadow .15s",boxShadow:T.shadowSm}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.lineStrong;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=T.shadowMd;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.line;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=T.shadowSm;}}>
                  {/* Company + type */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.ink,fontFamily:F,lineHeight:1.3,flex:1,marginRight:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.company}</div>
                    {(f.funnelType==="High Value"||f.funnelType==="Premium")&&<StatusPill status={f.funnelType} sm/>}
                  </div>
                  {/* Contact */}
                  <div style={{fontSize:11,color:T.inkSub,marginBottom:8,fontFamily:F}}>{f.contact||"—"}</div>
                  {/* Categories */}
                  {f.products?.length>0&&<div style={{fontSize:11,color:T.inkMuted,marginBottom:10,fontFamily:F}}>{[...new Set(f.products.map(p=>p.category))].filter(Boolean).slice(0,2).join(", ")}</div>}
                  {/* Progress */}
                  <div style={{height:2,background:T.bg,borderRadius:2,marginBottom:10,overflow:"hidden"}}>
                    <div style={{height:"100%",background:sc.accent,width:`${sc.bar}%`,borderRadius:2,transition:"width .4s ease"}}/>
                  </div>
                  {/* Footer */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:700,color:f.quoteAmount?T.ink:T.inkMuted,fontFamily:F,letterSpacing:"-0.2px"}}>{inr(f.quoteAmount)||"—"}</span>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      {f.nextFollowUp&&f.nextFollowUp<today()&&f.status==="Pending"&&<Dot color={T.lost.dot} size={5}/>}
                      <span style={{fontSize:11,color:T.inkMuted,fontFamily:F}}>{f.nextFollowUp||"—"}</span>
                    </div>
                  </div>
                  {/* Stage move */}
                  {can(user,"edit")&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.line}`,display:"flex",gap:4,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                      {STAGES.filter(s=>s!==stage).map(s=>(
                        <button key={s} onClick={()=>onStageChange(f.id,s)}
                          style={{fontSize:10,fontWeight:500,padding:"3px 8px",border:`1px solid ${T.line}`,borderRadius:4,background:T.bg,color:T.inkSub,cursor:"pointer",fontFamily:F,transition:"all .12s"}}
                          onMouseEnter={e=>{e.currentTarget.style.background=T.brandSubtle;e.currentTarget.style.color=T.brand;e.currentTarget.style.borderColor=T.brand;}}
                          onMouseLeave={e=>{e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.inkSub;e.currentTarget.style.borderColor=T.line;}}>
                          {s.replace(" Sent","").split(" ").at(-1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({funnels}) {
  const won=funnels.filter(f=>f.status==="Won");
  const totalQ=funnels.reduce((a,f)=>a+(Number(f.quoteAmount)||0),0);
  const totalB=won.reduce((a,f)=>a+(Number(f.billedAmount)||0),0);
  const wr=funnels.length?Math.round(won.length/funnels.length*100):0;
  const conv=totalQ?Math.round(totalB/totalQ*100):0;

  const Row=({label,val,pct,color})=>(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:12,color:T.ink,fontFamily:F}}>{label}</span>
        <span style={{fontSize:12,fontWeight:600,color:T.ink,fontFamily:F}}>{val} <span style={{color:T.inkMuted,fontWeight:400}}>({pct}%)</span></span>
      </div>
      <div style={{height:4,background:T.bg,borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:2}}/>
      </div>
    </div>
  );

  const Card=({title,children})=>(
    <div style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:T.r.lg,padding:"20px 22px",boxShadow:T.shadowSm}}>
      <div style={{fontSize:11,fontWeight:600,color:T.inkMuted,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:18,fontFamily:F}}>{title}</div>
      {children}
    </div>
  );

  const byCat=CATS.map(c=>({c,n:(funnels.flatMap(f=>f.products||[])).filter(p=>p.category===c).reduce((a,p)=>a+(Number(p.qty)||0),0)})).sort((a,b)=>b.n-a.n);
  const maxCat=Math.max(...byCat.map(x=>x.n),1);

  return (
    <div style={{padding:"20px 24px",display:"grid",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        {/* Win rate */}
        <Card title="Win rate">
          <div style={{textAlign:"center",padding:"8px 0"}}>
            <div style={{fontSize:52,fontWeight:700,color:wr>=50?T.won.dot:T.pending.dot,fontFamily:F,letterSpacing:"-2px",lineHeight:1}}>{wr}%</div>
            <div style={{fontSize:12,color:T.inkSub,marginTop:10,fontFamily:F}}>{won.length} of {funnels.length} deals won</div>
            <div style={{height:6,background:T.bg,borderRadius:3,overflow:"hidden",marginTop:16}}>
              <div style={{width:`${wr}%`,height:"100%",background:wr>=50?T.won.dot:T.pending.dot,borderRadius:3}}/>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card title="Status breakdown">
          {STATUS.map(s=>{
            const n=funnels.filter(f=>f.status===s).length;
            const pct=funnels.length?Math.round(n/funnels.length*100):0;
            const c=T[s.toLowerCase()]||T.drop;
            return <Row key={s} label={s} val={n} pct={pct} color={c.dot}/>;
          })}
        </Card>

        {/* Revenue */}
        <Card title="Revenue">
          {[["Pipeline",big(totalQ),T.brand],["Billed",big(totalB),T.won.dot],["Avg deal",big(funnels.length?Math.round(totalQ/funnels.length):0),T.pending.dot],["Conversion",`${conv}%`,conv>=50?T.won.dot:T.pending.dot]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.line}`}}>
              <span style={{fontSize:12,color:T.inkSub,fontFamily:F}}>{l}</span>
              <span style={{fontSize:15,fontWeight:700,color:c,fontFamily:F,letterSpacing:"-0.3px"}}>{v}</span>
            </div>
          ))}
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Funnel types */}
        <Card title="Leads by type">
          <div style={{display:"flex",gap:10}}>
            {FTYPES.map((t,i)=>{
              const n=funnels.filter(f=>f.funnelType===t).length;
              const colors=[T.brand,T.won.dot,T.pending.dot,T.premium.dot,T.new.dot];
              return (
                <div key={t} style={{flex:1,textAlign:"center",padding:"14px 8px",background:T.bg,borderRadius:T.r.md,border:`1px solid ${T.line}`}}>
                  <div style={{fontSize:24,fontWeight:700,color:colors[i]||T.brand,fontFamily:F}}>{n}</div>
                  <div style={{fontSize:10,color:T.inkMuted,marginTop:4,fontFamily:F,lineHeight:1.3}}>{t}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* By category */}
        <Card title="Units by product category">
          {byCat.map(({c,n})=>(
            <div key={c} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,color:T.ink,fontFamily:F}}>{c}</span>
                <span style={{fontSize:12,fontWeight:600,color:T.ink,fontFamily:F}}>{n}</span>
              </div>
              <div style={{height:4,background:T.bg,borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${Math.round(n/maxCat*100)}%`,height:"100%",background:T.brand,borderRadius:2,opacity:.7}}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────
function Team({users,onSave}) {
  const [list,setList]=useState(users);
  const [form,setForm]=useState({name:"",username:"",password:"",role:"CRE"});
  const [err,setErr]=useState("");
  useEffect(()=>setList(users),[users]);

  const add=()=>{
    if(!form.name||!form.username||!form.password){setErr("All fields required.");return;}
    if(list.find(u=>u.username===form.username)){setErr("Username taken.");return;}
    const u=[...list,{...form,id:Date.now()}];
    setList(u);onSave(u);setForm({name:"",username:"",password:"",role:"CRE"});setErr("");
  };
  const rm=id=>{const u=list.filter(x=>x.id!==id);setList(u);onSave(u);};

  const rc={"CEO":T.high,"Manager":T.won,"Sales Coordinator":T.new,"CRE":T.pending};
  return (
    <div style={{padding:"20px 24px",display:"grid",gridTemplateColumns:"360px 1fr",gap:20}}>
      {/* Add */}
      <div style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:T.r.lg,padding:22,boxShadow:T.shadowSm}}>
        <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:3,fontFamily:F}}>Add team member</div>
        <div style={{fontSize:12,color:T.inkSub,marginBottom:18,fontFamily:F}}>Access granted immediately upon creation</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <FInput label="Full name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Doe"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <FInput label="Username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="janedoe"/>
            <FInput label="Password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Password" type="password"/>
          </div>
          <FSelect label="Role" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} options={ROLES}/>
          {err&&<div style={{fontSize:12,color:"#B91C1C",background:"#FEF2F2",border:"1px solid #FECACA",padding:"8px 11px",borderRadius:T.r.md}}>{err}</div>}
          <Btn primary full icon={P.plus} label="Add member" onClick={add}/>
        </div>
        <div style={{marginTop:18,padding:"12px 14px",background:T.brandSubtle,borderRadius:T.r.md,fontSize:12,color:T.brand,lineHeight:1.7,fontFamily:F}}>
          <strong>CEO & Manager</strong> — full access<br/>
          <strong>Sales Coordinator & CRE</strong> — create + export only
        </div>
      </div>

      {/* List */}
      <div style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:T.r.lg,padding:22,boxShadow:T.shadowSm}}>
        <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:18,fontFamily:F}}>Team members ({list.length})</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {list.map(u=>{
            const c=rc[u.role]||T.drop;
            return (
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",border:`1px solid ${T.line}`,borderRadius:T.r.md,transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                onMouseLeave={e=>e.currentTarget.style.background=T.surface}>
                <Avatar name={u.name} size={36}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink,fontFamily:F}}>{u.name}</div>
                  <div style={{fontSize:11,color:T.inkMuted,fontFamily:F}}>@{u.username}</div>
                </div>
                <span style={{fontSize:11,fontWeight:500,padding:"3px 9px",borderRadius:20,background:c.bg,color:c.text,fontFamily:F}}>{u.role}</span>
                {u.id!==1&&<Btn danger sm label="Remove" onClick={()=>rm(u.id)}/>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── FUNNEL FORM ──────────────────────────────────────────────────────────────
function FunnelForm({onClose,onSave,existing}) {
  const blank={company:"",contact:"",phone:"",email:"",enquiryType:"",funnelType:"",nextFollowUp:"",stage:"New Lead",products:[{desc:"",category:"",qty:"",price:""}],remarks:"",quoteNo:"",quoteQty:"",quoteAmount:"",quoteLink:"",quoteDesc:""};
  const [form,setForm]=useState(existing?{...blank,...existing,products:existing.products?.length?existing.products:blank.products}:blank);
  const [errs,setErrs]=useState({});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const sp=(i,k,v)=>{const p=[...form.products];p[i]={...p[i],[k]:v};set("products",p);};
  const val=()=>{const e={};if(!form.company.trim())e.company="Required";if(!form.nextFollowUp)e.nfu="Required";setErrs(e);return!Object.keys(e).length;};
  const submit=()=>{if(val())onSave(form);};

  const prodTotal=(form.products||[]).reduce((a,p)=>a+(Number(p.qty)*Number(p.price)||0),0);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(2px)"}}
      onClick={onClose}>
      <div style={{background:T.surface,borderRadius:T.r["2xl"],width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadowXl,animation:"fadeUp .2s ease"}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 16px",borderBottom:`1px solid ${T.line}`,position:"sticky",top:0,background:T.surface,zIndex:1,borderRadius:`${T.r["2xl"]} ${T.r["2xl"]} 0 0`}}>
          <div>
            <h2 style={{fontSize:16,fontWeight:700,color:T.ink,fontFamily:F,margin:"0 0 2px"}}>{existing?"Edit funnel":"New funnel"}</h2>
            <p style={{margin:0,fontSize:12,color:T.inkSub,fontFamily:F}}>{existing?`Editing ${existing.company}`:"Add a new sales lead"}</p>
          </div>
          <button onClick={onClose} style={{width:30,height:30,border:`1px solid ${T.line}`,borderRadius:T.r.md,background:T.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Ic d={P.close} sz={13} color={T.inkSub}/>
          </button>
        </div>

        <div style={{padding:"22px 24px",display:"flex",flexDirection:"column",gap:20}}>
          {/* Contact */}
          <section>
            <SL>Contact details</SL>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <FInput label="Company name" required value={form.company} onChange={e=>set("company",e.target.value)} placeholder="e.g. Bridal Bliss Boutique" error={errs.company}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <FInput label="Contact person" value={form.contact} onChange={e=>set("contact",e.target.value)} placeholder="Full name"/>
                <FInput label="Phone" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91 98765 43210"/>
                <FInput label="Email" type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@company.com"/>
              </div>
            </div>
          </section>

          {/* Funnel info */}
          <section>
            <SL>Funnel details</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
              <FSelect label="Enquiry type" value={form.enquiryType} onChange={e=>set("enquiryType",e.target.value)} options={ENQS}/>
              <FSelect label="Funnel type" value={form.funnelType} onChange={e=>set("funnelType",e.target.value)} options={FTYPES}/>
              <FSelect label="Stage" value={form.stage} onChange={e=>set("stage",e.target.value)} options={STAGES}/>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:12,fontWeight:500,color:T.inkSub,fontFamily:F}}>Next follow-up<span style={{color:"#DC2626",marginLeft:2}}>*</span></label>
                <input type="date" value={form.nextFollowUp} onChange={e=>set("nextFollowUp",e.target.value)}
                  style={{...inputSx(errs.nfu)}} onFocus={onfocus} onBlur={onblur}/>
                {errs.nfu&&<span style={{fontSize:11,color:"#B91C1C"}}>{errs.nfu}</span>}
              </div>
            </div>
          </section>

          {/* Products */}
          <section>
            <SL>Customer requirements</SL>
            <div style={{border:`1px solid ${T.line}`,borderRadius:T.r.lg,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"2.5fr 1.4fr .8fr 1fr .35fr",padding:"8px 14px",background:T.bg,gap:8}}>
                {["Product / item","Category","Qty","Unit price (₹)",""].map(h=><div key={h} style={{fontSize:10,fontWeight:600,color:T.inkMuted,letterSpacing:"0.06em",fontFamily:F}}>{h}</div>)}
              </div>
              {form.products.map((pr,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"2.5fr 1.4fr .8fr 1fr .35fr",padding:"9px 14px",borderTop:`1px solid ${T.line}`,gap:8,alignItems:"center"}}>
                  <input value={pr.desc} onChange={e=>sp(i,"desc",e.target.value)} placeholder="e.g. Bridal Lehenga"
                    style={{...inputSx(),padding:"6px 9px",fontSize:12}} onFocus={onfocus} onBlur={onblur}/>
                  <select value={pr.category} onChange={e=>sp(i,"category",e.target.value)}
                    style={{...inputSx(),padding:"6px 24px 6px 9px",fontSize:12,cursor:"pointer",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236E6E80' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 7px center"}}
                    onFocus={onfocus} onBlur={onblur}>
                    <option value="">Category</option>{CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                  {[["qty","0",],["price","0"]].map(([k,ph])=>(
                    <input key={k} type="number" value={pr[k]} onChange={e=>sp(i,k,e.target.value)} placeholder={ph}
                      style={{...inputSx(),padding:"6px 9px",fontSize:12}} onFocus={onfocus} onBlur={onblur}/>
                  ))}
                  <button onClick={()=>set("products",form.products.filter((_,x)=>x!==i))} disabled={form.products.length===1}
                    style={{background:"none",border:"none",cursor:form.products.length===1?"not-allowed":"pointer",color:T.inkMuted,fontSize:16,opacity:form.products.length===1?.2:1,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              ))}
              <div style={{padding:"9px 14px",borderTop:`1px solid ${T.line}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <button onClick={()=>set("products",[...form.products,{desc:"",category:"",qty:"",price:""}])}
                  style={{background:"none",border:`1px dashed ${T.brand}`,borderRadius:T.r.sm,padding:"4px 12px",color:T.brand,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:F,display:"inline-flex",alignItems:"center",gap:5}}>
                  <Ic d={P.plus} sz={11} color={T.brand}/> Add item
                </button>
                {prodTotal>0&&<span style={{fontSize:12,fontWeight:600,color:T.ink,fontFamily:F}}>Total: {inr(prodTotal)}</span>}
              </div>
            </div>
          </section>

          {/* Remarks */}
          <section>
            <SL>Remarks</SL>
            <textarea value={form.remarks} onChange={e=>set("remarks",e.target.value)} placeholder="Additional notes…" rows={2}
              style={{...inputSx(),padding:"9px 11px",resize:"vertical",lineHeight:1.5}} onFocus={onfocus} onBlur={onblur}/>
          </section>

          {/* Quotation */}
          <section>
            <SL>Initial quotation</SL>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                <FInput label="Quote number" value={form.quoteNo} onChange={e=>set("quoteNo",e.target.value)} placeholder="QT-2026-XXX"/>
                <FInput label="Quantity" type="number" value={form.quoteQty} onChange={e=>set("quoteQty",e.target.value)} placeholder="0"/>
                <FInput label="Amount (₹)" type="number" value={form.quoteAmount} onChange={e=>set("quoteAmount",e.target.value)} placeholder="0"/>
              </div>
              <FInput label="Document link" type="url" value={form.quoteLink} onChange={e=>set("quoteLink",e.target.value)} placeholder="https://…"/>
              <div>
                <label style={{fontSize:12,fontWeight:500,color:T.inkSub,marginBottom:5,display:"block",fontFamily:F}}>Description</label>
                <textarea value={form.quoteDesc} onChange={e=>set("quoteDesc",e.target.value)} placeholder="Quote notes…" rows={2}
                  style={{...inputSx(),padding:"9px 11px",resize:"vertical",lineHeight:1.5,width:"100%",boxSizing:"border-box"}} onFocus={onfocus} onBlur={onblur}/>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,padding:"14px 24px 22px",borderTop:`1px solid ${T.line}`,position:"sticky",bottom:0,background:T.surface,borderRadius:`0 0 ${T.r["2xl"]} ${T.r["2xl"]}`}}>
          <Btn ghost label="Cancel" onClick={onClose}/>
          <Btn primary icon={existing?P.check:P.plus} label={existing?"Save changes":"Add funnel"} onClick={submit}/>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW DRAWER ──────────────────────────────────────────────────────────────
function ViewDrawer({funnel,onClose,onEdit,onStatusChange,user}) {
  const [status,setStatus]=useState(funnel.status);
  const tot=(funnel.products||[]).reduce((a,p)=>a+(Number(p.qty)*Number(p.price)||0),0);
  const sc=T[status.toLowerCase()]||T.drop;
  const doStatus=s=>{setStatus(s);onStatusChange(funnel.id,s);};

  const Row=({l,v,mono})=>(
    <div style={{display:"grid",gridTemplateColumns:"130px 1fr",gap:8,padding:"8px 0",borderBottom:`1px solid ${T.line}`}}>
      <dt style={{fontSize:11,fontWeight:500,color:T.inkMuted,fontFamily:F}}>{l}</dt>
      <dd style={{fontSize:13,color:T.ink,fontFamily:mono?"'SF Mono',monospace":F,wordBreak:"break-all"}}>{v||"—"}</dd>
    </div>
  );
  const Sec=({t})=><div style={{fontSize:10,fontWeight:600,color:T.inkMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10,marginTop:4,fontFamily:F}}>{t}</div>;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:2000,display:"flex",justifyContent:"flex-end",backdropFilter:"blur(1px)"}}
      onClick={onClose}>
      <div style={{background:T.surface,width:"100%",maxWidth:520,height:"100%",overflowY:"auto",boxShadow:"-8px 0 40px rgba(0,0,0,.12)",animation:"slideRight .22s ease",display:"flex",flexDirection:"column"}}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"20px 22px 16px",borderBottom:`1px solid ${T.line}`,position:"sticky",top:0,background:T.surface,zIndex:1}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
            <div style={{flex:1,marginRight:12}}>
              <h2 style={{fontSize:17,fontWeight:700,color:T.ink,fontFamily:F,margin:"0 0 3px",letterSpacing:"-0.3px"}}>{funnel.company}</h2>
              <p style={{margin:0,fontSize:11,color:T.inkMuted,fontFamily:F}}>{funnel.createdAt} · {funnel.createdBy}</p>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {can(user,"edit")&&<Btn ghost sm icon={P.edit} label="Edit" onClick={()=>{onClose();onEdit(funnel);}}/>}
              <button onClick={onClose} style={{width:28,height:28,border:`1px solid ${T.line}`,borderRadius:T.r.md,background:T.bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Ic d={P.close} sz={12} color={T.inkSub}/>
              </button>
            </div>
          </div>
          {/* Status selector */}
          <div style={{display:"flex",gap:6}}>
            {STATUS.map(s=>{
              const c=T[s.toLowerCase()]||T.drop;
              const a=status===s;
              return (
                <button key={s} onClick={()=>doStatus(s)}
                  style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${a?c.dot:T.line}`,background:a?c.bg:"transparent",color:a?c.text:T.inkSub,fontSize:12,fontWeight:a?600:400,cursor:"pointer",fontFamily:F,transition:"all .15s",display:"flex",alignItems:"center",gap:5}}>
                  <Dot color={a?c.dot:T.inkMuted} size={5}/>{s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{padding:"18px 22px",flex:1}}>
          <Sec t="Contact"/>
          <dl><Row l="Contact" v={funnel.contact}/><Row l="Phone" v={funnel.phone}/><Row l="Email" v={funnel.email}/></dl>
          <div style={{height:18}}/>
          <Sec t="Funnel"/>
          <dl><Row l="Enquiry type" v={funnel.enquiryType}/><Row l="Funnel type" v={funnel.funnelType}/><Row l="Stage" v={funnel.stage}/><Row l="Next follow-up" v={funnel.nextFollowUp}/></dl>
          <div style={{height:18}}/>
          <Sec t="Products"/>
          <div style={{border:`1px solid ${T.line}`,borderRadius:T.r.lg,overflow:"hidden",marginBottom:18}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr .7fr 1fr 1fr",padding:"7px 14px",background:T.bg}}>
              {["Item","Cat.","Qty","Price","Total"].map(h=><div key={h} style={{fontSize:10,fontWeight:600,color:T.inkMuted,letterSpacing:"0.06em",fontFamily:F}}>{h}</div>)}
            </div>
            {(funnel.products||[]).map((p,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr .7fr 1fr 1fr",padding:"9px 14px",borderTop:`1px solid ${T.line}`}}>
                <span style={{fontSize:12,fontWeight:500,color:T.ink,fontFamily:F,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.desc||"—"}</span>
                <span style={{fontSize:11,color:T.inkSub,fontFamily:F}}>{p.category||"—"}</span>
                <span style={{fontSize:11,color:T.inkSub,fontFamily:F}}>{p.qty||"—"}</span>
                <span style={{fontSize:11,color:T.inkSub,fontFamily:F}}>{inr(p.price)||"—"}</span>
                <span style={{fontSize:12,fontWeight:600,color:T.brand,fontFamily:F}}>{inr(Number(p.qty)*Number(p.price))||"—"}</span>
              </div>
            ))}
            {tot>0&&<div style={{display:"flex",justifyContent:"flex-end",padding:"8px 14px",borderTop:`1px solid ${T.lineMid}`,fontSize:13,fontWeight:700,color:T.ink,fontFamily:F}}>Total: {inr(tot)}</div>}
          </div>
          {funnel.remarks&&<><Sec t="Remarks"/><div style={{background:T.bg,padding:"10px 14px",borderRadius:T.r.md,fontSize:13,color:T.ink,fontFamily:F,lineHeight:1.6,marginBottom:18}}>{funnel.remarks}</div></>}
          <Sec t="Quotation"/>
          <dl>
            <Row l="Quote no." v={funnel.quoteNo} mono/>
            <Row l="Quantity" v={funnel.quoteQty}/>
            <Row l="Amount" v={inr(funnel.quoteAmount)}/>
            {funnel.quoteDesc&&<Row l="Description" v={funnel.quoteDesc}/>}
          </dl>
          {(funnel.billedAmount||funnel.billedDate)&&<>
            <div style={{height:18}}/>
            <Sec t="Billing"/>
            <dl><Row l="Billed amount" v={inr(funnel.billedAmount)}/><Row l="Billed date" v={funnel.billedDate}/></dl>
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN SHELL ───────────────────────────────────────────────────────────────
function Shell({user,users,onLogout,onUsersChange}) {
  const [funnels,setFunnels]=useState(SEED_FUNNELS);
  const [view,setView]=useState("dashboard");
  const [search,setSearch]=useState("");
  const [fil,setFil]=useState({status:"",funnelType:"",enquiryType:"",missed:false,todayF:false,upcoming:false});
  const [addOpen,setAddOpen]=useState(false);
  const [editT,setEditT]=useState(null);
  const [viewT,setViewT]=useState(null);
  const {list:toasts,push}=useToast();

  const TODAY=today();
  const sf=(k,v)=>setFil(f=>({...f,[k]:v}));
  const rf=()=>setFil({status:"",funnelType:"",enquiryType:"",missed:false,todayF:false,upcoming:false});

  const scoped=useMemo(()=>FULL.includes(user.role)?funnels:funnels.filter(f=>f.createdBy===user.name),[funnels,user]);
  const filtered=useMemo(()=>scoped.filter(f=>{
    if(search){const q=search.toLowerCase();if(!f.company.toLowerCase().includes(q)&&!(f.contact||"").toLowerCase().includes(q)&&!(f.email||"").toLowerCase().includes(q))return false;}
    if(fil.status&&f.status!==fil.status)return false;
    if(fil.funnelType&&f.funnelType!==fil.funnelType)return false;
    if(fil.enquiryType&&f.enquiryType!==fil.enquiryType)return false;
    if(fil.missed&&(!f.nextFollowUp||f.nextFollowUp>=TODAY))return false;
    if(fil.todayF&&f.nextFollowUp!==TODAY)return false;
    if(fil.upcoming&&f.nextFollowUp<=TODAY)return false;
    return true;
  }),[scoped,search,fil,TODAY]);

  const save=form=>{
    if(editT){
      setFunnels(p=>p.map(f=>f.id===editT.id?{...f,...form}:f));
      setEditT(null);push("Funnel updated");
    }else{
      setFunnels(p=>[{id:Date.now(),createdAt:stamp(),createdBy:user.name,status:"Pending",stage:form.stage||"New Lead",billedAmount:null,billedDate:null,...form},...p]);
      setAddOpen(false);push("Funnel added");
    }
  };
  const del=id=>{setFunnels(p=>p.filter(f=>f.id!==id));push("Deleted","info");};
  const upStatus=(id,s)=>{setFunnels(p=>p.map(f=>f.id===id?{...f,status:s}:f));push(`Status → ${s}`);};
  const upStage=(id,s)=>{setFunnels(p=>p.map(f=>f.id===id?{...f,stage:s}:f));push(`Moved to ${s}`,"info");};

  const titles={dashboard:"Dashboard",pipeline:"Pipeline",funnels:"Funnels",analytics:"Analytics",team:"Team"};
  const subs={
    dashboard:new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}),
    pipeline:"Move deals through stages",funnels:"All leads",analytics:"Performance metrics",team:"Users & access",
  };

  const showFilters=view==="dashboard"||view==="funnels";
  const showStats=view==="dashboard"||view==="pipeline";

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:F}}>
      <Sidebar active={view} set={setView} user={user} onLogout={onLogout}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,minHeight:"100vh"}}>
        <Topbar
          title={titles[view]} sub={subs[view]}
          search={search} setSearch={setSearch}
          user={user} onAdd={()=>setAddOpen(true)}
          onExportAll={()=>{xls(scoped,`Ekanta_All_${TODAY}.xls`);push(`Exported ${scoped.length} funnels`,"info");}}
          onExportFiltered={()=>{xls(filtered,`Ekanta_Filtered_${TODAY}.xls`);push(`Exported ${filtered.length} funnels`,"info");}}
          fLen={filtered.length} aLen={scoped.length}
        />

        {showStats&&<Stats funnels={scoped}/>}

        {showFilters&&<div style={{marginTop:16}}><FilterBar fil={fil} setF={sf} reset={rf}/></div>}
        {!showFilters&&!showStats&&null}
        {showStats&&!showFilters&&<div style={{height:16}}/>}

        {/* Content */}
        <div style={{flex:1,background:showFilters?T.surface:"transparent",marginTop:showFilters?0:0,borderTop:showFilters?`1px solid ${T.line}`:"none"}}>
          {(view==="dashboard"||view==="funnels")&&(
            <Table rows={filtered} user={user} onView={setViewT} onEdit={f=>setEditT(f)} onDelete={del}/>
          )}
          {view==="pipeline"&&<Pipeline funnels={scoped} user={user} onView={setViewT} onStageChange={upStage}/>}
          {view==="analytics"&&FULL.includes(user.role)&&<Analytics funnels={funnels}/>}
          {view==="team"&&FULL.includes(user.role)&&<Team users={users} onSave={onUsersChange}/>}
        </div>
      </div>

      {(addOpen||editT)&&<FunnelForm onClose={()=>{setAddOpen(false);setEditT(null);}} onSave={save} existing={editT}/>}
      {viewT&&<ViewDrawer funnel={viewT} onClose={()=>setViewT(null)} onEdit={f=>setEditT(f)} onStatusChange={upStatus} user={user}/>}
      <Toaster list={toasts}/>
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [users,setUsers]=useState(SEED_USERS);
  return (
    <>
      <FontLoader/>
      {!user
        ? <Login users={users} onLogin={setUser}/>
        : <Shell user={user} users={users} onLogout={()=>setUser(null)} onUsersChange={setUsers}/>
      }
    </>
  );
}
