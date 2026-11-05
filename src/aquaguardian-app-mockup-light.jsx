import { useState } from "react";
import {
  Battery, MapPin, Radio, AlertTriangle, Anchor, Compass, Camera, Gauge,
  Bell, Clock, ChevronLeft, Wifi, Thermometer, Signal, Play, Square,
  RotateCcw, LifeBuoy, CheckCircle2, Lock, Mail, ArrowRight, Phone, User,
  Eye, EyeOff, ChevronDown, LogOut, Pencil, ShieldCheck, Building2
} from "lucide-react";

/* ---------------------------------------------------------------
   AQUAGUARDIAN — EOC Mobile App Mockup (Light Theme)
   Tokens:
   bg #F5F8FC, surface #FFFFFF, ink #0B1E3D, slate #64768F, slateDim #98A7BE
   line rgba(11,30,61,0.09), cyan #0092B8, cyanSoft #E3F6FA,
   orange #E8660B, orangeSoft #FEF0E3, red #D62839, redSoft #FBE7E9
   Sonar/device panels stay deep navy for contrast — the one dark
   "instrument" note inside an otherwise light, clinical EOC app.
----------------------------------------------------------------*/

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;

const C = {
  bg: "#F5F8FC",
  surface: "#FFFFFF",
  ink: "#0B1E3D",
  slate: "#64768F",
  slateDim: "#A3B0C4",
  line: "rgba(11,30,61,0.09)",
  navy: "#0B1E3D",
  navyDeep: "#071426",
  cyan: "#0092B8",
  cyanSoft: "#E3F6FA",
  orange: "#E8660B",
  orangeSoft: "#FEF0E3",
  red: "#D62839",
  redSoft: "#FBE7E9",
};

