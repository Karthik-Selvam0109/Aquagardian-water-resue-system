import { Component, useEffect, useRef, useState } from "react";
import { Activity, Anchor, Bell, Compass, LogOut, Menu, Plus, ShieldCheck, Siren, UserRound, Waves, X } from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

export class AppErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("AquaGuardian UI error", error, info); }
  render() {
    if (this.state.hasError) return <main className="auth-page"><section className="auth-card"><Brand /><h1>The app encountered an error</h1><p>The workspace has been protected. Reload to try again.</p><button className="primary-button" onClick={() => window.location.reload()}>Reload app</button></section></main>;
    return this.props.children;
  }
}

const api = async (path, options = {}) => {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({ error: "The server returned an unreadable response." }));
  if (!response.ok) throw new Error(body.error || "The request could not be completed.");
  return body;
};

async function signUp(details) {
  return api("/api/auth/signup", { method: "POST", body: JSON.stringify(details) });
}

async function signIn(email, password) {
  return api("/api/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) });
}

function defaultWorkspace() { return { robots: [], missions: [], alerts: [], commands: [], operations: [] }; }

function App() {
  const [session, setSession] = useState(false);
  const [account, setAccount] = useState(null);
  const [workspace, setWorkspace] = useState(defaultWorkspace());
  const [booting, setBooting] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([api("/api/account/me"), api("/api/workspace")])
      .then(([accountBody, workspaceBody]) => {
        if (!active) return;
        setAccount(accountBody.user);
        setWorkspace({ ...defaultWorkspace(), ...workspaceBody.data });
        setSession(true);
      })
      .catch(() => { if (active) setSession(false); })
      .finally(() => { if (active) setBooting(false); });
    return () => { active = false; };
  }, []);

  const saveWorkspace = async (next) => {
    await api("/api/workspace", { method: "PUT", body: JSON.stringify(next) });
    setWorkspace(next);
  };
  const saveAccount = async (updates) => {
    const body = await api("/api/account/profile", { method: "PATCH", body: JSON.stringify(updates) });
    setAccount(body.user);
  };
  const signOut = async () => {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
    setAccount(null); setWorkspace(defaultWorkspace()); setSession(false); navigate("/sign-in", { replace: true });
  };
  const deleteAccount = async () => {
    if (!window.confirm("Delete this account and all workspace records permanently?")) return;
    await api("/api/account/me", { method: "DELETE", body: "{}" });
    setAccount(null); setWorkspace(defaultWorkspace()); setSession(false); navigate("/sign-in", { replace: true });
  };

  if (booting) return <main className="auth-page"><section className="auth-card loading-card"><div className="loading-ring" /><h1>Preparing workspace</h1><p>Checking your secure session…</p></section></main>;

  return <Routes>
    <Route path="/" element={<Navigate to={session ? "/app" : "/sign-in"} replace />} />
    <Route path="/sign-in" element={session ? <Navigate to="/app" replace /> : <AuthScreen mode="signin" />} />
    <Route path="/sign-up" element={session ? <Navigate to="/app" replace /> : <AuthScreen mode="signup" />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/onboarding" element={session ? <Onboarding account={account} onComplete={(updates) => { saveAccount({ ...updates, onboardingCompleted: true }).then(() => navigate("/app", { replace: true })); }} /> : <Navigate to="/sign-in" replace />} />
    <Route path="/privacy" element={<Legal title="Privacy policy" body="AquaGuardian stores operator and rescue records in its local SQLite database on the server. Passwords are salted and hashed. Sessions use secure HTTP-only cookies. Configure SMTP to deliver real email. Only authorized server code can read database credentials and private configuration." />} />
    <Route path="/terms" element={<Legal title="Terms of service" body="This operator interface is a local training and recordkeeping tool. Robot controls are simulations and do not operate physical equipment. Trained rescue personnel remain responsible for every operation." />} />
    <Route path="/app" element={session ? <Shell account={account} workspace={workspace} saveWorkspace={saveWorkspace} saveAccount={saveAccount} signOut={signOut} deleteAccount={deleteAccount} /> : <Navigate to="/sign-in" replace />} />
    <Route path="/app/:view" element={session ? <Shell account={account} workspace={workspace} saveWorkspace={saveWorkspace} saveAccount={saveAccount} signOut={signOut} deleteAccount={deleteAccount} /> : <Navigate to="/sign-in" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}

function AuthScreen({ mode }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", team: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      if (mode === "signup") {
        if (form.password !== form.confirm) throw new Error("Passwords do not match.");
        await signUp(form); window.location.assign("/onboarding");
      } else {
        await signIn(form.email, form.password); window.location.assign("/app");
      }
    } catch (cause) {
      const message = cause.message || "Unable to continue.";
      setError(message);
    } finally { setBusy(false); }
  };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <RadarVisual />
    <Brand />
    <h1>{mode === "signup" ? "Create an account" : "Welcome back"}</h1>
    <p className="auth-subtitle">{mode === "signup" ? "Set up your rescue operator profile." : "Sign in to your operator workspace."}</p>
    {mode === "signup" && <><Field label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><div className="form-grid"><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="Team" value={form.team} onChange={(value) => setForm({ ...form, team: value })} /></div></>}
    <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
    <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
    {mode === "signup" && <Field label="Confirm password" type="password" value={form.confirm} onChange={(value) => setForm({ ...form, confirm: value })} />}
    {error && <div className="error-message">{error}</div>}
    {notice && <div className="success-message">{notice}</div>}
    <button className="primary-button" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
    <div className="auth-links">{mode === "signup" ? <Link to="/sign-in">Already have an account? Sign in</Link> : <><Link to="/sign-up">Create an account</Link><Link to="/forgot-password">Forgot password?</Link></>}</div>
  </form></main>;
}

