import { useState, useMemo, useEffect, useCallback } from "react";

// ─── FONT LOADER ──────────────────────────────────────────────────────────────
function FontLoader() {
  useEffect(() => {
    if (document.getElementById("ekanta-fonts")) return;
    const l = document.createElement("link");
    l.id = "ekanta-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  // Brand
  brand:       "#5B3BE8",
  brand50:     "#EEEDFE",
  brand100:    "#C5C0F6",
  brand200:    "#9B92EC",
  brand700:    "#3C2396",
  brand900:    "#1E0F5C",
  // Neutrals
  pageBg:      "#F6F5FF",
  surface:     "#FFFFFF",
  sidebar:     "#FDFCFF",
  border:      "#E8E6F0",
  borderMid:   "#D0CDE8",
  text:        "#130B30",
  textSub:     "#6B6885",
  textMuted:   "#A09DC0",
  // Status
  won:     { bg:"#EAF3DE", text:"#27500A", border:"#97C459", dot:"#639922" },
  pending: { bg:"#FAEEDA", text:"#412402", border:"#EF9F27", dot:"#BA7517" },
  lost:    { bg:"#FCEBEB", text:"#791F1F", border:"#F09595", dot:"#E24B4A" },
  drop:    { bg:"#F1EFE8", text:"#444441", border:"#D3D1C7", dot:"#888780" },
};

const F = "'Plus Jakarta Sans', system-ui, sans-serif";

// ─── RBAC ─────────────────────────────────────────────────────────────────────
const FULL_ACCESS = ["CEO", "Manager"];
const can = (user, action) => {
  if (FULL_ACCESS.includes(user?.role)) return true;
  return action === "create" || action === "export";
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES    = ["Dresses","Sarees","Western Wear","Kurtis","Lehengas","Accessories"];
const ENQUIRY_TYPES = ["New Client","Repeat Order","Bulk Order","Custom Design","Wholesale","Export"];
const FUNNEL_TYPES  = ["Normal","High Value","Bulk","Strategic","Premium"];
const ROLES         = ["CEO","Manager","Sales Coordinator","CRE"];
const STATUSES      = ["Pending","Won","Lost","Drop"];
const STAGES        = ["New Lead","Qualified","Proposal Sent","Won"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().split("T")[0];
const nowStr   = () => {
  const n = new Date();
  return n.toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})
       + " " + n.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
};
const inr  = n => n ? "₹" + Number(n).toLocaleString("en-IN") : "—";
const crore = n => {
  if (!n || n === 0) return "₹0";
  if (n >= 1e7) return (n/1e7).toFixed(2) + "Cr";
  if (n >= 1e5) return (n/1e5).toFixed(2) + "L";
  return "₹" + Number(n).toLocaleString("en-IN");
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id:1, name:"Admin",      role:"CEO",               username:"admin",      password:"admin123" },
  { id:2, name:"Vinodhini",  role:"CRE",               username:"vinodhini",  password:"pass123"  },
  { id:3, name:"Arjun Kumar",role:"Manager",            username:"arjun",      password:"pass123"  },
  { id:4, name:"Priya Raj",  role:"Sales Coordinator",  username:"priya",      password:"pass123"  },
];

const SEED_FUNNELS = [
  { id:1, createdAt:"Apr 01, 2026 10:00 AM", createdBy:"Admin", company:"Bridal Bliss Boutique", contact:"Ananya Sharma", phone:"+91 98765 43210", email:"ananya@bridalbliss.com", enquiryType:"Bulk Order", funnelType:"High Value", nextFollowUp:"2026-04-08", status:"Pending", stage:"Proposal Sent", products:[{desc:"Bridal Lehenga Set",category:"Lehengas",qty:10,price:25000},{desc:"Embroidered Saree",category:"Sarees",qty:15,price:8000}], remarks:"Boutique owner, bridal collection for the 2026 wedding season. Decision maker is the owner herself.", quoteNo:"QT-2026-001", quoteQty:25, quoteAmount:370000, quoteLink:"", quoteDesc:"Bridal collection proposal sent, awaiting approval", billedAmount:null, billedDate:null },
  { id:2, createdAt:"Mar 28, 2026 02:30 PM", createdBy:"Admin", company:"Fashion Forward Store",  contact:"Priya Menon",   phone:"+91 98650 01122", email:"priya@fashionforward.com",  enquiryType:"Wholesale",   funnelType:"Normal",      nextFollowUp:"2026-04-03", status:"Won",     stage:"Won",           products:[{desc:"Summer Dresses",category:"Dresses",qty:30,price:1200},{desc:"Casual Kurtis",category:"Kurtis",qty:50,price:800}],                               remarks:"Retail store, monthly reorder expected. Very responsive client.",                                                   quoteNo:"QT-2026-002", quoteQty:80,  quoteAmount:76000,   quoteLink:"", quoteDesc:"Wholesale deal closed",              billedAmount:76000,   billedDate:"2026-03-30" },
  { id:3, createdAt:"Mar 25, 2026 11:30 AM", createdBy:"Admin", company:"Sunrise Exports",        contact:"Karthik S",     phone:"+91 98123 45678", email:"karthik@sunriseexp.com",    enquiryType:"Export",      funnelType:"High Value",  nextFollowUp:"2026-04-10", status:"Pending", stage:"Qualified",     products:[{desc:"Banarasi Sarees",category:"Sarees",qty:100,price:5000},{desc:"Bridal Lehenga",category:"Lehengas",qty:20,price:30000}],               remarks:"Export client, needs full shipping arrangements. Potential annual contract.",                                       quoteNo:"QT-2026-003", quoteQty:120, quoteAmount:1100000, quoteLink:"", quoteDesc:"Export proposal pending approval",   billedAmount:null,    billedDate:null },
  { id:4, createdAt:"Mar 20, 2026 09:15 AM", createdBy:"Vinodhini", company:"Meera Collections", contact:"Meera Nair",    phone:"+91 99001 12233", email:"meera@meeracoll.com",        enquiryType:"New Client",  funnelType:"Normal",      nextFollowUp:"2026-04-04", status:"Pending", stage:"New Lead",      products:[{desc:"Cotton Kurtis",category:"Kurtis",qty:60,price:600}],                                                                                       remarks:"New boutique in Coimbatore. Very promising lead.",                                                                   quoteNo:"QT-2026-004", quoteQty:60,  quoteAmount:36000,   quoteLink:"", quoteDesc:"Initial quote shared",               billedAmount:null,    billedDate:null },
  { id:5, createdAt:"Mar 15, 2026 02:45 PM", createdBy:"Admin", company:"Apex Pharma Gifting",   contact:"Suresh M",      phone:"+91 99887 76655", email:"suresh@apexpharma.com",     enquiryType:"Bulk Order",  funnelType:"High Value",  nextFollowUp:"2026-04-15", status:"Won",     stage:"Won",           products:[{desc:"Corporate Sarees",category:"Sarees",qty:200,price:3500},{desc:"Accessory Kits",category:"Accessories",qty:200,price:2100}],               remarks:"Corporate gifting, annual contract possible. CEO level contact.",                                                    quoteNo:"QT-2026-005", quoteQty:400, quoteAmount:1120000, quoteLink:"", quoteDesc:"Corporate gifting deal closed",      billedAmount:1120000, billedDate:"2026-03-20" },
  { id:6, createdAt:"Mar 10, 2026 04:00 PM", createdBy:"Arjun Kumar", company:"Nila Bridal House", contact:"Nila Devi",   phone:"+91 94445 67890", email:"nila@nilabridalhouse.com",  enquiryType:"Custom Design",funnelType:"Premium",     nextFollowUp:"2026-04-12", status:"Pending", stage:"Qualified",     products:[{desc:"Custom Lehenga",category:"Lehengas",qty:5,price:55000},{desc:"Designer Sarees",category:"Sarees",qty:8,price:12000}],                     remarks:"Premium client, bespoke designs only. High potential.",                                                              quoteNo:"QT-2026-006", quoteQty:13,  quoteAmount:371000,  quoteLink:"", quoteDesc:"Custom design quote under preparation", billedAmount:null,    billedDate:null },
  { id:7, createdAt:"Mar 05, 2026 10:30 AM", createdBy:"Priya Raj", company:"Tara Textiles",      contact:"Tara Singh",   phone:"+91 98321 09876", email:"tara@taratextiles.com",      enquiryType:"Wholesale",   funnelType:"Bulk",        nextFollowUp:"2026-03-30", status:"Lost",    stage:"New Lead",      products:[{desc:"Western Tops",category:"Western Wear",qty:100,price:750}],                                                                                  remarks:"Lost to a competitor offering lower prices. May revisit Q3.",                                                        quoteNo:"QT-2026-007", quoteQty:100, quoteAmount:75000,   quoteLink:"", quoteDesc:"Quote not accepted",                 billedAmount:null,    billedDate:null },
];

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
function downloadXLS(data, filename) {
  const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const headers = ["#","Company","Contact","Phone","Email","Enquiry Type","Funnel Type","Stage","Follow-up","Status","Products","Quote No","Quote Qty","Quote Amount (₹)","Billed Amount (₹)","Billed Date","Remarks","Created At","Created By"];
  const hRow = `<Row ss:StyleID="H">${headers.map(h=>`<Cell><Data ss:Type="String">${esc(h)}</Data></Cell>`).join("")}</Row>`;
  const dRows = data.map((f,i) => {
    const prod = (f.products||[]).map(p=>`${p.desc} (${p.category}, Qty:${p.qty}, ₹${p.price})`).join(" | ");
    const cells = [[i+1,"Number"],[f.company,"String"],[f.contact||"","String"],[f.phone||"","String"],[f.email||"","String"],[f.enquiryType||"","String"],[f.funnelType||"","String"],[f.stage||"","String"],[f.nextFollowUp||"","String"],[f.status,"String"],[prod,"String"],[f.quoteNo||"","String"],[f.quoteQty||"",f.quoteQty?"Number":"String"],[f.quoteAmount||"",f.quoteAmount?"Number":"String"],[f.billedAmount||"",f.billedAmount?"Number":"String"],[f.billedDate||"","String"],[f.remarks||"","String"],[f.createdAt,"String"],[f.createdBy,"String"]];
    return `<Row>${cells.map(([v,t])=>`<Cell><Data ss:Type="${t}">${esc(v)}</Data></Cell>`).join("")}</Row>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="H"><Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/><Interior ss:Color="#5B3BE8" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/></Style></Styles><Worksheet ss:Name="Ekanta Funnels"><Table ss:DefaultRowHeight="20">${hRow}${dRows}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions></Worksheet></Workbook>`;
  const blob = new Blob([xml], { type:"application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ─── TOAST HOOK ───────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

// ─── ICON ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size=16, color="currentColor", sw=1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{flexShrink:0,display:"block"}}>
    <path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const I = {
  grid:     "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
  funnel:   "M3 4h18M8 9h8M11 14h2M11 19h2",
  pipe:     "M2 6h4v12H2zm9-3h4v18h-4zM16 9h4v9h-4z",
  users:    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75",
  chart:    "M3 3v18h18M7 16l4-4 4 4 5-5",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.07-3a7 7 0 00-.14-1.38l2.26-1.74a.5.5 0 00.12-.64l-2.14-3.7a.5.5 0 00-.61-.22l-2.67 1.07a7.3 7.3 0 00-1.19-.69L14.2 2.4A.5.5 0 0013.72 2h-3.44a.5.5 0 00-.49.41l-.4 2.83a7.3 7.3 0 00-1.19.69L5.5 4.86a.5.5 0 00-.61.22L2.75 8.78a.5.5 0 00.12.64L5.13 11.2A7.06 7.06 0 005 12a7 7 0 00.13 1.38L2.87 15.1a.5.5 0 00-.12.64l2.14 3.7a.5.5 0 00.61.22l2.67-1.07c.38.26.78.48 1.19.69l.4 2.83a.5.5 0 00.48.41h3.44a.5.5 0 00.49-.41l.4-2.83a7.3 7.3 0 001.19-.69l2.67 1.07a.5.5 0 00.61-.22l2.14-3.7a.5.5 0 00-.12-.64L19.07 13z",
  plus:     "M12 5v14M5 12h14",
  dl:       "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  search:   "M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z",
  close:    "M18 6L6 18M6 6l12 12",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:    "M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  check:    "M20 6L9 17l-5-5",
  bell:     "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0",
  filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  arrow:    "M5 12h14M12 5l7 7-7 7",
  layers:   "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
};

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
function Avatar({ name, size=34 }) {
  const palettes = [
    [C.brand50,C.brand700],[C.won.bg,"#27500A"],["#E1F5EE","#085041"],
    ["#FAEEDA","#633806"],["#FBEAF0","#72243E"],["#E6F1FB","#0C447C"],
  ];
  const [bg,tx] = palettes[(name?.charCodeAt(0)||0) % palettes.length];
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, color:tx, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.34, fontWeight:700, flexShrink:0, fontFamily:F }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status, small }) {
  const map = {
    Won:     C.won,    Pending: C.pending,
    Lost:    C.lost,   Drop:    C.drop,
    "New Lead":   { bg:C.brand50, text:C.brand700,      dot:C.brand    },
    "Qualified":  { bg:C.pending.bg, text:C.pending.text, dot:C.pending.dot },
    "Proposal Sent":{ bg:"#F0EEFF", text:C.brand700,    dot:C.brand    },
    "High Value": { bg:"#FBEAF0", text:"#72243E",        dot:"#D4537E"  },
    "Premium":    { bg:"#FDF4FF", text:"#6B21A8",        dot:"#A855F7"  },
    "Bulk":       { bg:"#F0FDF4", text:"#166534",        dot:"#16A34A"  },
  };
  const sc = map[status] || { bg:C.drop.bg, text:C.drop.text, dot:C.drop.dot };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:small?"2px 8px":"3px 10px", borderRadius:20, fontSize:small?10:11, fontWeight:600, background:sc.bg, color:sc.text, fontFamily:F, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:sc.dot, flexShrink:0 }}/>
      {status}
    </span>
  );
}

function Btn({ primary, secondary, ghost, danger, sm, icon, label, onClick, disabled, full, style:sx={} }) {
  const s = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
    padding: sm ? "7px 14px" : "10px 20px",
    fontSize: sm ? 12 : 14,
    fontWeight:600, fontFamily:F, borderRadius:9, border:"none",
    cursor:disabled?"not-allowed":"pointer", opacity:disabled?.5:1,
    transition:"all .15s", whiteSpace:"nowrap",
    ...(full?{width:"100%"}:{}),
    ...(primary?{ background:C.brand, color:"#fff" }:{}),
    ...(secondary?{ background:C.pageBg, border:`1px solid ${C.border}`, color:C.text }:{}),
    ...(ghost?{ background:"transparent", border:`1px solid ${C.border}`, color:C.text }:{}),
    ...(danger?{ background:"#FCEBEB", border:"1px solid #FECACA", color:"#991B1B" }:{}),
    ...sx,
  };
  const [hovered, setHovered] = useState(false);
  const hs = hovered && !disabled ? (primary?{ background:"#4A2CC5" }:{ background:C.brand50 }) : {};
  return (
    <button onClick={disabled?undefined:onClick} style={{...s,...hs}}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      onMouseDown={e=>{ e.currentTarget.style.transform="scale(0.97)"; }}
      onMouseUp={e=>{ e.currentTarget.style.transform="scale(1)"; }}>
      {icon && <Ic d={icon} size={13} color={primary?"#fff":"currentColor"} />}
      {label}
    </button>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toaster({ toasts }) {
  const typeStyle = {
    success: { bg:"#EAF3DE", border:"#97C459", color:"#27500A" },
    error:   { bg:"#FCEBEB", border:"#F09595", color:"#791F1F" },
    info:    { bg:C.brand50,  border:C.brand100, color:C.brand700  },
  };
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => {
        const ts = typeStyle[t.type] || typeStyle.info;
        return (
          <div key={t.id} style={{ background:ts.bg, border:`1px solid ${ts.border}`, borderRadius:10, padding:"11px 16px", fontSize:13, color:ts.color, fontFamily:F, fontWeight:600, minWidth:230, boxShadow:"0 4px 16px rgba(0,0,0,.1)", animation:"slideIn .2s ease" }}>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = () => {
    if (!username || !password) { setError("Please enter your credentials."); return; }
    setError(""); setLoading(true);
    setTimeout(() => {
      const u = users.find(x => x.username === username && x.password === password);
      if (u) onLogin(u);
      else { setError("Invalid username or password."); setLoading(false); }
    }, 550);
  };

  const inp = (placeholder, value, onChange, type="text") => (
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder={placeholder}
      style={{ width:"100%", padding:"11px 14px", border:`1.5px solid ${C.border}`, borderRadius:10, fontSize:14, fontFamily:F, color:C.text, background:"#fff", outline:"none", boxSizing:"border-box", transition:"border-color .2s" }}
      onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:F, background:C.pageBg }}>
      {/* Left */}
      <div style={{ flex:"0 0 460px", background:"#fff", borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 52px" }}>
        <div style={{ marginBottom:44 }}>
          <div style={{ width:50, height:50, background:C.brand, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:22 }}>
            <Ic d={I.layers} size={22} color="#fff" sw={2} />
          </div>
          <h1 style={{ margin:"0 0 8px", fontSize:28, fontWeight:800, color:C.text, letterSpacing:"-0.6px" }}>Ekanta Design Studio</h1>
          <p style={{ margin:0, fontSize:14, color:C.textSub, lineHeight:1.5 }}>Sales Lead Coordinator — sign in to your workspace</p>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.text, marginBottom:6, letterSpacing:"0.02em" }}>Username</label>
          {inp("Enter your username", username, setUsername)}
        </div>
        <div style={{ marginBottom:22 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:700, color:C.text, marginBottom:6, letterSpacing:"0.02em" }}>Password</label>
          {inp("Enter your password", password, setPassword, "password")}
        </div>

        {error && (
          <div style={{ background:"#FCEBEB", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#991B1B", marginBottom:16, fontWeight:500 }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={loading}
          style={{ width:"100%", padding:"13px", borderRadius:10, border:"none", background:loading?C.brand200:C.brand, color:"#fff", fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:F, transition:"background .2s" }}
          onMouseDown={e=>!loading&&(e.currentTarget.style.transform="scale(0.99)")}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        <div style={{ marginTop:20, padding:"12px 14px", background:C.brand50, borderRadius:9, fontSize:12, color:C.brand700, lineHeight:1.7 }}>
          <strong>Demo credentials</strong><br/>
          admin / admin123 &nbsp;·&nbsp; vinodhini / pass123 &nbsp;·&nbsp; arjun / pass123
        </div>
      </div>

      {/* Right */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:60 }}>
        <div style={{ maxWidth:380 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.brand, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>Platform features</div>
          <h2 style={{ fontSize:26, fontWeight:800, color:C.text, margin:"0 0 32px", letterSpacing:"-0.4px", lineHeight:1.25 }}>Everything your sales team needs to close more deals</h2>
          {[
            [I.funnel, "Funnel management",   "Track every lead from first contact to billed"],
            [I.pipe,   "Visual pipeline",     "Kanban board to manage deal stages"],
            [I.chart,  "Analytics",           "Win rate, pipeline value and revenue insights"],
            [I.users,  "Role-based access",   "CEO, Manager, CRE — each sees exactly what they need"],
            [I.dl,     "Excel export",        "Download all or filtered leads with one click"],
          ].map(([ic,title,desc]) => (
            <div key={title} style={{ display:"flex", gap:14, marginBottom:22, alignItems:"flex-start" }}>
              <div style={{ width:38, height:38, background:C.brand50, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                <Ic d={ic} size={16} color={C.brand} />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:2 }}>{title}</div>
                <div style={{ fontSize:13, color:C.textSub }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, onLogout }) {
  const nav = [
    { id:"dashboard", label:"Dashboard", icon:I.grid   },
    { id:"pipeline",  label:"Pipeline",  icon:I.pipe   },
    { id:"funnels",   label:"Funnels",   icon:I.funnel },
    ...(FULL_ACCESS.includes(user.role) ? [
      { id:"analytics", label:"Analytics", icon:I.chart  },
      { id:"team",      label:"Team",      icon:I.users  },
    ] : []),
  ];
  return (
    <div style={{ width:220, minHeight:"100vh", background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"20px 18px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, background:C.brand, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic d={I.layers} size={16} color="#fff" sw={2} />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:C.text, letterSpacing:"-0.2px" }}>Ekanta</div>
            <div style={{ fontSize:10, color:C.textSub, fontWeight:500 }}>Design Studio</div>
          </div>
        </div>
      </div>

      <nav style={{ flex:1, padding:"10px 10px 0" }}>
        <div style={{ fontSize:9, fontWeight:700, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", padding:"8px 10px 4px" }}>Main</div>
        {nav.map(item => {
          const a = active === item.id;
          return (
            <button key={item.id} onClick={()=>setActive(item.id)}
              style={{ display:"flex", alignItems:"center", gap:9, width:"100%", padding:"9px 10px", borderRadius:8, border:"none", background:a?C.brand50:"transparent", color:a?C.brand:C.textSub, fontFamily:F, fontSize:13, fontWeight:a?700:500, cursor:"pointer", marginBottom:2, transition:"all .12s", textAlign:"left" }}
              onMouseEnter={e=>{ if(!a){ e.currentTarget.style.background=C.pageBg; e.currentTarget.style.color=C.text; }}}
              onMouseLeave={e=>{ if(!a){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=C.textSub; }}}>
              <Ic d={item.icon} size={15} color={a?C.brand:C.textSub} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding:"12px 10px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px" }}>
          <Avatar name={user.name} size={32} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
            <div style={{ fontSize:10, color:C.textSub }}>{user.role}</div>
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:4, borderRadius:6, display:"flex" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.textMuted}>
            <Ic d={I.logout} size={14} color="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, search, setSearch, user, funnels, filtered, onAdd, onExportAll, onExportFiltered }) {
  return (
    <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"18px 28px 0" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <h1 style={{ margin:"0 0 3px", fontSize:20, fontWeight:800, color:C.text, letterSpacing:"-0.4px", fontFamily:F }}>{title}</h1>
          <p style={{ margin:0, fontSize:13, color:C.textSub, fontFamily:F }}>{subtitle}</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
          {FULL_ACCESS.includes(user.role) && (
            <>
              <Btn ghost sm icon={I.dl} label={`Filtered (${filtered.length})`} onClick={onExportFiltered} />
              <Btn ghost sm icon={I.dl} label={`All (${funnels.length})`}       onClick={onExportAll} />
            </>
          )}
          {can(user,"export") && !FULL_ACCESS.includes(user.role) && (
            <Btn ghost sm icon={I.dl} label="Export Excel" onClick={onExportFiltered} />
          )}
          {can(user,"create") && (
            <Btn primary sm icon={I.plus} label="Add funnel" onClick={onAdd} />
          )}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:14 }}>
        <div style={{ flex:1, maxWidth:480, display:"flex", alignItems:"center", gap:8, background:C.pageBg, border:`1px solid ${C.border}`, borderRadius:9, padding:"8px 14px" }}>
          <Ic d={I.search} size={14} color={C.textMuted} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies, contacts, emails…"
            style={{ flex:1, border:"none", background:"transparent", outline:"none", fontSize:13, color:C.text, fontFamily:F }} />
          {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",color:C.textMuted,padding:0,display:"flex" }}>
            <Ic d={I.close} size={13} color="currentColor" />
          </button>}
        </div>
      </div>
    </div>
  );
}

// ─── STATS ROW ────────────────────────────────────────────────────────────────
function StatsRow({ funnels }) {
  const won     = funnels.filter(f=>f.status==="Won").length;
  const pending = funnels.filter(f=>f.status==="Pending").length;
  const lost    = funnels.filter(f=>f.status==="Lost").length;
  const high    = funnels.filter(f=>f.funnelType==="High Value"||f.funnelType==="Premium").length;
  const totalQ  = funnels.reduce((s,f)=>s+(Number(f.quoteAmount)||0),0);
  const totalB  = funnels.filter(f=>f.status==="Won").reduce((s,f)=>s+(Number(f.billedAmount)||0),0);
  const winRate = funnels.length ? Math.round(won/funnels.length*100) : 0;

  const cards = [
    { label:"Total funnels",  value:funnels.length, sub:`${high} premium`,          accent:C.brand,        bg:"#fff"           },
    { label:"Won",            value:won,            sub:`${winRate}% win rate`,      accent:C.won.dot,      bg:C.won.bg         },
    { label:"Pending",        value:pending,        sub:"needs follow-up",           accent:C.pending.dot,  bg:C.pending.bg     },
    { label:"Lost",           value:lost,           sub:"to competitors",            accent:C.lost.dot,     bg:C.lost.bg        },
    { label:"Pipeline value", value:crore(totalQ),  sub:"total quoted",              accent:C.brand,        bg:C.brand50        },
    { label:"Billed amount",  value:crore(totalB),  sub:"revenue closed",            accent:C.won.dot,      bg:C.won.bg         },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, padding:"18px 28px" }}>
      {cards.map(c => (
        <div key={c.label} style={{ background:c.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", borderTop:`3px solid ${c.accent}` }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.textSub, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:7, fontFamily:F }}>{c.label}</div>
          <div style={{ fontSize:24, fontWeight:800, color:C.text, fontFamily:F, marginBottom:3 }}>{c.value}</div>
          <div style={{ fontSize:11, color:C.textSub, fontFamily:F }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
function FilterBar({ filters, setF, reset }) {
  const sel = (val, key, opts, ph) => (
    <select value={val} onChange={e=>setF(key,e.target.value)}
      style={{ padding:"6px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, fontFamily:F, color:val?C.text:C.textSub, background:"#fff", cursor:"pointer", outline:"none" }}>
      <option value="">{ph}</option>
      {opts.map(o=><option key={o}>{o}</option>)}
    </select>
  );
  const chk = (key, label) => (
    <label key={key} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:filters[key]?C.brand:C.textSub, cursor:"pointer", fontFamily:F, fontWeight:filters[key]?700:400, userSelect:"none" }}>
      <input type="checkbox" checked={filters[key]} onChange={e=>setF(key,e.target.checked)} style={{ accentColor:C.brand, width:13, height:13 }} />
      {label}
    </label>
  );
  const hasActive = filters.status||filters.funnelType||filters.enquiryType||filters.missed||filters.today||filters.upcoming;
  return (
    <div style={{ padding:"10px 28px", background:"#fff", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <Ic d={I.filter} size={13} color={C.brand} />
        <span style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:F }}>Filters</span>
      </div>
      {chk("missed","Missed")}
      {chk("today","Today")}
      {chk("upcoming","Upcoming")}
      <div style={{ width:1, height:14, background:C.border }} />
      {sel(filters.status,   "status",   STATUSES,      "All status"      )}
      {sel(filters.funnelType, "funnelType", FUNNEL_TYPES, "All types"    )}
      {sel(filters.enquiryType,"enquiryType",ENQUIRY_TYPES,"All enquiries" )}
      {hasActive && <button onClick={reset} style={{ fontSize:12, color:C.brand, background:"none", border:"none", cursor:"pointer", fontFamily:F, fontWeight:700, textDecoration:"underline" }}>Reset</button>}
    </div>
  );
}

// ─── FUNNELS TABLE ────────────────────────────────────────────────────────────
function FunnelsTable({ funnels, user, onView, onEdit, onDelete, today }) {
  if (!funnels.length) return (
    <div style={{ textAlign:"center", padding:"72px 20px", fontFamily:F }}>
      <div style={{ width:60, height:60, background:C.brand50, borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px" }}>
        <Ic d={I.funnel} size={26} color={C.brand} />
      </div>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:6 }}>No funnels found</div>
      <div style={{ fontSize:13, color:C.textSub }}>Adjust your filters or add a new funnel to get started.</div>
    </div>
  );
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:F, tableLayout:"fixed" }}>
        <colgroup>
          <col style={{ width:"3%" }}/><col style={{ width:"17%" }}/><col style={{ width:"10%" }}/>
          <col style={{ width:"10%" }}/><col style={{ width:"9%" }}/><col style={{ width:"9%" }}/>
          <col style={{ width:"8%" }}/><col style={{ width:"9%" }}/><col style={{ width:"9%" }}/>
          <col style={{ width:"9%" }}/><col style={{ width:"7%" }}/>
        </colgroup>
        <thead>
          <tr style={{ background:C.pageBg, borderBottom:`1px solid ${C.border}` }}>
            {["#","Company","Contact","Category","Type","Follow-up","Status","Stage","Quote","Billed",""].map(h=>(
              <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:9, fontWeight:800, color:C.textSub, letterSpacing:"0.08em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {funnels.map((f,idx) => {
            const over  = f.nextFollowUp && f.nextFollowUp < today && f.status==="Pending";
            const tod   = f.nextFollowUp === today;
            const cats  = [...new Set((f.products||[]).map(p=>p.category).filter(Boolean))].join(", ") || "—";
            return (
              <tr key={f.id} style={{ borderBottom:`1px solid ${C.border}`, transition:"background .1s", cursor:"default" }}
                onMouseEnter={e=>e.currentTarget.style.background=C.pageBg}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <td style={{ padding:"12px 12px", fontSize:11, color:C.textMuted, fontWeight:700 }}>{idx+1}</td>
                <td style={{ padding:"12px 12px", overflow:"hidden" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.company}</div>
                  <div style={{ fontSize:10, color:C.textSub }}>{f.createdBy}</div>
                </td>
                <td style={{ padding:"12px 12px", fontSize:12, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.contact||"—"}</td>
                <td style={{ padding:"12px 12px", fontSize:11, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cats}</td>
                <td style={{ padding:"12px 12px" }}>
                  {f.funnelType ? <StatusBadge status={f.funnelType} small /> : <span style={{ color:C.textMuted, fontSize:12 }}>—</span>}
                </td>
                <td style={{ padding:"12px 12px" }}>
                  <div style={{ fontSize:12, color:over?"#991B1B":tod?C.pending.text:C.text, fontWeight:over||tod?700:400, whiteSpace:"nowrap" }}>
                    {f.nextFollowUp||"—"}
                  </div>
                  {over && <span style={{ fontSize:9, background:C.lost.bg, color:C.lost.text, padding:"1px 5px", borderRadius:3, fontWeight:700 }}>OVERDUE</span>}
                  {tod  && <span style={{ fontSize:9, background:C.pending.bg, color:C.pending.text, padding:"1px 5px", borderRadius:3, fontWeight:700 }}>TODAY</span>}
                </td>
                <td style={{ padding:"12px 12px" }}><StatusBadge status={f.status} small /></td>
                <td style={{ padding:"12px 12px" }}><StatusBadge status={f.stage||"New Lead"} small /></td>
                <td style={{ padding:"12px 12px", fontSize:12, fontWeight:700, color:C.brand, whiteSpace:"nowrap" }}>
                  {f.quoteAmount ? inr(f.quoteAmount) : <span style={{ color:C.textMuted, fontWeight:400 }}>—</span>}
                </td>
                <td style={{ padding:"12px 12px", fontSize:12, fontWeight:f.billedAmount?700:400, color:f.billedAmount?C.won.text:C.textMuted, whiteSpace:"nowrap" }}>
                  {f.billedAmount ? inr(f.billedAmount) : "—"}
                </td>
                <td style={{ padding:"12px 12px" }}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>onView(f)} style={{ background:C.brand50, border:"none", borderRadius:6, padding:"5px 10px", fontSize:11, fontWeight:700, color:C.brand, cursor:"pointer", fontFamily:F }}>View</button>
                    {can(user,"edit") && (
                      <button onClick={()=>onEdit(f)} style={{ background:C.pageBg, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 7px", cursor:"pointer", display:"flex" }}>
                        <Ic d={I.edit} size={12} color={C.textSub} />
                      </button>
                    )}
                    {can(user,"delete") && (
                      <button onClick={()=>onDelete(f.id)} style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:6, padding:"5px 7px", cursor:"pointer", display:"flex" }}>
                        <Ic d={I.trash} size={12} color="#991B1B" />
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

// ─── PIPELINE KANBAN ──────────────────────────────────────────────────────────
function PipelineBoard({ funnels, user, onView, onEdit, onStageChange }) {
  const stageColors = {
    "New Lead":     { dot:"#378ADD", track:C.brand50   },
    "Qualified":    { dot:C.pending.dot, track:C.pending.bg },
    "Proposal Sent":{ dot:C.brand,   track:"#F0EEFF"   },
    "Won":          { dot:C.won.dot, track:C.won.bg    },
  };
  const byStage = useMemo(() => {
    const m = {};
    STAGES.forEach(s => { m[s] = funnels.filter(f => (f.stage||"New Lead")===s); });
    return m;
  }, [funnels]);

  const progress = { "New Lead":12, "Qualified":40, "Proposal Sent":72, "Won":100 };

  return (
    <div style={{ padding:"20px 28px", overflowX:"auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, minWidth:780 }}>
        {STAGES.map(stage => {
          const cards = byStage[stage]||[];
          const sc    = stageColors[stage];
          const stageAmt = cards.reduce((s,f)=>s+(Number(f.quoteAmount)||0),0);
          return (
            <div key={stage} style={{ background:C.pageBg, borderRadius:12, border:`1px solid ${C.border}`, padding:12 }}>
              {/* Column header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:sc.dot, display:"block" }}/>
                  <span style={{ fontSize:12, fontWeight:800, color:C.text, fontFamily:F }}>{stage}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {stageAmt>0 && <span style={{ fontSize:10, fontWeight:700, color:C.brand, fontFamily:F }}>{crore(stageAmt)}</span>}
                  <span style={{ background:C.brand50, color:C.brand, fontSize:11, fontWeight:700, padding:"1px 8px", borderRadius:10, fontFamily:F }}>{cards.length}</span>
                </div>
              </div>

              {/* Empty drop zone */}
              {cards.length===0 && (
                <div style={{ border:`1.5px dashed ${C.border}`, borderRadius:8, padding:"24px 10px", textAlign:"center", fontSize:11, color:C.textMuted, fontFamily:F }}>
                  No leads in this stage
                </div>
              )}

              {/* Deal cards */}
              {cards.map(f => (
                <div key={f.id} onClick={()=>onView(f)}
                  style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 12px", marginBottom:9, cursor:"pointer", transition:"border-color .15s, transform .12s" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.brand; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="translateY(0)"; }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, fontFamily:F, lineHeight:1.3, flex:1, marginRight:6 }}>{f.company}</div>
                    {(f.funnelType==="High Value"||f.funnelType==="Premium") && <StatusBadge status={f.funnelType} small />}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:5, fontFamily:F }}>{f.contact||"—"}</div>
                  {f.products?.length>0 && (
                    <div style={{ fontSize:10, color:C.textMuted, marginBottom:8, fontFamily:F }}>
                      {[...new Set(f.products.map(p=>p.category))].filter(Boolean).slice(0,2).join(" · ")}
                    </div>
                  )}
                  {/* Progress bar */}
                  <div style={{ height:3, background:C.border, borderRadius:2, marginBottom:9, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:sc.dot, width:`${progress[stage]}%`, borderRadius:2 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:800, color:C.brand, fontFamily:F }}>{f.quoteAmount?inr(f.quoteAmount):"—"}</span>
                    <span style={{ fontSize:10, color:f.nextFollowUp&&f.nextFollowUp<todayISO()&&f.status==="Pending"?"#991B1B":C.textMuted, fontFamily:F }}>{f.nextFollowUp||"—"}</span>
                  </div>
                  {/* Quick stage move */}
                  {can(user,"edit") && (
                    <div style={{ marginTop:8, display:"flex", gap:4, flexWrap:"wrap" }} onClick={e=>e.stopPropagation()}>
                      {STAGES.filter(s=>s!==stage).map(s=>(
                        <button key={s} onClick={()=>onStageChange(f.id,s)}
                          style={{ fontSize:9, fontWeight:600, padding:"2px 7px", border:`1px solid ${C.border}`, borderRadius:4, background:C.pageBg, color:C.textSub, cursor:"pointer", fontFamily:F }}>
                          → {s.replace(" Sent","").split(" ")[0]}
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
function AnalyticsView({ funnels }) {
  const won    = funnels.filter(f=>f.status==="Won");
  const winRate= funnels.length?Math.round(won.length/funnels.length*100):0;
  const totalQ = funnels.reduce((s,f)=>s+(Number(f.quoteAmount)||0),0);
  const totalB = won.reduce((s,f)=>s+(Number(f.billedAmount)||0),0);
  const convPct= totalQ?Math.round(totalB/totalQ*100):0;

  const byStatus = STATUSES.map(s=>({ s, n:funnels.filter(f=>f.status===s).length }));
  const byType   = FUNNEL_TYPES.map(t=>({ t, n:funnels.filter(f=>f.funnelType===t).length }));
  const byCat    = CATEGORIES.map(c=>({ c, n:(funnels.flatMap(f=>f.products||[])).filter(p=>p.category===c).length }));

  const typeAccents = [C.brand, C.won.dot, C.pending.dot, "#D4537E", "#A855F7"];

  return (
    <div style={{ padding:"20px 28px", fontFamily:F }}>
      {/* Top row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:18, marginBottom:18 }}>
        {/* Win rate */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22 }}>
          <div style={{ fontSize:10, fontWeight:800, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:18 }}>Win rate</div>
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:56, fontWeight:800, color:winRate>=50?C.won.dot:C.pending.dot, lineHeight:1 }}>{winRate}%</div>
            <div style={{ fontSize:13, color:C.textSub, marginTop:8 }}>{won.length} of {funnels.length} deals closed</div>
          </div>
          <div style={{ height:8, background:C.border, borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", background:winRate>=50?C.won.dot:C.pending.dot, width:`${winRate}%`, borderRadius:4, transition:"width 1s ease" }} />
          </div>
        </div>
        {/* Status breakdown */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22 }}>
          <div style={{ fontSize:10, fontWeight:800, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:18 }}>Status breakdown</div>
          {byStatus.map(({s,n}) => {
            const sc = C[s.toLowerCase()]||C.drop;
            const pct = funnels.length?Math.round(n/funnels.length*100):0;
            return (
              <div key={s} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:12, color:C.text, fontWeight:500 }}>{s}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{n} <span style={{ color:C.textMuted, fontWeight:400 }}>({pct}%)</span></span>
                </div>
                <div style={{ height:5, background:C.border, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:sc.dot, borderRadius:3 }} />
                </div>
              </div>
            );
          })}
        </div>
        {/* Revenue */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22 }}>
          <div style={{ fontSize:10, fontWeight:800, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:18 }}>Revenue summary</div>
          {[["Pipeline total", crore(totalQ), C.brand], ["Billed amount", crore(totalB), C.won.dot], ["Avg deal size", crore(funnels.length?Math.round(totalQ/funnels.length):0), C.pending.dot], ["Conversion", `${convPct}%`, convPct>=50?C.won.dot:C.pending.dot]].map(([l,v,c],i,a)=>(
            <div key={l} style={{ paddingBottom:14, marginBottom:i<a.length-1?14:0, borderBottom:i<a.length-1?`1px solid ${C.border}`:"none" }}>
              <div style={{ fontSize:11, color:C.textSub, marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Bottom row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        {/* By type */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22 }}>
          <div style={{ fontSize:10, fontWeight:800, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Leads by funnel type</div>
          <div style={{ display:"flex", gap:10 }}>
            {byType.map(({t,n},i)=>(
              <div key={t} style={{ flex:1, background:C.pageBg, borderRadius:10, padding:"14px 10px", textAlign:"center", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:26, fontWeight:800, color:typeAccents[i]||C.brand }}>{n}</div>
                <div style={{ fontSize:10, color:C.textSub, marginTop:4, lineHeight:1.3 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
        {/* By category */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22 }}>
          <div style={{ fontSize:10, fontWeight:800, color:C.textSub, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:16 }}>Products ordered by category</div>
          {byCat.sort((a,b)=>b.n-a.n).map(({c,n})=>{
            const max = Math.max(...byCat.map(x=>x.n),1);
            const pct = Math.round(n/max*100);
            return (
              <div key={c} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:12, color:C.text, fontWeight:500 }}>{c}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{n}</span>
                </div>
                <div style={{ height:5, background:C.border, borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:C.brand, borderRadius:3, opacity:0.7+pct/300 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TEAM PANEL ───────────────────────────────────────────────────────────────
function TeamPanel({ users, onSave }) {
  const [list, setList]     = useState(users);
  const [form, setForm]     = useState({ name:"", username:"", password:"", role:"CRE" });
  const [err, setErr]       = useState("");
  useEffect(()=>setList(users),[users]);

  const addUser = () => {
    if (!form.name||!form.username||!form.password) { setErr("All fields are required."); return; }
    if (list.find(u=>u.username===form.username))   { setErr("Username already taken."); return; }
    const updated = [...list, { ...form, id:Date.now() }];
    setList(updated); onSave(updated);
    setForm({ name:"", username:"", password:"", role:"CRE" }); setErr("");
  };

  const removeUser = id => { const u = list.filter(x=>x.id!==id); setList(u); onSave(u); };

  const roleColors = { CEO:["#EEEDFE","#3C2396"], Manager:["#E1F5EE","#085041"], "Sales Coordinator":["#E6F1FB","#0C447C"], CRE:["#FAEEDA","#633806"] };

  const inp = (ph, val, key, type="text") => (
    <input type={type} value={val} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}
      style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, color:C.text, background:"#fff", outline:"none", boxSizing:"border-box" }}
      onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
  );

  return (
    <div style={{ padding:"20px 28px", fontFamily:F }}>
      <div style={{ display:"grid", gridTemplateColumns:"380px 1fr", gap:22 }}>
        {/* Add */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22 }}>
          <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:4 }}>Add team member</div>
          <div style={{ fontSize:12, color:C.textSub, marginBottom:18 }}>New users can log in immediately</div>
          <div style={{ display:"grid", gap:10 }}>
            {inp("Full name", form.name, "name")}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {inp("Username", form.username, "username")}
              {inp("Password", form.password, "password", "password")}
            </div>
            <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
              style={{ padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, color:C.text, background:"#fff", cursor:"pointer", outline:"none" }}>
              {ROLES.map(r=><option key={r}>{r}</option>)}
            </select>
            {err && <div style={{ fontSize:12, color:"#991B1B", background:"#FEF2F2", border:"1px solid #FECACA", padding:"8px 12px", borderRadius:7 }}>{err}</div>}
            <Btn primary full icon={I.plus} label="Add member" onClick={addUser} />
          </div>
          <div style={{ marginTop:18, padding:"12px 14px", background:C.brand50, borderRadius:8, fontSize:12, color:C.brand700, lineHeight:1.6 }}>
            <strong>Access levels:</strong><br/>
            CEO & Manager — full access<br/>
            Sales Coordinator & CRE — create + export only
          </div>
        </div>
        {/* List */}
        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:14, padding:22 }}>
          <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:18 }}>Team members ({list.length})</div>
          <div style={{ display:"grid", gap:9 }}>
            {list.map(u => {
              const [rbg,rtx] = roleColors[u.role]||["#F1EFE8","#444441"];
              return (
                <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", border:`1px solid ${C.border}`, borderRadius:10 }}>
                  <Avatar name={u.name} size={40} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{u.name}</div>
                    <div style={{ fontSize:11, color:C.textSub }}>@{u.username}</div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:rbg, color:rtx }}>{u.role}</span>
                  {u.id!==1 && (
                    <button onClick={()=>removeUser(u.id)} style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"6px 12px", fontSize:11, fontWeight:700, color:"#991B1B", cursor:"pointer", fontFamily:F }}>Remove</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FUNNEL FORM MODAL ────────────────────────────────────────────────────────
function FunnelModal({ onClose, onSave, existing }) {
  const blank = { company:"",contact:"",phone:"",email:"",enquiryType:"",funnelType:"",nextFollowUp:"",stage:"New Lead",products:[{desc:"",category:"",qty:"",price:""}],remarks:"",quoteNo:"",quoteQty:"",quoteAmount:"",quoteLink:"",quoteDesc:"" };
  const [form, setForm] = useState(existing ? { ...blank, company:existing.company, contact:existing.contact||"", phone:existing.phone||"", email:existing.email||"", enquiryType:existing.enquiryType||"", funnelType:existing.funnelType||"", nextFollowUp:existing.nextFollowUp||"", stage:existing.stage||"New Lead", products:existing.products?.length?existing.products:blank.products, remarks:existing.remarks||"", quoteNo:existing.quoteNo||"", quoteQty:existing.quoteQty||"", quoteAmount:existing.quoteAmount||"", quoteLink:existing.quoteLink||"", quoteDesc:existing.quoteDesc||"" } : blank);
  const [errs, setErrs] = useState({});

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const sp  = (i,k,v) => { const p=[...form.products]; p[i]={...p[i],[k]:v}; set("products",p); };
  const validate = () => { const e={}; if(!form.company.trim()) e.company=true; if(!form.nextFollowUp) e.nfu=true; setErrs(e); return !Object.keys(e).length; };
  const submit = () => { if(validate()) onSave(form); };

  const LBL = (t,req) => <label style={{ display:"block", fontSize:11, fontWeight:700, color:C.textSub, marginBottom:5, fontFamily:F }}>{t}{req&&<span style={{ color:C.lost.dot }}> *</span>}</label>;
  const INP = (ph,val,key,type="text",err) => <input type={type} value={val} onChange={e=>set(key,e.target.value)} placeholder={ph}
    style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${err?C.lost.dot:C.border}`, borderRadius:8, fontSize:13, fontFamily:F, color:C.text, background:"#fff", outline:"none", boxSizing:"border-box" }}
    onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=err?C.lost.dot:C.border} />;
  const SEL = (val,key,opts,ph) => <select value={val} onChange={e=>set(key,e.target.value)}
    style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, color:val?C.text:C.textSub, background:"#fff", cursor:"pointer", outline:"none", boxSizing:"border-box" }}>
    <option value="">{ph}</option>{opts.map(o=><option key={o}>{o}</option>)}
  </select>;
  const SEC = t => <div style={{ fontSize:10, fontWeight:800, color:C.brand, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:12, marginTop:4, fontFamily:F }}>{t}</div>;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(19,11,48,.5)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:720, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.28)" }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 26px 16px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:"#fff", zIndex:1, borderRadius:"18px 18px 0 0" }}>
          <div>
            <h2 style={{ margin:"0 0 2px", fontSize:17, fontWeight:800, color:C.text, fontFamily:F }}>{existing?"Edit funnel":"Add new funnel"}</h2>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:F }}>{existing?`Editing: ${existing.company}`:"Fill in the lead details below"}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, border:`1px solid ${C.border}`, borderRadius:8, background:C.pageBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic d={I.close} size={14} color={C.textSub} />
          </button>
        </div>

        <div style={{ padding:"22px 26px" }}>
          {SEC("Contact details")}
          <div style={{ marginBottom:13 }}>{LBL("Company name",true)}{INP("Enter company / client name",form.company,"company","text",errs.company)}{errs.company&&<span style={{ fontSize:11, color:C.lost.text }}>Required field</span>}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
            <div>{LBL("Contact person")}{INP("Full name",form.contact,"contact")}</div>
            <div>{LBL("Phone")}{INP("+91 XXXXX XXXXX",form.phone,"phone")}</div>
            <div>{LBL("Email")}{INP("email@domain.com",form.email,"email","email")}</div>
          </div>

          {SEC("Funnel information")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:20 }}>
            <div>{LBL("Enquiry type")}{SEL(form.enquiryType,"enquiryType",ENQUIRY_TYPES,"Select…")}</div>
            <div>{LBL("Funnel type")}{SEL(form.funnelType,"funnelType",FUNNEL_TYPES,"Select…")}</div>
            <div>{LBL("Pipeline stage")}{SEL(form.stage,"stage",STAGES,"Select…")}</div>
            <div>{LBL("Next follow-up",true)}<input type="date" value={form.nextFollowUp} onChange={e=>set("nextFollowUp",e.target.value)}
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${errs.nfu?C.lost.dot:C.border}`, borderRadius:8, fontSize:13, fontFamily:F, color:C.text, background:"#fff", outline:"none", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
            </div>
          </div>

          {SEC("Customer requirements")}
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"2.4fr 1.4fr .8fr 1fr .35fr", padding:"8px 14px", background:C.pageBg, gap:8 }}>
              {["Product / item","Category","Qty","Unit price (₹)",""].map(h=><div key={h} style={{ fontSize:9, fontWeight:800, color:C.textSub, letterSpacing:"0.07em" }}>{h}</div>)}
            </div>
            {form.products.map((pr,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"2.4fr 1.4fr .8fr 1fr .35fr", padding:"10px 14px", borderTop:`1px solid ${C.border}`, gap:8, alignItems:"center" }}>
                {[["desc","Product name",],["qty","0","number"],["price","₹0","number"]].map(()=>null)}
                <input value={pr.desc} onChange={e=>sp(i,"desc",e.target.value)} placeholder="e.g. Bridal Lehenga"
                  style={{ padding:"7px 10px", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontFamily:F, color:C.text, background:"#fff", outline:"none" }}
                  onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                <select value={pr.category} onChange={e=>sp(i,"category",e.target.value)}
                  style={{ padding:"7px 10px", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontFamily:F, color:pr.category?C.text:C.textSub, background:"#fff", cursor:"pointer", outline:"none" }}>
                  <option value="">Category</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
                <input type="number" value={pr.qty} onChange={e=>sp(i,"qty",e.target.value)} placeholder="0"
                  style={{ padding:"7px 10px", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontFamily:F, color:C.text, background:"#fff", outline:"none" }}
                  onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                <input type="number" value={pr.price} onChange={e=>sp(i,"price",e.target.value)} placeholder="0"
                  style={{ padding:"7px 10px", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontFamily:F, color:C.text, background:"#fff", outline:"none" }}
                  onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
                <button onClick={()=>set("products",form.products.filter((_,x)=>x!==i))} disabled={form.products.length===1}
                  style={{ background:"none", border:"none", cursor:form.products.length===1?"not-allowed":"pointer", color:C.lost.dot, fontSize:17, opacity:form.products.length===1?.2:1 }}>×</button>
              </div>
            ))}
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}` }}>
              <button onClick={()=>set("products",[...form.products,{desc:"",category:"",qty:"",price:""}])}
                style={{ background:"none", border:`1.5px dashed ${C.brand}`, borderRadius:7, padding:"5px 14px", color:C.brand, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:F, display:"inline-flex", alignItems:"center", gap:5 }}>
                <Ic d={I.plus} size={12} color={C.brand} /> Add item
              </button>
            </div>
          </div>

          {SEC("Remarks")}
          <div style={{ marginBottom:20 }}>
            <textarea value={form.remarks} onChange={e=>set("remarks",e.target.value)} placeholder="Additional notes about this lead…" rows={2}
              style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, color:C.text, resize:"vertical", outline:"none", boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} />
          </div>

          {SEC("Initial quotation")}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
            <div>{LBL("Quote number")}{INP("QT-2026-XXX",form.quoteNo,"quoteNo")}</div>
            <div>{LBL("Quantity")}{INP("0",form.quoteQty,"quoteQty","number")}</div>
            <div>{LBL("Amount (₹)")}{INP("0",form.quoteAmount,"quoteAmount","number")}</div>
          </div>
          <div style={{ marginBottom:12 }}>{LBL("Document link")}{INP("https://…",form.quoteLink,"quoteLink","url")}</div>
          <div>{LBL("Description")}<textarea value={form.quoteDesc} onChange={e=>set("quoteDesc",e.target.value)} placeholder="Quote notes…" rows={2}
            style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:F, color:C.text, resize:"vertical", outline:"none", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor=C.brand} onBlur={e=>e.target.style.borderColor=C.border} /></div>
        </div>

        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"14px 26px 22px", borderTop:`1px solid ${C.border}`, position:"sticky", bottom:0, background:"#fff", borderRadius:"0 0 18px 18px" }}>
          <Btn ghost label="Cancel" onClick={onClose} />
          <Btn primary icon={existing?I.check:I.plus} label={existing?"Save changes":"Add funnel"} onClick={submit} />
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewModal({ funnel, onClose, onEdit, onStatusChange, user }) {
  const [status, setStatus] = useState(funnel.status);
  const sc  = C[status.toLowerCase()] || C.drop;
  const tot = (funnel.products||[]).reduce((s,p)=>s+(Number(p.qty)*Number(p.price)||0),0);
  const doStatus = s => { setStatus(s); onStatusChange(funnel.id, s); };

  const Row = ({l,v}) => (
    <div style={{ display:"grid", gridTemplateColumns:"130px 1fr", gap:8, padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.textSub, fontFamily:F }}>{l}</div>
      <div style={{ fontSize:13, color:C.text, fontFamily:F }}>{v||"—"}</div>
    </div>
  );
  const Sec = t => <div style={{ fontSize:10, fontWeight:800, color:C.brand, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:8, marginTop:4, fontFamily:F }}>{t}</div>;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(19,11,48,.5)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:680, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.28)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"20px 24px 16px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:"#fff", zIndex:1, borderRadius:"18px 18px 0 0" }}>
          <div style={{ flex:1, marginRight:12 }}>
            <h2 style={{ margin:"0 0 3px", fontSize:18, fontWeight:800, color:C.text, fontFamily:F }}>{funnel.company}</h2>
            <p style={{ margin:0, fontSize:12, color:C.textSub, fontFamily:F }}>Added {funnel.createdAt} · {funnel.createdBy}</p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {can(user,"edit") && <Btn ghost sm icon={I.edit} label="Edit" onClick={()=>{ onClose(); onEdit(funnel); }} />}
            <select value={status} onChange={e=>doStatus(e.target.value)}
              style={{ padding:"6px 10px", borderRadius:8, border:`1.5px solid ${sc.border||sc.dot}`, fontSize:12, fontWeight:700, color:sc.text, background:sc.bg, cursor:"pointer", fontFamily:F }}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={onClose} style={{ width:32, height:32, border:`1px solid ${C.border}`, borderRadius:8, background:C.pageBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Ic d={I.close} size={14} color={C.textSub} />
            </button>
          </div>
        </div>

        <div style={{ padding:"20px 24px" }}>
          {Sec("Contact details")}
          <Row l="Contact person" v={funnel.contact} />
          <Row l="Phone"          v={funnel.phone}   />
          <Row l="Email"          v={funnel.email}   />
          <div style={{ height:16 }} />
          {Sec("Funnel information")}
          <Row l="Enquiry type"   v={funnel.enquiryType}   />
          <Row l="Funnel type"    v={funnel.funnelType}    />
          <Row l="Stage"          v={funnel.stage}         />
          <Row l="Next follow-up" v={funnel.nextFollowUp}  />
          <div style={{ height:16 }} />
          {Sec("Products / items")}
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr .7fr 1fr 1.1fr", padding:"8px 14px", background:C.pageBg }}>
              {["Description","Category","Qty","Unit price","Total"].map(h=><div key={h} style={{ fontSize:9, fontWeight:800, color:C.textSub, letterSpacing:"0.07em" }}>{h}</div>)}
            </div>
            {(funnel.products||[]).map((p,i)=>(
              <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr .7fr 1fr 1.1fr", padding:"10px 14px", borderTop:`1px solid ${C.border}` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, fontFamily:F }}>{p.desc||"—"}</div>
                <div style={{ fontSize:12, color:C.textSub, fontFamily:F }}>{p.category||"—"}</div>
                <div style={{ fontSize:12, color:C.textSub, fontFamily:F }}>{p.qty||"—"}</div>
                <div style={{ fontSize:12, color:C.textSub, fontFamily:F }}>{p.price?inr(p.price):"—"}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.brand, fontFamily:F }}>{p.qty&&p.price?inr(Number(p.qty)*Number(p.price)):"—"}</div>
              </div>
            ))}
            {tot>0 && <div style={{ display:"flex", justifyContent:"flex-end", padding:"10px 14px", borderTop:`1px solid ${C.borderMid}`, fontFamily:F, fontSize:13, fontWeight:800, color:C.brand }}>Total: {inr(tot)}</div>}
          </div>
          {funnel.remarks && <><div style={{ height:4 }} />{Sec("Remarks")}<div style={{ background:C.pageBg, padding:"10px 14px", borderRadius:8, fontSize:13, color:C.text, fontFamily:F, marginBottom:16 }}>{funnel.remarks}</div></>}
          {Sec("Quotation")}
          <Row l="Quote number" v={funnel.quoteNo}   />
          <Row l="Quantity"     v={funnel.quoteQty}  />
          <Row l="Amount"       v={funnel.quoteAmount?inr(funnel.quoteAmount):null} />
          {funnel.quoteDesc && <Row l="Description" v={funnel.quoteDesc} />}
          {(funnel.billedAmount||funnel.billedDate) && <>
            <div style={{ height:16 }} />
            {Sec("Billing")}
            <Row l="Billed amount" v={inr(funnel.billedAmount)} />
            <Row l="Billed date"   v={funnel.billedDate}        />
          </>}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App({ user, users, onLogout, onUsersChange }) {
  const [funnels,    setFunnels]    = useState(SEED_FUNNELS);
  const [view,       setView]       = useState("dashboard");
  const [search,     setSearch]     = useState("");
  const [filters,    setFilters]    = useState({ status:"", funnelType:"", enquiryType:"", missed:false, today:false, upcoming:false });
  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const { toasts, push } = useToast();

  const TODAY = todayISO();
  const setF = (k,v) => setFilters(f=>({...f,[k]:v}));
  const reset = () => setFilters({ status:"", funnelType:"", enquiryType:"", missed:false, today:false, upcoming:false });

  const scoped = useMemo(()=>
    FULL_ACCESS.includes(user.role) ? funnels : funnels.filter(f=>f.createdBy===user.name)
  ,[funnels, user]);

  const filtered = useMemo(()=> scoped.filter(f=>{
    if (search){ const q=search.toLowerCase(); if (!f.company.toLowerCase().includes(q) && !(f.contact||"").toLowerCase().includes(q) && !(f.email||"").toLowerCase().includes(q)) return false; }
    if (filters.status      && f.status     !== filters.status)      return false;
    if (filters.funnelType  && f.funnelType !== filters.funnelType)  return false;
    if (filters.enquiryType && f.enquiryType!== filters.enquiryType) return false;
    if (filters.missed   && (!f.nextFollowUp || f.nextFollowUp >= TODAY)) return false;
    if (filters.today    && f.nextFollowUp !== TODAY)                 return false;
    if (filters.upcoming && f.nextFollowUp <= TODAY)                  return false;
    return true;
  }),[scoped, search, filters, TODAY]);

  const saveFunnel = form => {
    if (editTarget) {
      setFunnels(p=>p.map(f=>f.id===editTarget.id?{...f,...form}:f));
      setEditTarget(null); push("Funnel updated", "success");
    } else {
      setFunnels(p=>[{ id:Date.now(), createdAt:nowStr(), createdBy:user.name, status:"Pending", stage:form.stage||"New Lead", billedAmount:null, billedDate:null, ...form },...p]);
      setAddOpen(false); push("Funnel added", "success");
    }
  };

  const deleteFunnel  = id => { setFunnels(p=>p.filter(f=>f.id!==id)); push("Funnel deleted","info"); };
  const updateStatus  = (id,s) => { setFunnels(p=>p.map(f=>f.id===id?{...f,status:s}:f)); push(`Status → ${s}`,"success"); };
  const updateStage   = (id,s) => { setFunnels(p=>p.map(f=>f.id===id?{...f,stage:s}:f));  push(`Moved to ${s}`,"info"); };

  const greet = `Good ${new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, ${user.name} 👋`;
  const titles = { dashboard:["Dashboard", greet], pipeline:["Pipeline", "Visual kanban — move deals through stages"], funnels:["Funnels", "All your leads in one place"], analytics:["Analytics","Performance insights and revenue metrics"], team:["Team","Manage your team and access levels"] };
  const [title, subtitle] = titles[view] || ["",""];

  const exportAll      = () => { downloadXLS(scoped,  `Ekanta_All_${TODAY}.xls`);      push(`Exported ${scoped.length} funnels`,"info"); };
  const exportFiltered = () => { downloadXLS(filtered,`Ekanta_Filtered_${TODAY}.xls`); push(`Exported ${filtered.length} funnels`,"info"); };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.pageBg, fontFamily:F }}>
      <Sidebar active={view} setActive={setView} user={user} onLogout={onLogout} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <Topbar title={title} subtitle={subtitle} search={search} setSearch={setSearch} user={user} funnels={scoped} filtered={filtered} onAdd={()=>setAddOpen(true)} onExportAll={exportAll} onExportFiltered={exportFiltered} />

        {view==="dashboard" && <>
          <StatsRow funnels={scoped} />
          <FilterBar filters={filters} setF={setF} reset={reset} />
          <div style={{ background:"#fff", flex:1 }}>
            <FunnelsTable funnels={filtered} user={user} onView={setViewTarget} onEdit={f=>setEditTarget(f)} onDelete={deleteFunnel} today={TODAY} />
          </div>
        </>}

        {view==="pipeline" && <>
          <StatsRow funnels={scoped} />
          <PipelineBoard funnels={scoped} user={user} onView={setViewTarget} onEdit={f=>setEditTarget(f)} onStageChange={updateStage} />
        </>}

        {view==="funnels" && <>
          <FilterBar filters={filters} setF={setF} reset={reset} />
          <div style={{ background:"#fff", flex:1 }}>
            <FunnelsTable funnels={filtered} user={user} onView={setViewTarget} onEdit={f=>setEditTarget(f)} onDelete={deleteFunnel} today={TODAY} />
          </div>
        </>}

        {view==="analytics" && FULL_ACCESS.includes(user.role) && <AnalyticsView funnels={funnels} />}
        {view==="team"      && FULL_ACCESS.includes(user.role) && <TeamPanel users={users} onSave={onUsersChange} />}
      </div>

      {(addOpen||editTarget) && <FunnelModal onClose={()=>{ setAddOpen(false); setEditTarget(null); }} onSave={saveFunnel} existing={editTarget} />}
      {viewTarget && <ViewModal funnel={viewTarget} onClose={()=>setViewTarget(null)} onEdit={f=>setEditTarget(f)} onStatusChange={updateStatus} user={user} />}
      <Toaster toasts={toasts} />
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function Root() {
  const [user,  setUser]  = useState(null);
  const [users, setUsers] = useState(SEED_USERS);
  return (
    <>
      <FontLoader />
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {!user
        ? <LoginPage users={users} onLogin={setUser} />
        : <App user={user} users={users} onLogout={()=>setUser(null)} onUsersChange={setUsers} />
      }
    </>
  );
}