/* ---------------- Sonar instrument panel (signature) ---------------- */
function SonarSweep({ size = 160, blips = [] }) {
  const c = size / 2;
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="sonarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0E2A4F" />
            <stop offset="100%" stopColor="#071426" />
          </radialGradient>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={c - 2} fill="url(#sonarBg)" stroke="#0891B2" strokeWidth="1" />
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle key={i} cx={c} cy={c} r={(c - 4) * r} fill="none" stroke="#0891B2" strokeOpacity="0.35" strokeWidth="1" />
        ))}
        <line x1={c} y1={4} x2={c} y2={size - 4} stroke="#0891B2" strokeOpacity="0.2" />
        <line x1={4} y1={c} x2={size - 4} y2={c} stroke="#0891B2" strokeOpacity="0.2" />
        <g style={{ transformOrigin: `${c}px ${c}px`, animation: "sonarSpin 3.2s linear infinite" }}>
          <path d={`M ${c} ${c} L ${c} 4 A ${c - 4} ${c - 4} 0 0 1 ${c + (c - 4) * Math.sin(0.9)} ${c - (c - 4) * Math.cos(0.9)} Z`} fill="url(#sweepGrad)" />
        </g>
        {blips.map((b, i) => (
          <circle key={i} cx={c + b.x} cy={c + b.y} r={b.r || 4} fill={b.color || "#FF7A29"} style={{ animation: `blip 1.8s ease-in-out ${i * 0.3}s infinite` }} />
        ))}
      </svg>
      <style>{`
        @keyframes sonarSpin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes blip { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

/* ---------------- Shared atoms ---------------- */
function Pill({ tone = "cyan", children }) {
  const map = {
    cyan: { bg: C.cyanSoft, fg: C.cyan },
    orange: { bg: C.orangeSoft, fg: C.orange },
    red: { bg: C.redSoft, fg: C.red },
    slate: { bg: "#EEF2F7", fg: C.slate },
  };
  const t = map[tone];
  return (
    <span style={{ background: t.bg, color: t.fg, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999 }}>{children}</span>
  );
}
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, boxShadow: "0 1px 2px rgba(11,30,61,0.04)", ...style }}>
      {children}
    </div>
  );
}
function Header({ title, eyebrow, right, onBack }) {
  return (
    <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: C.slate, cursor: "pointer", padding: 4 }}><ChevronLeft size={20} /></button>}
        <div>
          {eyebrow && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: C.cyan, letterSpacing: 1.5, textTransform: "uppercase" }}>{eyebrow}</div>}
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, color: C.ink }}>{title}</div>
        </div>
      </div>
      {right}
    </div>
  );
}
function Field({ icon: Icon, label, ...props }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: C.slate, marginBottom: 5, fontWeight: 600 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <Icon size={16} color={C.slateDim} style={{ position: "absolute", left: 13, top: 13 }} />
        <input {...props} style={inputStyle} />
      </div>
    </div>
  );
}
const inputStyle = {
  width: "100%", background: "#FBFCFE", border: `1.5px solid ${C.line}`, borderRadius: 10,
  padding: "12px 14px 12px 38px", color: C.ink, fontSize: 14, fontFamily: "'Inter', sans-serif",
  outline: "none", boxSizing: "border-box"
};
function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#B9CBE0" : C.navy, color: "#fff", border: "none", borderRadius: 10,
      padding: "14px 0", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      cursor: disabled ? "not-allowed" : "pointer", width: "100%"
    }}>
      {children}
    </button>
  );
}

/* ---------------- Auth: Sign In ---------------- */
function SignInScreen({ onSignIn, goSignUp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const canSubmit = email.length > 3 && password.length >= 4;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 24px 28px", overflowY: "auto" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <SonarSweep size={120} blips={[{ x: 20, y: -26, r: 3 }]} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cyan, letterSpacing: 3 }}>RESCUE OPERATIONS</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: C.ink, marginTop: 2 }}>Welcome back</div>
          <div style={{ color: C.slate, fontSize: 13, marginTop: 5 }}>Sign in to your rescue team account</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 26 }}>
          <Field icon={Mail} label="Email" placeholder="you@rescueteam.org" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div>
            <div style={{ fontSize: 11.5, color: C.slate, marginBottom: 5, fontWeight: 600 }}>Password</div>
            <div style={{ position: "relative" }}>
              <Lock size={16} color={C.slateDim} style={{ position: "absolute", left: 13, top: 13 }} />
              <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: 40 }} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: 11, background: "none", border: "none", cursor: "pointer" }}>
                {showPw ? <EyeOff size={16} color={C.slateDim} /> : <Eye size={16} color={C.slateDim} />}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <span style={{ fontSize: 12, color: C.cyan, fontWeight: 600, cursor: "pointer" }}>Forgot password?</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <PrimaryButton onClick={onSignIn} disabled={!canSubmit}>Sign in <ArrowRight size={16} /></PrimaryButton>
        <div style={{ textAlign: "center", fontSize: 13, color: C.slate }}>
          Don't have an account? <span onClick={goSignUp} style={{ color: C.cyan, fontWeight: 700, cursor: "pointer" }}>Sign up</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Auth: Sign Up ---------------- */
function SignUpScreen({ onSignUp, goSignIn }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", org: "", role: "Operator", password: "", confirm: "" });
  const [roleOpen, setRoleOpen] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const canSubmit = form.name && form.email && form.phone && form.password.length >= 4 && form.password === form.confirm;

  return (
    <div style={{ padding: "32px 24px 36px", overflowY: "auto", height: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.cyan, letterSpacing: 3 }}>REGISTER TEAM ACCESS</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 2 }}>Create your account</div>
        <div style={{ color: C.slate, fontSize: 13, marginTop: 5 }}>Set up your personal rescue operator profile</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field icon={User} label="Full name" placeholder="Karthik R" value={form.name} onChange={set("name")} />
        <Field icon={Mail} label="Email" placeholder="you@rescueteam.org" value={form.email} onChange={set("email")} />
        <Field icon={Phone} label="Phone number" placeholder="+91 90000 00000" value={form.phone} onChange={set("phone")} />
        <Field icon={Building2} label="Rescue team / organization" placeholder="Karur Water Rescue Unit" value={form.org} onChange={set("org")} />

        <div>
          <div style={{ fontSize: 11.5, color: C.slate, marginBottom: 5, fontWeight: 600 }}>Role</div>
          <div style={{ position: "relative" }}>
            <ShieldCheck size={16} color={C.slateDim} style={{ position: "absolute", left: 13, top: 13, zIndex: 1 }} />
            <button onClick={() => setRoleOpen(!roleOpen)} style={{ ...inputStyle, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {form.role} <ChevronDown size={15} color={C.slateDim} />
            </button>
            {roleOpen && (
              <div style={{ position: "absolute", top: "108%", left: 0, right: 0, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: "0 8px 20px rgba(11,30,61,0.12)", zIndex: 2, overflow: "hidden" }}>
                {["Operator", "Team Lead", "Admin"].map((r) => (
                  <div key={r} onClick={() => { setForm({ ...form, role: r }); setRoleOpen(false); }} style={{ padding: "10px 14px", fontSize: 13.5, color: C.ink, cursor: "pointer" }}>{r}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Field icon={Lock} label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set("password")} />
        <Field icon={Lock} label="Confirm password" type="password" placeholder="Re-enter password" value={form.confirm} onChange={set("confirm")} />

        <div style={{ marginTop: 6 }}>
          <PrimaryButton onClick={() => onSignUp(form)} disabled={!canSubmit}>Create account <ArrowRight size={16} /></PrimaryButton>
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: C.slate }}>
          Already have an account? <span onClick={goSignIn} style={{ color: C.cyan, fontWeight: 700, cursor: "pointer" }}>Sign in</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Profile ---------------- */
function ProfileScreen({ user, onBack, onSignOut }) {
  const initials = (user.name || "K R").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const rows = [
    { icon: Mail, label: "Email", value: user.email || "you@rescueteam.org" },
    { icon: Phone, label: "Phone", value: user.phone || "+91 90000 00000" },
    { icon: Building2, label: "Team", value: user.org || "Karur Water Rescue Unit" },
    { icon: ShieldCheck, label: "Role", value: user.role || "Operator" },
  ];
  return (
    <div>
      <Header eyebrow="Account" title="Your Profile" onBack={onBack} />
      <div style={{ padding: "0 18px 40px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 24 }}>
            {initials}
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink, marginTop: 10 }}>{user.name || "Karthik R"}</div>
          <div style={{ marginTop: 4 }}><Pill tone="cyan">{user.role || "Operator"}</Pill></div>
        </div>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none" }}>
              <r.icon size={16} color={C.cyan} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: C.slateDim }}>{r.label}</div>
                <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{r.value}</div>
              </div>
            </div>
          ))}
        </Card>

        <button style={{ marginTop: 12, width: "100%", background: "none", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.ink, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
          <Pencil size={14} /> Edit profile
        </button>
        <button onClick={onSignOut} style={{ marginTop: 10, width: "100%", background: C.redSoft, border: "none", borderRadius: 10, padding: "12px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.red, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function DashboardScreen({ nav, user }) {
  const initials = (user.name || "K R").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div>
      <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: C.cyan, letterSpacing: 1.5, textTransform: "uppercase" }}>Command Overview</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, fontWeight: 700, color: C.ink }}>Hi, {(user.name || "Karthik").split(" ")[0]}</div>
        </div>
        <div onClick={() => nav("profile")} style={{ width: 38, height: 38, borderRadius: 999, background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {initials}
        </div>
      </div>
      <div style={{ padding: "0 18px 100px", display: "flex", flexDirection: "column", gap: 12 }}>

        <Card style={{ background: `linear-gradient(135deg, #FFF, ${C.cyanSoft})` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: C.slate, fontFamily: "'JetBrains Mono', monospace" }}>MISSION #A-1042</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.ink, fontSize: 16, marginTop: 2 }}>Lakeview Reservoir</div>
              <div style={{ color: C.slate, fontSize: 12.5, marginTop: 4 }}>Robot en route · victim signal acquired</div>
            </div>
            <Pill tone="red">CRITICAL</Pill>
          </div>
          <button onClick={() => nav("map")} style={{ marginTop: 12, width: "100%", background: "#fff", border: `1px solid rgba(0,146,184,0.3)`, color: C.cyan, borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            View live map →
          </button>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.slate, fontSize: 11.5 }}><Anchor size={13} /> CONNECTED ROBOTS</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 4 }}>3</div>
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.slate, fontSize: 11.5 }}><ShieldCheck size={13} /> RESCUES YTD</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 4 }}>27</div>
          </Card>
        </div>

        <div style={{ fontSize: 12, color: C.slate, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginTop: 4 }}>ROBOT FLEET</div>
        {[
          { id: "AG-01", loc: "Deployed · Lakeview", batt: 76 },
          { id: "AG-02", loc: "Deployed · Lakeview", batt: 54 },
          { id: "AG-03", loc: "Docked · Station 4", batt: 100 },
        ].map((r) => (
          <Card key={r.id} onClick={() => nav("control")} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: C.ink, fontSize: 14.5 }}>{r.id}</div>
                <div style={{ color: C.slate, fontSize: 12, marginTop: 2 }}>{r.loc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Battery size={15} color={r.batt > 60 ? C.cyan : C.orange} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.ink }}>{r.batt}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Live Map ---------------- */
