# AquaGuardian

A responsive, local, server-backed rescue-operations workspace. Rescue robot commands are simulations only and do not control hardware.

## Secure local architecture

- Express API, SQLite database, bcrypt password hashes, HTTP-only session cookies, JWT signing, Helmet security headers, and server-side rate limiting.
- SMTP email delivery is optional. Development mode prints verification and reset links in the server console.
- Private configuration and future API keys belong in server environment variables, never in React source or `VITE_` variables.

## Run locally

Start the API server in one terminal:

```powershell
npm.cmd run server
```

Start the Vite interface in a second terminal:

```powershell
npm.cmd run dev
```

Open `http://localhost:5173`. Use `http://localhost:3001` to run the built production interface directly after `npm.cmd run build`.

For production mode, set server-only environment variables before starting:

```powershell
$env:JWT_SECRET = "replace-with-a-long-random-secret"
$env:NODE_ENV = "production"
$env:APP_ORIGIN = "https://your-domain.example"
$env:SMTP_HOST = "smtp.example.com"
$env:SMTP_PORT = "587"
$env:SMTP_USER = "your-smtp-user"
$env:SMTP_PASS = "server-only-password"
$env:SMTP_FROM = "AquaGuardian <no-reply@your-domain.example>"
npm.cmd start
```

## Production build

```powershell
npm.cmd run build
npm.cmd run preview
```

## Accounts and data

- Sign-up, sign-in, sign-out, email verification, password reset, onboarding, profile editing, and account deletion use the Express API and SQLite database.
- Passwords are salted with bcrypt and session cookies are HTTP-only JWT cookies.
- Verification and reset links expire and are single-use. SMTP settings enable real email delivery; otherwise links are printed in the server console.
- Workspace records are associated with the authenticated server account.
- Set a persistent `JWT_SECRET` and secure database backup procedures before production use.
- Keeping private server configuration outside React and `VITE_` variables is required.

## Features

- Responsive desktop and mobile layout
- Operator sign-up and sign-in
- Local email verification and password reset
- Onboarding and account details
- Robot, mission, and SOS records
- Loading and validation states
- Empty states, custom 404, privacy, and terms pages
- JSON export can be added from the app workspace; browser storage itself is not a database backup

## Safety

Manual deployment and trained rescue supervision remain required. The app does not connect to SOS stations, robots, sensors, cameras, SONAR, acoustic communications, or emergency dispatch systems.
