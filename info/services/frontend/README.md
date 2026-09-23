# Frontend Web Application (`software/frontend`) Technical Documentation

This document provides a comprehensive technical guide and architectural reference for the **BugTracker Frontend Single Page Application (SPA)** located in `software/frontend`.

The frontend is built using **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **React Router v7**. The visual design strictly adheres to **Material Design 3 (M3) Expressive** guidelines inspired by the clean, fluid aesthetic of Google Pixel OS.

---

## 1. Architectural Overview

The frontend operates as an independent client application that connects to the NestJS backend via a development proxy configuration:

```
[ Web Browser ]
      │
      ├── ThemeContext (Dark / Light Theme Tokens in CSS Variables)
      ├── AuthContext (Session Tokens, Profile State, RBAC)
      ├── React Router v7 (Public, Protected, Admin Routes)
      │
      ▼
[ Client API Layer ] (software/frontend/src/api/client.ts)
      │
      ▼ Vite Proxy (/api/v1 -> http://localhost:3000)
[ NestJS Backend API ] (software/backend)
```

### Key Architectural Pillars
1. **Material Design 3 Expressive UI:** Features Google Pixel curved surfaces (`rounded-[28px]`, `rounded-[22px]`), dynamic color palettes, tonal elevations, and high-contrast typography.
2. **Persistent Dual-Theme Engine:** Seamless switching between Dark Mode and Light Mode with zero flicker, automatic WebKit autofill styling overrides, and `localStorage` state persistence.
3. **Reactive Session & Identity Context:** Centralized session tokens (`accessToken`, `refreshToken`) management in `AuthContext` with automatic Bearer token injection and profile synchronization.
4. **Resilient OAuth2 Handshake:** Intercepts callbacks from both GitHub and Google OAuth providers on `/oauth/callback`, saves credentials, establishes context, and navigates seamlessly to user profile.
5. **Full SDSecurity Lab 6 Visual Implementation:** Directly surfaces all security controls including real-time password strength meters, bot-protection widgets, TOTP QR setup modals, brute-force lockout timers, and admin audit log dashboards.

---

## 2. Directory Structure

```
software/frontend/
├── index.html                           # Single-page HTML entry point (Inter & Google Sans fonts)
├── package.json                         # Project scripts and dependencies
├── vite.config.ts                       # Vite build configuration with /api reverse proxy
├── src/
│   ├── main.tsx                         # React 19 application bootstrap
│   ├── App.tsx                          # Root layout, router registration & providers
│   ├── index.css                        # Material Design 3 Design System & Theme CSS tokens
│   ├── api/
│   │   └── client.ts                    # Strongly typed API client with fetch & error handling
│   ├── context/
│   │   ├── AuthContext.tsx              # Authentication state, login/logout, user profile provider
│   │   └── ThemeContext.tsx             # Dark / Light theme provider with HTML attribute sync
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx               # Responsive navbar with theme toggle & user pill
│   │   │   └── ProtectedRoute.tsx       # Route guards for authenticated users and Admin RBAC
│   │   └── auth/
│   │       ├── CaptchaWidget.tsx        # Bot prevention CAPTCHA challenge component
│   │       ├── PasswordStrengthMeter.tsx# Real-time 5-criteria password complexity meter
│   │       └── TwoFactorModal.tsx       # TOTP pairing modal with QR code scanning & verification
│   └── pages/
│       ├── HomePage.tsx                 # Landing page showcasing system security capabilities
│       ├── LoginPage.tsx                # Sign-in form, lockout timers, 2FA prompt, OAuth buttons
│       ├── RegisterPage.tsx             # Registration with real-time meter & CAPTCHA widget
│       ├── ActivatePage.tsx             # Cryptographic email token account activation
│       ├── ForgotPasswordPage.tsx       # Password recovery request form
│       ├── ResetPasswordPage.tsx        # Password reset execution form
│       ├── OAuthCallbackPage.tsx        # Universal callback route for GitHub & Google OAuth
│       ├── ProfilePage.tsx              # User dashboard, TOTP management & OAuth password setup
│       └── AdminSecurityAuditPage.tsx   # Admin security forensics center & user account controls
```

---

## 3. Technology Stack & Dependencies

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| `react` & `react-dom` | `^19.2.8` | Next-generation React core with modern concurrency and reactive primitives. |
| `react-router-dom` | `^7.18.4` | Declarative client-side routing, route protection, and search param parsing. |
| `vite` | `^8.3.0` | Ultra-fast build tool and local development server. |
| `@tailwindcss/vite` & `tailwindcss` | `^4.3.3` | Utility-first CSS framework (Tailwind CSS v4 engine). |
| `lucide-react` | `^1.47.0` | Modern, consistent icon library used across all components. |
| `canvas-confetti` | `^1.9.4` | Micro-animation library for celebration effects upon successful email activation. |
| `typescript` | `~6.0.2` | Strict type safety for components, interfaces, and API contracts. |

