# BugTracker Frontend Web Application

The frontend single page application for the Bug / Issue Tracking System (**PPofSE** project), featuring a **Material Design 3 Expressive** aesthetic inspired by Google Pixel OS.

For full architectural details, component breakdowns, and security specifications, see:
- [Frontend Service Documentation](file:///home/finkord/dev/PPofSE/software/info/services/frontend/README.md)
- [Backend Authentication Service Documentation](file:///home/finkord/dev/PPofSE/software/info/services/auth/README.md)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
# Or with network exposure:
npm run dev -- --host
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser. All requests to `/api` are automatically proxied to the NestJS backend at `http://localhost:3000`.

### 3. Production Build
```bash
npm run build
```

### 4. Code Quality & Linting
```bash
npm run lint
```

---

## Core Features
- **Design System:** Material Design 3 Expressive with dynamic Dark / Light themes, Google Pixel curves (`rounded-[28px]`, `rounded-[22px]`), and high-contrast readable typography.
- **Dual OAuth2 Providers:** Native buttons and callback routing for **GitHub OAuth** and **Google OAuth**, plus an offline Mock OAuth simulator.
- **OAuth Password Setup:** Allows accounts created via OAuth to establish an Argon2id password from the Profile page for dual-authentication support.
- **Two-Factor Authentication (TOTP):** In-app QR code pairing modal and login challenge prompt compatible with Google Authenticator, Authy, and Microsoft Authenticator.
- **Security Protections:** Real-time 5-criteria password strength meter, CAPTCHA bot protection widget, and brute-force lockout countdown timers.
- **Forensic Security Center:** Live audit logs for administrators (`/admin/security-logs`) with client IP inspection and account blocking controls.
