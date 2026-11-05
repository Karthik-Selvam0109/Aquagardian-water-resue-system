import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3001);
const appOrigin = process.env.APP_ORIGIN || `http://localhost:${port}`;
const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");

fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
const db = new Database(path.join(__dirname, "data", "aquaguardian.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    team TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workspaces (
    user_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS account_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
db.prepare("UPDATE users SET email_verified = 1").run();
db.prepare("DELETE FROM account_tokens WHERE kind = 'verify'").run();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const mutationLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth", authLimiter);
app.use("/api/account", mutationLimiter);

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, team: user.team, emailVerified: Boolean(user.email_verified), onboardingCompleted: Boolean(user.onboarding_completed), createdAt: user.created_at });
const tokenFor = (userId) => jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "12h" });
const cleanEmail = (value) => String(value || "").trim().toLowerCase();

async function sendEmail(to, subject, text, html) {
  if (process.env.SMTP_HOST) {
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transport.sendMail({ from: process.env.SMTP_FROM || "AquaGuardian <no-reply@aquaguardian.local>", to, subject, text, html });
  } else {
    console.info(`[AquaGuardian local email] ${subject}\nTo: ${to}\n${text}`);
  }
}

function requireAuth(req, res, next) {
  const token = req.cookies?.aquaguardian_session;
  if (!token) return res.status(401).json({ error: "Please sign in to continue." });
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub);
    if (!user) return res.status(401).json({ error: "Your session is no longer valid. Please sign in again." });
    req.user = user;
    next();
  } catch {
    res.clearCookie("aquaguardian_session");
    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = cleanEmail(req.body.email);
    const phone = String(req.body.phone || "").trim();
    const team = String(req.body.team || "").trim();
    const password = String(req.body.password || "");
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) return res.status(409).json({ error: "An account with this email already exists." });
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users (id,name,email,phone,team,password_hash,email_verified,onboarding_completed,created_at) VALUES (?,?,?,?,?,?,1,0,?)").run(id, name, email, phone, team, passwordHash, new Date().toISOString());
    db.prepare("INSERT INTO workspaces (user_id,data,updated_at) VALUES (?,?,?)").run(id, JSON.stringify({ robots: [], missions: [], alerts: [], commands: [], operations: [] }), new Date().toISOString());
    res.cookie("aquaguardian_session", tokenFor(id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 12 * 60 * 60 * 1000 });
    res.status(201).json({ message: "Account created.", user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) });
  } catch (error) { next(error); }
});

app.post("/api/auth/signin", async (req, res, next) => {
  try {
    const email = cleanEmail(req.body.email); const password = String(req.body.password || "");
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Email or password is incorrect." });
    res.cookie("aquaguardian_session", tokenFor(user.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 12 * 60 * 60 * 1000 });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

app.post("/api/auth/logout", requireAuth, (req, res) => { res.clearCookie("aquaguardian_session"); res.json({ message: "Signed out." }); });

app.post("/api/auth/password-reset/request", async (req, res, next) => {
  try {
    const email = cleanEmail(req.body.email); const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      db.prepare("DELETE FROM account_tokens WHERE user_id = ? AND kind = 'reset'").run(user.id);
      db.prepare("INSERT INTO account_tokens (id,user_id,kind,expires_at,created_at) VALUES (?,?,?,?,?)").run(token, user.id, "reset", new Date(Date.now() + 60 * 60 * 1000).toISOString(), new Date().toISOString());
      const origin = req.get("origin") || appOrigin;
      const url = `${origin}/reset-password?token=${token}`;
      await sendEmail(email, "Reset your AquaGuardian password", `Reset your password: ${url}`, `<p><a href="${url}">Reset password</a></p>`);
    }
    res.json({ message: "If an account exists for this email, a password reset link has been sent." });
  } catch (error) { next(error); }
});

app.post("/api/auth/password-reset/confirm", async (req, res, next) => {
  try {
    const token = String(req.body.token || ""); const password = String(req.body.password || "");
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
    const row = db.prepare("SELECT * FROM account_tokens WHERE id = ? AND kind = 'reset'").get(token);
    if (!row || new Date(row.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "The reset link is invalid or has expired." });
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(await bcrypt.hash(password, 10), row.user_id);
    db.prepare("DELETE FROM account_tokens WHERE user_id = ? AND kind = 'reset'").run(row.user_id);
    res.json({ message: "Password updated. You can now sign in." });
  } catch (error) { next(error); }
});

app.get("/api/account/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.patch("/api/account/profile", requireAuth, (req, res) => {
  const name = String(req.body.name || "").trim(); const phone = String(req.body.phone || "").trim(); const team = String(req.body.team || "").trim();
  if (!name) return res.status(400).json({ error: "Name is required." });
  db.prepare("UPDATE users SET name = ?, phone = ?, team = ?, onboarding_completed = 1 WHERE id = ?").run(name, phone, team, req.user.id);
  res.json({ user: publicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id)) });
});
app.delete("/api/account/me", requireAuth, (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
  res.clearCookie("aquaguardian_session"); res.json({ message: "Account deleted." });
});

app.get("/api/workspace", requireAuth, (req, res) => {
  const row = db.prepare("SELECT data FROM workspaces WHERE user_id = ?").get(req.user.id);
  res.json({ data: row ? JSON.parse(row.data) : { robots: [], missions: [], alerts: [], commands: [], operations: [] } });
});
app.put("/api/workspace", requireAuth, (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return res.status(400).json({ error: "Workspace data is invalid." });
  db.prepare("INSERT INTO workspaces (user_id,data,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").run(req.user.id, JSON.stringify(req.body), new Date().toISOString());
  res.json({ message: "Workspace saved." });
});

app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use((error, req, res, next) => {
  void next;
  console.error("AquaGuardian server error", error);
  res.status(error.status || 500).json({ error: error.status ? error.message : "An unexpected server error occurred." });
});

if (fs.existsSync(path.join(__dirname, "dist"))) {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("/{*path}", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
}

app.listen(port, "0.0.0.0", () => console.log(`AquaGuardian server listening at http://localhost:${port}`));