---

## 4. Design System & Theme Engine (Material Design 3 Expressive)

The application styling is defined in `src/index.css` using CSS custom properties matching official Google Material 3 tokens:

### 1. Theme Color Tokens

```css
:root {
  /* Light Theme (Default clean MD3 surface) */
  --md-sys-color-background: #f8f9fc;
  --md-sys-color-on-background: #191c1e;
  --md-sys-color-surface: #ffffff;
  --md-sys-color-surface-container: #edf1f7;
  --md-sys-color-surface-container-high: #e2e7ef;
  --md-sys-color-primary: #0b57d0;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #d3e3fd;
  --md-sys-color-on-primary-container: #041e49;
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-error-container: #ffdad6;
  --md-sys-color-success: #146c2e;
  --md-sys-color-success-container: #c4eed0;
}

[data-theme='dark'] {
  /* Dark Theme (Pixel Deep Surface) */
  --md-sys-color-background: #0f141c;
  --md-sys-color-on-background: #e1e2e8;
  --md-sys-color-surface: #171d26;
  --md-sys-color-surface-container: #1b222d;
  --md-sys-color-surface-container-high: #242c3a;
  --md-sys-color-primary: #a8c7fa;
  --md-sys-color-on-primary: #062e6f;
  --md-sys-color-primary-container: #0842a0;
  --md-sys-color-on-primary-container: #d3e3fd;
  --md-sys-color-error: #ffb4ab;
  --md-sys-color-error-container: #93000a;
  --md-sys-color-success: #6dd58c;
  --md-sys-color-success-container: #0a5322;
}
```

### 2. High-Contrast Input Readability & WebKit Autofill Overrides
To ensure that light mode input fields remain clear and legible even when the browser applies autofill styles, `src/index.css` defines explicit WebKit overrides:

```css
.m3-input {
  background-color: var(--md-sys-color-surface-container);
  color: #111318; /* High contrast charcoal in light mode */
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: 16px;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

[data-theme='dark'] .m3-input {
  color: #f1f3f8;
}

/* Override WebKit yellow/blue autofill backgrounds */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: #111318 !important;
  -webkit-box-shadow: 0 0 0px 1000px var(--md-sys-color-surface-container) inset !important;
}
```

---

## 5. Security & Authentication Features

### Task 1: Real-Time Password Policy Meter (`PasswordStrengthMeter.tsx`)
- Validates the password against all 5 criteria in real time:
  1. 8+ Characters
  2. Uppercase Letter (`[A-Z]`)
  3. Lowercase Letter (`[a-z]`)
  4. Numeric Digit (`[0-9]`)
  5. Special Symbol (`[@$!%*?&^#()_+-=...]`)
- Displays an animated strength bar (`Weak`, `Moderate`, `Strong & Compliant`) with interactive badge indicators.

### Task 2: Bot Prevention Widget (`CaptchaWidget.tsx`)
- Renders the official **Cloudflare Turnstile** widget (Site Key: `0x4AAAAAAFBDW7LqZnzsV119`).
- Features dynamic theme synchronization (`theme: 'light' | 'dark'`), automatically adapting widget appearance when the user switches the application theme.
- Submits generated cryptographic tokens with registration for backend server-side verification against Cloudflare's `/siteverify` API.
- Fully fail-closed in production mode.

### Task 3: Email Account Activation (`ActivatePage.tsx`)
- Handles incoming URL links containing cryptographic tokens (`/activate?token=...`).
- Communicates with `GET /api/v1/auth/activate`.
- Strict activation model: unactivated accounts are prevented from signing in (`401 Unauthorized`).
- Launches a colorful confetti animation upon successful account verification and redirects to `/login`.
- Zero secret leakage: registration never reveals tokens in responses; real emails are delivered via Mailpit (`http://localhost:8025`).

### Task 4: Brute-Force Lockout Defense (`LoginPage.tsx`)
- Listens for HTTP 401 lockout responses (`ACCOUNT_LOCKED`).
- Automatically starts a live countdown timer (`Account locked. Try again in X seconds.`).
- Disables the submit button until the lockout duration expires.