function MapScreen() {
  return (
    <div>
      <Header eyebrow="Mission A-1042" title="Live Map" right={<Pill tone="cyan">TRACKING</Pill>} />
      <div style={{ padding: "0 18px 100px" }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 260, position: "relative", background: `radial-gradient(circle at 30% 30%, #123258, #071426)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SonarSweep size={230} blips={[{ x: 42, y: -55, r: 5, color: "#FF7A29" }, { x: -60, y: 30, r: 4, color: "#FF5A5F" }]} />
            <div style={{ position: "absolute", top: 42, left: "58%", textAlign: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#FF7A29", margin: "0 auto", boxShadow: "0 0 8px #FF7A29" }} />
              <div style={{ fontSize: 9.5, color: "#FF7A29", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>VICTIM</div>
            </div>
            <div style={{ position: "absolute", bottom: 46, left: "26%", textAlign: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#FF5A5F", margin: "0 auto", boxShadow: "0 0 8px #FF5A5F" }} />
              <div style={{ fontSize: 9.5, color: "#FF5A5F", fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>OBSTACLE</div>
            </div>
          </div>
          <div style={{ padding: 12, display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11.5, color: C.slate }}>AG-01 heading 214° · 1.4 m/s</div>
            <div style={{ fontSize: 11.5, color: C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>DEPTH 4.2m</div>
          </div>
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <Card>
            <div style={{ color: C.slate, fontSize: 11.5, display: "flex", gap: 6, alignItems: "center" }}><MapPin size={13} /> ETA TO TARGET</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: C.ink, marginTop: 4 }}>00:48</div>
          </Card>
          <Card>
            <div style={{ color: C.slate, fontSize: 11.5, display: "flex", gap: 6, alignItems: "center" }}><Compass size={13} /> RESCUE TEAM</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: C.ink, marginTop: 4 }}>2.1 km</div>
          </Card>
        </div>
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: C.slate, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>SAFE NAVIGATION ROUTE</div>
          <div style={{ height: 6, borderRadius: 999, background: "#EEF2F7", overflow: "hidden" }}>
            <div style={{ width: "64%", height: "100%", background: `linear-gradient(90deg, #0891B2, #00D4FF)` }} />
          </div>
          <div style={{ fontSize: 11, color: C.slateDim, marginTop: 6 }}>64% of planned route complete</div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Robot Control ---------------- */
function ControlScreen() {
  const [mode, setMode] = useState("auto");
  const [beltArmed, setBeltArmed] = useState(false);
  return (
    <div>
      <Header eyebrow="AG-01 · Lakeview Reservoir" title="Robot Control" right={<Pill tone="cyan">ONLINE</Pill>} />
      <div style={{ padding: "0 18px 100px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 150, background: `repeating-linear-gradient(45deg, #0C2140, #0C2140 10px, #0E2748 10px, #0E2748 20px)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Camera size={26} color="#7E93B8" />
            <div style={{ position: "absolute", top: 10, left: 10 }}><Pill tone="red">● LIVE</Pill></div>
            <div style={{ position: "absolute", bottom: 10, right: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#7E93B8" }}>CAM_01 · 24fps</div>
          </div>
        </Card>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SonarSweep size={150} blips={[{ x: 30, y: -20, r: 4, color: "#FF7A29" }]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {[{ icon: Battery, label: "76%", sub: "BATTERY" }, { icon: Thermometer, label: "24°C", sub: "TEMP" }, { icon: Gauge, label: "4.2m", sub: "DEPTH" }, { icon: Signal, label: "Strong", sub: "ACOUSTIC" }].map((s, i) => (
            <Card key={i} style={{ textAlign: "center", padding: "10px 6px" }}>
              <s.icon size={15} color={C.cyan} style={{ margin: "0 auto" }} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: C.ink, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 8.5, color: C.slateDim, marginTop: 1 }}>{s.sub}</div>
            </Card>
          ))}
        </div>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, color: C.slate }}>Navigation mode</span>
            <div style={{ display: "flex", background: "#EEF2F7", borderRadius: 8, padding: 3 }}>
              {["auto", "manual"].map((m) => (
                <button key={m} onClick={() => setMode(m)} style={{ border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: 600, background: mode === m ? C.navy : "transparent", color: mode === m ? "#fff" : C.slate }}>{m === "auto" ? "Autonomous" : "Manual"}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ActionButton icon={Play} label="Deploy" tone="cyan" />
            <ActionButton icon={RotateCcw} label="Return" tone="slate" />
            <ActionButton icon={LifeBuoy} label={beltArmed ? "Belt armed" : "Deploy belt"} tone="orange" onClick={() => setBeltArmed(!beltArmed)} />
            <ActionButton icon={Square} label="Emergency stop" tone="red" />
          </div>
        </Card>
      </div>
    </div>
  );
}
function ActionButton({ icon: Icon, label, tone, onClick }) {
  const t = { cyan: C.cyan, orange: C.orange, red: C.red, slate: C.slate }[tone];
  return (
    <button onClick={onClick} style={{ background: "#FBFCFE", border: `1px solid ${t}55`, borderRadius: 10, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
      <Icon size={17} color={t} />
      <span style={{ fontSize: 11.5, color: C.ink, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{label}</span>
    </button>
  );
}

/* ---------------- Alerts ---------------- */
function AlertsScreen() {
  const items = [
    { icon: AlertTriangle, tone: "red", title: "SOS Alert", sub: "Lakeview Reservoir · Station 4", time: "2m ago" },
    { icon: LifeBuoy, tone: "orange", title: "Victim detected", sub: "AG-01 sonar confirmed contact", time: "4m ago" },
    { icon: Battery, tone: "orange", title: "Battery warning", sub: "AG-02 at 54% · continue mission", time: "11m ago" },
    { icon: CheckCircle2, tone: "cyan", title: "Mission complete", sub: "AG-03 · Riverside Point", time: "1h ago" },
    { icon: Wifi, tone: "slate", title: "Communication restored", sub: "AG-02 acoustic link reconnected", time: "2h ago" },
  ];
  return (
    <div>
      <Header eyebrow="Live Feed" title="Notifications" />
      <div style={{ padding: "0 18px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((n, i) => (
          <Card key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ background: { red: C.redSoft, orange: C.orangeSoft, cyan: C.cyanSoft, slate: "#EEF2F7" }[n.tone], borderRadius: 8, padding: 8 }}>
              <n.icon size={16} color={{ red: C.red, orange: C.orange, cyan: C.cyan, slate: C.slate }[n.tone]} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13.5, color: C.ink }}>{n.title}</span>
                <span style={{ fontSize: 10.5, color: C.slateDim, fontFamily: "'JetBrains Mono', monospace" }}>{n.time}</span>
              </div>
              <div style={{ fontSize: 12, color: C.slate, marginTop: 2 }}>{n.sub}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- History ---------------- */
function HistoryScreen() {
  const missions = [
    { id: "A-1041", place: "Riverside Point", date: "Jul 27", result: "Rescued", robot: "AG-03", tone: "cyan" },
    { id: "A-1038", place: "North Dam", date: "Jul 22", result: "Rescued", robot: "AG-01", tone: "cyan" },
    { id: "A-1029", place: "Coral Bay", date: "Jul 15", result: "No victim found", robot: "AG-02", tone: "slate" },
    { id: "A-1017", place: "Lakeview Reservoir", date: "Jul 3", result: "Rescued", robot: "AG-01", tone: "cyan" },
  ];
  return (
    <div>
      <Header eyebrow="Records" title="Mission History" />
      <div style={{ padding: "0 18px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {missions.map((m, i) => (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.slate }}>#{m.id}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14.5, color: C.ink, marginTop: 2 }}>{m.place}</div>
                <div style={{ fontSize: 11.5, color: C.slateDim, marginTop: 3 }}>{m.date} · Robot {m.robot}</div>
              </div>
              <Pill tone={m.tone}>{m.result}</Pill>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Bottom nav ---------------- */
function BottomNav({ screen, nav }) {
  const items = [
    { id: "dashboard", icon: Gauge, label: "Home" },
    { id: "map", icon: MapPin, label: "Map" },
    { id: "control", icon: Radio, label: "Control" },
    { id: "alerts", icon: Bell, label: "Alerts" },
    { id: "history", icon: Clock, label: "History" },
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderTop: `1px solid ${C.line}`, display: "flex", padding: "10px 6px 14px" }}>
      {items.map((it) => {
        const active = screen === it.id;
        return (
          <button key={it.id} onClick={() => nav(it.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 4 }}>
            <it.icon size={19} color={active ? C.cyan : C.slateDim} />
            <span style={{ fontSize: 9.5, color: active ? C.cyan : C.slateDim, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- App shell ---------------- */
export default function AquaGuardianMockup() {
  const [screen, setScreen] = useState("signin");
  const [user, setUser] = useState({});

  const handleSignUp = (form) => { setUser(form); setScreen("dashboard"); };
  const handleSignIn = () => setScreen("dashboard");
  const handleSignOut = () => { setUser({}); setScreen("signin"); };

  const screens = {
    dashboard: <DashboardScreen nav={setScreen} user={user} />,
    map: <MapScreen />,
    control: <ControlScreen />,
    alerts: <AlertsScreen />,
    history: <HistoryScreen />,
    profile: <ProfileScreen user={user} onBack={() => setScreen("dashboard")} onSignOut={handleSignOut} />,
  };

  const authScreens = ["signin", "signup"];
  const isAuth = authScreens.includes(screen);

  return (
    <div style={{ minHeight: "100vh", background: "#E7ECF3", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ width: 375, height: 720, background: C.bg, borderRadius: 36, border: `8px solid #0B1E3D`, position: "relative", overflow: "hidden", boxShadow: "0 30px 60px rgba(11,30,61,0.25)" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 22, background: "#0B1E3D", borderRadius: "0 0 14px 14px", zIndex: 10 }} />
        <div style={{ height: "100%", overflowY: "auto" }}>
          {screen === "signin" && <SignInScreen onSignIn={handleSignIn} goSignUp={() => setScreen("signup")} />}
          {screen === "signup" && <SignUpScreen onSignUp={handleSignUp} goSignIn={() => setScreen("signin")} />}
          {!isAuth && screens[screen]}
        </div>
        {!isAuth && screen !== "profile" && <BottomNav screen={screen} nav={setScreen} />}
      </div>
    </div>
  );
}