function ForgotPassword() {
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(""); try { const body = await api("/api/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) }); setNotice(body.message); } catch (cause) { setError(cause.message); } finally { setBusy(false); } };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><Brand /><h1>Reset password</h1><p className="auth-subtitle">Enter your account email.</p><Field label="Email" type="email" value={email} onChange={setEmail} />{error && <div className="error-message">{error}</div>}{notice && <div className="success-message">{notice}</div>}<button className="primary-button" disabled={busy}>{busy ? "Sending…" : "Continue"}</button><div className="auth-links"><Link to="/sign-in">Back to sign in</Link></div></form></main>;
}

function ResetPassword() {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const navigate = useNavigate(); const token = new URLSearchParams(window.location.search).get("token");
  const submit = async (event) => { event.preventDefault(); setError(""); if (!token) { setError("This reset link is missing its token."); return; } if (password.length < 8) { setError("Use at least 8 characters."); return; } if (password !== confirm) { setError("Passwords do not match."); return; } setBusy(true); try { const body = await api("/api/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, password }) }); setNotice(body.message); setTimeout(() => navigate("/sign-in", { replace: true }), 900); } catch (cause) { setError(cause.message); } finally { setBusy(false); } };
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><Brand /><h1>Create a new password</h1><Field label="New password" type="password" value={password} onChange={setPassword} /><Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} />{error && <div className="error-message">{error}</div>}{notice && <div className="success-message">{notice}</div>}<button className="primary-button" disabled={busy}>{busy ? "Updating…" : "Update password"}</button></form></main>;
}

function Onboarding({ account, onComplete }) {
  const [form, setForm] = useState({ name: account?.name || "", phone: account?.phone || "", team: account?.team || "" });
  return <main className="auth-page"><form className="auth-card" onSubmit={(event) => { event.preventDefault(); onComplete(form); }}><Brand /><h1>Complete your profile</h1><Field label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="Team" value={form.team} onChange={(value) => setForm({ ...form, team: value })} /><button className="primary-button">Finish onboarding</button></form></main>;
}

function Brand() { return <div className="brand"><div className="brand-mark"><Waves size={22} /></div><div><strong>AquaGuardian</strong><span>RESCUE OPERATIONS</span></div></div>; }
function RadarVisual() {
  return <div className="radar-visual" aria-label="Underwater rescue radar animation"><div className="radar-ring radar-ring-one" /><div className="radar-ring radar-ring-two" /><div className="radar-ring radar-ring-three" /><div className="radar-sweep" /><span className="radar-blip radar-blip-one" /><span className="radar-blip radar-blip-two" /><span className="radar-center" /></div>;
}
function RobotCamera({ robot, onDirection }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [lastDirection, setLastDirection] = useState("Center");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setLastDirection("Center");
  };

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported by this browser.");
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (cause) {
      stopCamera();
      if (cause?.name === "NotAllowedError") setCameraError("Camera permission was denied. Allow camera access to enable the simulated feed.");
      else if (cause?.name === "NotFoundError") setCameraError("No camera device was found on this device.");
      else setCameraError("Unable to start the camera. Check browser permissions and try again.");
    }
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const sendDirection = (direction) => {
    setLastDirection(direction);
    onDirection(direction, robot);
  };

  return <div className="camera-console">
    <div className="movement-heading"><strong>Direction controls</strong><span>{cameraOn ? "Camera active" : "Camera required"}</span></div>
    <div className="movement" aria-label={`Direction controls for ${robot.name}`}>
      <button type="button" disabled={!cameraOn} onClick={() => sendDirection("Forward")} aria-label="Move forward">↑</button>
      <button type="button" disabled={!cameraOn} onClick={() => sendDirection("Left")} aria-label="Turn left">←</button>
      <button type="button" disabled={!cameraOn} onClick={() => sendDirection("Stop")} aria-label="Stop robot">■</button>
      <button type="button" disabled={!cameraOn} onClick={() => sendDirection("Right")} aria-label="Turn right">→</button>
      <button type="button" disabled={!cameraOn} onClick={() => sendDirection("Reverse")} aria-label="Move reverse">↓</button>
    </div>
    <div className="camera-preview">
      <video ref={videoRef} muted playsInline autoPlay className={cameraOn ? "camera-live" : ""} />
      {!cameraOn && <div className="camera-placeholder"><Waves size={24} /><strong>Camera preview off</strong><span>Start the laptop camera for a representation feed.</span></div>}
      {cameraOn && <div className="camera-overlay"><span>REPRESENTATION · {robot.id}</span><b>{lastDirection}</b></div>}
    </div>
    <div className="camera-actions">
      <button type="button" className={cameraOn ? "secondary-button" : "primary-button compact"} onClick={cameraOn ? stopCamera : startCamera}>
        {cameraOn ? "Turn camera off" : "Start laptop camera"}
      </button>
    </div>
    {cameraError && <div className="error-message camera-error">{cameraError}</div>}
  </div>;
}
function Field({ label, type = "text", value, onChange }) { return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required /></label>; }

function Shell({ account, workspace, saveWorkspace, saveAccount, signOut, deleteAccount }) {
  const location = useLocation(); const navigate = useNavigate(); const view = location.pathname.split("/").pop() || "app";
  const [mobileOpen, setMobileOpen] = useState(false); const [selectedId, setSelectedId] = useState(workspace.robots[0]?.id || ""); const [profileNotice, setProfileNotice] = useState("");
  const [dialog, setDialog] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [robotForm, setRobotForm] = useState({ id: "AG-103", name: "" });
  const [missionForm, setMissionForm] = useState({ location: "", robotId: "" });
  const [alertForm, setAlertForm] = useState({ location: "", severity: "High" });
  const selected = workspace.robots.find((robot) => robot.id === selectedId) || workspace.robots[0];
  const openAlerts = workspace.alerts.filter((alert) => !alert.acknowledged).length;
  const nav = [{ id: "app", label: "Overview", icon: Activity }, { id: "fleet", label: "Robot fleet", icon: Anchor }, { id: "missions", label: "Mission log", icon: Compass }, { id: "alerts", label: "SOS & alerts", icon: Siren }, { id: "account", label: "My account", icon: UserRound }];
  const go = (id) => { navigate(id === "app" ? "/app" : `/app/${id}`); setMobileOpen(false); };
  const openRobotDialog = () => { setRobotForm({ id: "AG-103", name: "" }); setDialog("robot"); };
  const openMissionDialog = () => { setMissionForm({ location: "", robotId: selected?.id || workspace.robots[0]?.id || "" }); setDialog("mission"); };
  const openAlertDialog = () => { setAlertForm({ location: "", severity: "High" }); setDialog("alert"); };
  const recordOperation = (type, title, detail) => ({
    id: `ACT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    type,
    title,
    detail,
    operator: account?.name || "Operator",
    createdAt: new Date().toISOString()
  });
  const addRobot = async (event) => {
    event.preventDefault();
    const id = robotForm.id.trim().toUpperCase(); const name = robotForm.name.trim();
    if (!id || !name) return;
    if (workspace.robots.some((robot) => robot.id === id)) return alert("That robot ID already exists.");
    await saveWorkspace({
      ...workspace,
      robots: [...workspace.robots, { id, name, status: "Docked", addedAt: new Date().toISOString() }],
      operations: [recordOperation("robot_added", "Robot registered", `${name} (${id}) was added to the fleet.`), ...(workspace.operations || [])]
    });
    setSelectedId(id); setDialog(null);
  };
  const addMission = async (event) => {
    event.preventDefault();
    const robot = workspace.robots.find((item) => item.id === missionForm.robotId);
    if (!robot) return alert("Add a robot before creating a mission.");
    if (!missionForm.location.trim()) return;
    await saveWorkspace({
      ...workspace,
      missions: [{ id: `MSN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, robotId: robot.id, robotName: robot.name, location: missionForm.location.trim(), status: "In progress", startedAt: new Date().toISOString(), completedAt: null }, ...workspace.missions],
      robots: workspace.robots.map((item) => item.id === robot.id ? { ...item, status: "Deployed · simulated" } : item),
      operations: [recordOperation("mission_created", "Mission created", `Mission started at ${missionForm.location.trim()} with ${robot.name}.`), ...(workspace.operations || [])]
    });
    setDialog(null);
  };
  const addAlert = async (event) => {
    event.preventDefault();
    if (!alertForm.location.trim()) return;
    await saveWorkspace({
      ...workspace,
      alerts: [{ id: `SOS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, location: alertForm.location.trim(), severity: alertForm.severity, createdAt: new Date().toISOString(), acknowledged: false }, ...workspace.alerts],
      operations: [recordOperation("alert_recorded", "SOS alert recorded", `${alertForm.severity} priority alert at ${alertForm.location.trim()}.`), ...(workspace.operations || [])]
    });
    setDialog(null);
  };
  const logReturn = async () => {
    if (!selected) return;
    await saveWorkspace({
      ...workspace,
      robots: workspace.robots.map((robot) => robot.id === selected.id ? { ...robot, status: "Docked", returnedAt: new Date().toISOString() } : robot),
      operations: [recordOperation("robot_returned", "Robot return logged", `${selected.name} (${selected.id}) was returned to Docked status.`), ...(workspace.operations || [])]
    });
  };
  const sendRobotCommand = async (direction, robot) => {
    const command = {
      id: `CMD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      robotId: robot.id,
      direction,
      representation: true,
      createdAt: new Date().toISOString(),
      operator: account?.name || "Operator"
    };
    await saveWorkspace({
      ...workspace,
      commands: [command, ...(workspace.commands || [])],
      operations: [recordOperation("camera_command", "Direction command sent", `${direction} command sent to ${robot.name} (${robot.id}) using the laptop-camera representation.`), ...(workspace.operations || [])]
    });
  };
  return <div className="app-shell"><aside className={mobileOpen ? "sidebar open" : "sidebar"}><Brand /><button className="mobile-close" onClick={() => setMobileOpen(false)}><X /></button><nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={(view === "app" && id === "app") || view === id ? "nav active" : "nav"} onClick={() => go(id)}><Icon size={17} />{label}{id === "alerts" && openAlerts > 0 && <b>{openAlerts}</b>}</button>)}</nav><div className="sidebar-footer"><button className="operator" onClick={() => go("account")}><UserRound size={18} /><span><strong>{account?.name || "Operator"}</strong><small>{account?.team || "Rescue team"}</small></span></button><button className="signout" onClick={signOut}><LogOut size={16} /> Sign out</button></div></aside>{mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}<main className="main"><header className="topbar"><button className="menu-button" onClick={() => setMobileOpen(true)}><Menu /></button><div>AquaGuardian <span>/</span> {view === "app" ? "Overview" : view}</div><div className="notification-wrap"><button className="notification-button" aria-label="Notifications" onClick={() => setNotificationsOpen((open) => !open)}><Bell size={19} />{(openAlerts + workspace.missions.filter((item) => item.status === "In progress").length) > 0 && <b>{openAlerts + workspace.missions.filter((item) => item.status === "In progress").length}</b>}</button>{notificationsOpen && <div className="notification-panel"><div className="notification-header"><strong>Notifications</strong><button onClick={() => setNotificationsOpen(false)}><X size={16} /></button></div>{workspace.alerts.slice(0, 4).map((alert) => <button className="notification-item" key={alert.id} onClick={() => { setNotificationsOpen(false); go("alerts"); }}><Siren size={16} /><span><strong>{alert.location}</strong><small>{alert.acknowledged ? "Alert acknowledged" : `${alert.severity || "New"} priority alert`}</small></span></button>)}{workspace.missions.filter((item) => item.status === "In progress").slice(0, 3).map((mission) => <button className="notification-item" key={mission.id} onClick={() => { setNotificationsOpen(false); go("missions"); }}><Compass size={16} /><span><strong>{mission.location}</strong><small>Mission in progress · {mission.robotName}</small></span></button>)}{!openAlerts && !workspace.missions.some((item) => item.status === "In progress") && <div className="notification-empty">No new notifications</div>}</div>}</div></header><div className="content">
      {(view === "app") && <><PageHeading eyebrow="OPERATIONS CENTER" title="Overview" description="Current rescue workspace summary" /><div className="stats"><Stat icon={Anchor} label="Registered robots" value={workspace.robots.length} /><Stat icon={Compass} label="Active missions" value={workspace.missions.filter((item) => item.status === "In progress").length} /><Stat icon={ShieldCheck} label="Completed missions" value={workspace.missions.filter((item) => item.status === "Completed").length} /><Stat icon={Bell} label="Open alerts" value={openAlerts} /></div><div className="grid-2"><Panel title="Recent alerts"><Alerts alerts={workspace.alerts} /></Panel><Panel title="Recent missions"><Missions missions={workspace.missions.slice(0, 5)} /></Panel><Panel title="Completed missions"><CompletedMissions missions={workspace.missions} /></Panel></div></>}
      {view === "fleet" && <><PageHeading eyebrow="FLEET MANAGEMENT" title="Robot fleet" description="Local roster and simulated controls" actions={<button className="primary-button compact" onClick={openRobotDialog}><Plus size={16} /> Add robot</button>} /><div className="grid-2 fleet-grid"><Panel title="Registered units">{workspace.robots.length ? workspace.robots.map((robot) => <button className={`list-row ${selected?.id === robot.id ? "selected" : ""}`} key={robot.id} onClick={() => { setSelectedId(robot.id); }}><Waves size={18} /><span><strong>{robot.name}</strong><small>{robot.id}</small></span><b>{robot.status}</b></button>) : <Empty title="No robots" text="Add a robot using its unique ID." />}</Panel><Panel title={selected?.name || "Robot controls"}>{selected ? <><div className="connection">Representation mode only · No hardware connection</div><div className="button-row"><button className="primary-button compact" onClick={openMissionDialog}>Record mission</button><button className="secondary-button" onClick={logReturn}>Log return</button></div><RobotCamera robot={selected} onDirection={sendRobotCommand} /></> : <Empty title="Select a robot" text="Choose a unit or add a new one." />}</Panel></div></>}
      {view === "missions" && <><PageHeading eyebrow="MISSION RECORDS" title="Mission log" description="Operator-maintained rescue records"       actions={<button className="primary-button compact" onClick={openMissionDialog}><Plus size={16} /> New mission</button>} /><Panel title="All missions">{workspace.missions.length ? <div className="table-wrap"><table><thead><tr><th>Mission</th><th>Location</th><th>Robot</th><th>Status</th></tr></thead><tbody>{workspace.missions.map((mission) => <tr key={mission.id}><td>{mission.id}</td><td>{mission.location}</td><td>{mission.robotName}</td><td>      <button className="status-button" onClick={() => mission.status === "In progress" && saveWorkspace({ ...workspace, missions: workspace.missions.map((item) => item.id === mission.id ? { ...item, status: "Completed", completedAt: new Date().toISOString() } : item), operations: [recordOperation("mission_completed", "Mission completed", `${mission.id} at ${mission.location} was completed with ${mission.robotName}.`), ...(workspace.operations || [])] })}>{mission.status}</button></td></tr>)}</tbody></table></div> : <Empty title="No missions" text="Create the first mission record." />}</Panel></>}
      {view === "alerts" && <><PageHeading eyebrow="SOS & ALERTS" title="Alert desk" description="Manually recorded rescue alerts"       actions={<button className="primary-button compact" onClick={openAlertDialog}><Siren size={16} /> Record alert</button>} /><Panel title="Alert queue">{workspace.alerts.length ? workspace.alerts.map((alert) => <div className="alert-row" key={alert.id}><Siren size={17} /><span><strong>{alert.location}</strong><small>{new Date(alert.createdAt).toLocaleString()}</small></span>{!alert.acknowledged ?       <button className="secondary-button" onClick={() => saveWorkspace({ ...workspace, alerts: workspace.alerts.map((item) => item.id === alert.id ? { ...item, acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: account?.name || "Operator" } : item), operations: [recordOperation("alert_acknowledged", "SOS alert acknowledged", `${alert.location} was acknowledged by ${account?.name || "Operator"}.`), ...(workspace.operations || [])] })}>Acknowledge</button> : <b className="acknowledged">Acknowledged</b>}</div>) : <Empty title="No alerts" text="Recorded alerts will appear here." />}</Panel></>}
      {view === "account" && <AccountPage account={account} workspace={workspace} saveAccount={saveAccount} notice={profileNotice} setNotice={setProfileNotice} deleteAccount={deleteAccount} />}
    </div></main>
    {dialog === "robot" && <Modal title="Add rescue robot" onClose={() => setDialog(null)}><form onSubmit={addRobot}><Field label="Robot name" value={robotForm.name} onChange={(value) => setRobotForm({ ...robotForm, name: value })} /><Field label="Unique robot ID" value={robotForm.id} onChange={(value) => setRobotForm({ ...robotForm, id: value })} /><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button compact">Add robot</button></div></form></Modal>}
    {dialog === "mission" && <Modal title="Create mission" onClose={() => setDialog(null)}><form onSubmit={addMission}><Field label="Mission location" value={missionForm.location} onChange={(value) => setMissionForm({ ...missionForm, location: value })} /><label className="field"><span>Robot</span><select value={missionForm.robotId} onChange={(event) => setMissionForm({ ...missionForm, robotId: event.target.value })} required><option value="">Select a robot</option>{workspace.robots.map((robot) => <option key={robot.id} value={robot.id}>{robot.name} — {robot.id}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button compact">Create mission</button></div></form></Modal>}
    {dialog === "alert" && <Modal title="Record SOS alert" onClose={() => setDialog(null)}><form onSubmit={addAlert}><Field label="Alert location" value={alertForm.location} onChange={(value) => setAlertForm({ ...alertForm, location: value })} /><label className="field"><span>Priority</span><select value={alertForm.severity} onChange={(event) => setAlertForm({ ...alertForm, severity: event.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setDialog(null)}>Cancel</button><button className="primary-button compact">Record alert</button></div></form></Modal>}
  </div>;
}

function AccountPage({ account, workspace, saveAccount, notice, setNotice, deleteAccount }) {
  const navigate = useNavigate(); const [form, setForm] = useState({ name: account?.name || "", phone: account?.phone || "", team: account?.team || "" });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    try { await saveAccount(form); setEditing(false); setNotice("Account details saved."); }
    catch (cause) { setNotice(cause.message || "Unable to save account details."); }
    finally { setSaving(false); }
  };
  const operations = workspace?.operations || [];
  const [activityDate, setActivityDate] = useState("");
  const cancelEdit = () => { setForm({ name: account?.name || "", phone: account?.phone || "", team: account?.team || "" }); setEditing(false); setNotice(""); };
  const localDateKey = (value) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const filteredOperations = operations
    .filter((operation) => !activityDate || localDateKey(operation.createdAt) === activityDate)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const groupedOperations = filteredOperations.reduce((groups, operation) => {
    const key = localDateKey(operation.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(operation);
    return groups;
  }, {});
  const formatDay = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return <>
    <PageHeading eyebrow="OPERATOR SETTINGS" title="My account" description="Manage profile details, security, and operation history" />
    <div className="grid-2">
      <section className="panel">
        <div className="profile-header"><h2>Profile</h2>{!editing && <button type="button" className="secondary-button compact" onClick={() => { setNotice(""); setEditing(true); }}>Edit profile</button>}</div>
        {editing ? <form onSubmit={submit}><Field label="Full name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="Team" value={form.team} onChange={(value) => setForm({ ...form, team: value })} /><label className="field"><span>Email</span><input type="email" value={account?.email || ""} readOnly /></label><div className="profile-actions"><button type="button" className="secondary-button" onClick={cancelEdit}>Cancel</button><button className="primary-button compact" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></form> : <div className="profile-details"><div><span>Full name</span><strong>{account?.name || "Not set"}</strong></div><div><span>Phone</span><strong>{account?.phone || "Not set"}</strong></div><div><span>Team</span><strong>{account?.team || "Not set"}</strong></div><div><span>Email</span><strong>{account?.email || "Not set"}</strong></div></div>}
        {notice && <div className="success-message">{notice}</div>}
      </section>
      <div className="panel"><h2>Account security</h2><p>Email status: <strong>{account?.emailVerified ? "Verified" : "Not verified"}</strong></p><button className="secondary-button" onClick={() => navigate("/forgot-password")}>Reset password</button><button className="danger-button" onClick={deleteAccount}>Delete account</button></div>
    </div>
    <section className="panel activity-panel">
      <div className="activity-header">
        <div><h2>Account activity</h2><p>Operations recorded for {account?.name || "this operator"}</p></div>
        <label className="activity-date-filter"><span>Filter by date</span><input type="date" value={activityDate} onChange={(event) => setActivityDate(event.target.value)} /></label>
      </div>
      {activityDate && <div className="activity-filter-summary"><span>{filteredOperations.length} {filteredOperations.length === 1 ? "activity" : "activities"} on {formatDay(activityDate)}</span><button type="button" onClick={() => setActivityDate("")}>Clear date</button></div>}
      {filteredOperations.length ? Object.keys(groupedOperations).sort((a, b) => b.localeCompare(a)).map((key) => <div className="activity-day" key={key}>
        <div className="activity-day-heading"><span>{formatDay(key)}</span><b>{groupedOperations[key].length}</b></div>
        {groupedOperations[key].map((operation) => <div className="activity-row" key={operation.id}>
          <div className="activity-icon">{operation.type === "robot_returned" ? <Anchor size={17} /> : operation.type?.includes("mission") ? <Compass size={17} /> : operation.type?.includes("alert") ? <Siren size={17} /> : <ShieldCheck size={17} />}</div>
          <div><strong>{operation.title}</strong><p>{operation.detail}</p><small>{operation.operator} · {new Date(operation.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</small></div>
        </div>)}
      </div>) : <Empty title={activityDate ? "No activity on this date" : "No recorded operations"} text={activityDate ? "Choose another date or clear the filter." : "Robot, mission, return, alert, and completion actions will appear here."} />}
    </section>
  </>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</section></div>;
}

function PageHeading({ eyebrow, title, description, actions }) { return <div className="page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions}</div>; }
function Stat({ icon: Icon, label, value }) { return <div className="stat"><Icon /><span>{label}<strong>{value}</strong></span></div>; }
function Panel({ title, children }) { return <section className="panel"><h2>{title}</h2>{children}</section>; }
function Empty({ title, text }) { return <div className="empty"><strong>{title}</strong><span>{text}</span></div>; }
function Alerts({ alerts }) { return alerts.length ? alerts.slice(0, 5).map((alert) => <div className="mini-row" key={alert.id}><span><strong>{alert.location}</strong><small>{new Date(alert.createdAt).toLocaleString()}</small></span><b>{alert.acknowledged ? "Acknowledged" : "Open"}</b></div>) : <Empty title="No alerts" text="Your rescue alert queue is clear." />; }
function Missions({ missions }) { return missions.length ? missions.map((mission) => <div className="mini-row" key={mission.id}><span><strong>{mission.robotName}</strong><small>{mission.location}</small></span><b>{mission.status}</b></div>) : <Empty title="No missions" text="Mission activity will appear here." />; }
function CompletedMissions({ missions }) {
  const completed = missions.filter((mission) => mission.status === "Completed").sort((a, b) => new Date(b.completedAt || b.startedAt) - new Date(a.completedAt || a.startedAt));
  return completed.length ? completed.slice(0, 6).map((mission) => <div className="mini-row" key={mission.id}><span><strong>{mission.robotName}</strong><small>{mission.location}</small></span><b>{mission.completedAt ? new Date(mission.completedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "Completed"}</b></div>) : <Empty title="No completed missions" text="Completed mission records will appear here." />;
}
function Legal({ title, body }) { return <main className="auth-page"><section className="auth-card"><Brand /><h1>{title}</h1><p>{body}</p><Link className="primary-button text-button" to="/app">Return to app</Link></section></main>; }
function NotFound() { return <main className="auth-page"><section className="auth-card"><Brand /><h1>404 — Page not found</h1><p>The page you requested does not exist.</p><Link className="primary-button text-button" to="/">Return home</Link></section></main>; }

export default App;