### Task 5: Two-Factor Authentication (TOTP)
- **Pairing Modal (`TwoFactorModal.tsx`):**
  - Calls `POST /api/v1/auth/2fa/generate` to receive a Base32 secret and QR code Data URL.
  - Displays the QR code for scanning with Google Authenticator or Authy.
  - Requires a 6-digit passcode submission to `POST /api/v1/auth/2fa/enable` before activating.
- **Login Challenge:**
  - When a user with 2FA enabled signs in, the form transforms into a Two-Step Verification screen.
  - Prompts for the 6-digit TOTP code and completes login via `POST /api/v1/auth/2fa/verify`.

### Task 6: Federated OAuth2 & Account Password Setup
- **Multi-Provider OAuth:**
  - Dedicated buttons for **GitHub OAuth** (`/api/v1/auth/github`) and **Google OAuth** (`/api/v1/auth/google`) using authentic SVG brand icons.
  - Development-only **Simulate Mock OAuth** button (`import.meta.env.DEV`), completely excluded from production builds.
- **OAuth Callback Route (`OAuthCallbackPage.tsx`):**
  - Handles redirects from the backend callback endpoints.
  - Extracts JWT `accessToken` and `refreshToken` from URL query parameters.
  - Initializes the user session in `AuthContext` and navigates directly to `/profile`.
- **Password Management for OAuth Accounts (`ProfilePage.tsx`):**
  - When an account is created via OAuth, `user.hasPassword` is `false`.
  - The profile page displays an **"Account Password"** card with status **`NOT SET (OAUTH)`** and a **"Set Account Password"** button.
  - Users can set an Argon2id password without entering a current password.
  - Once set, the account supports **dual-login**: the user can sign in with either OAuth or their email and password!
  - Users who already have a password can change it at any time by confirming their current password.

### Task 7: Password Recovery Flow (`ForgotPasswordPage.tsx` & `ResetPasswordPage.tsx`)
- Dedicated UI to request a 15-minute password reset link.
- Token-based reset page with real-time password strength validation.

### Forensic Security Center (`AdminSecurityAuditPage.tsx`)
- Reserved for users with the `ADMIN` role (`<AdminRoute>`).
- Features real-time inspection of forensic audit records (`login_audit_logs`).
- Displays client IP addresses, User-Agent strings, status tags (`SUCCESS`, `FAILED_PASSWORD`, `ACCOUNT_LOCKED`, `TWO_FACTOR_FAILED`), and failure reasons.
- Provides one-click administrative actions to **Block** or **Unblock** user accounts.

---

## 6. Page Routing Catalog

| Route Path | Component | Access Guard | Description |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | System security feature showcase, architecture overview, and quick links. |
| `/login` | `LoginPage` | Public | Credentials sign-in, lockout timer, 2FA challenge, GitHub, Google & Mock OAuth. |
| `/register` | `RegisterPage` | Public | User registration with live password policy meter and Turnstile CAPTCHA widget. |
| `/activate` | `ActivatePage` | Public | Handles email token activation links with celebration animations. |
| `/forgot-password` | `ForgotPasswordPage`| Public | Requests 15-minute password recovery email. |
| `/reset-password` | `ResetPasswordPage` | Public | Validates reset token and sets new compliant password. |
| `/oauth/callback` | `OAuthCallbackPage` | Public | Intercepts OAuth redirects from GitHub/Google, stores tokens, loads session. |
| `/profile` | `ProfilePage` | Protected | User overview, 2FA TOTP activation/deactivation, OAuth password configuration. |
| `/admin/security-logs`| `AdminSecurityAuditPage`| Admin Only | Forensic login attempt logs, IP inspection, user account blocking/unblocking. |

---

## 7. Development & Production Regimes

### Prerequisites
- Node.js v24 LTS (or v20+)
- NestJS Backend running on `http://localhost:3000`

### 1. Install Dependencies
```bash
cd software/frontend
npm install
```

### 2. Start Development Server (Hot-Reload)
```bash
npm run dev
# Or expose to local network:
npm run dev -- --host
```
The application will be available at **[http://localhost:5173](http://localhost:5173)**. All requests prefixed with `/api` are automatically forwarded to `http://localhost:3000` via the Vite reverse proxy.

### 3. Build & Preview Production Bundle
```bash
# 1. Build optimized distribution bundle:
npm run build

# 2. Preview production bundle locally:
npm run preview -- --port 5173
```
Executes `tsc -b` for strict type checking followed by `vite build`. Output assets are optimized and saved to `software/frontend/dist/`.

### 4. Code Quality & Linting
```bash
npm run lint
```
Runs high-speed linting using `oxlint`.

