# BugTracker Frontend Web Application

The frontend single page application for the Bug / Issue Tracking System, featuring a **Material Design 3 Expressive** aesthetic inspired by Google Pixel OS.

For full architectural details, component breakdowns, and design specifications, see:
- [Frontend Architecture Documentation](../documentation/frontend/overview.md)
- [Frontend Route & Page Catalog](../documentation/frontend/pages-and-routing.md)
- [M3 Expressive Design System](../documentation/frontend/design-system.md)
- [Backend Authentication Service Documentation](../documentation/backend/auth.md)

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
- **Dual OAuth2 Providers:** Native integration and callback routing for **GitHub OAuth** and **Google OAuth**.
- **OAuth Password Setup:** Allows accounts created via OAuth to establish an Argon2id password from the Profile page for dual-authentication support.
- **Two-Factor Authentication (TOTP):** In-app QR code pairing modal and login challenge prompt compatible with Google Authenticator, Authy, and Microsoft Authenticator.
- **Security Protections:** Real-time 5-criteria password strength meter, Cloudflare Turnstile CAPTCHA bot protection widget, and brute-force lockout countdown timers.
- **Forensic Security Center:** Live audit logs for administrators (`/admin/security-logs`) with client IP inspection and account blocking controls.
