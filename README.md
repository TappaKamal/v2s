# LifeSaver: AI-Powered Productivity & Wellness Coach 🌿

LifeSaver is a next-generation, full-stack productivity and wellness application designed to help users organize their lives with the intelligent guidance of an AI companion. Built with cutting-edge web technologies, it features a premium, responsive glassmorphism UI and a highly secure architecture.

## 🚀 Key Features

### 🧠 Intelligent AI Assistant (Powered by Gemini)
- **Context-Aware Chat:** A persistent, floating AI chat assistant named "LifeSaver" that can converse with users, analyze their daily load, and offer actionable advice.
- **Smart Prioritization:** Automatically evaluates and re-orders tasks based on deadlines, effort, and user context.
- **Goal Decomposition:** Breaks down large, intimidating goals into manageable, step-by-step milestones automatically.

### 📅 Core Productivity Modules
- **Task Management:** Create, track, and categorize daily tasks with AI priority scoring.
- **Calendar & Scheduling:** Visual time-blocking interface to map out the perfect day.
- **Goal Tracking:** Long-term goal monitoring with visual progress bars and milestone tracking.
- **Habit Builder:** Establish daily routines with visual streak counters and frequency tracking.

### 🔐 Enterprise-Grade Security
- **Custom Authentication Engine:** Built-in secure authentication without relying on third-party providers.
- **Cryptographic Sessions:** Uses cryptographically signed, HTTP-only session cookies to prevent tampering.
- **Secure Password Reset:** A seamless, single-page OTP (One-Time Password) verification wizard for account recovery.

## 🛠️ Technology Stack

### Frontend & Core Framework
- **Framework:** Next.js 14+ (App Router, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Green/Teal design system with Glassmorphism)
- **Icons:** Lucide React

### Database & Backend
- **Database:** Turso (Edge SQLite)
- **ORM:** Drizzle ORM
- **AI Integration:** Google Generative AI SDK (`@google/genai`)
- **Microservices:** Python (FastAPI) located in the `/ai` directory for advanced ML extensions.

### Deployment & DevOps
- **Hosting:** Vercel (Auto-configured with root directory optimization)
- **Environments:** Seamlessly falls back to local `/tmp` SQLite databases if Edge variables are missing to prevent serverless crashes.

## 📦 Project Structure

```text
/
├── src/
│   ├── app/                 # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── actions/         # Secure Server Actions (Auth, Tasks, Goals)
│   │   ├── auth/            # Authentication Pages (Sign in, Sign up, Forgot Password)
│   │   ├── dashboard/       # Protected Application Views
│   │   └── api/             # Next.js Route Handlers
│   ├── components/          # Reusable UI Components & UI Library
│   ├── db/                  # Drizzle ORM Schema & Database Connection
│   └── lib/                 # Core utilities (Auth logic, Gemini AI configuration)
├── ai/                      # Python FastAPI Backend (Virtual Environment & ML scripts)
└── package.json             # Root dependencies (Optimized for Vercel auto-deployment)
```

## 🔒 Security Best Practices Implemented
1. **Password Hashing:** SHA-256 cryptographic hashing for all stored credentials.
2. **Anti-Spoofing OTP:** Password resets require email-OTP pairing to prevent token injection.
3. **Session Validation:** All protected routes are secured via a robust Edge-compatible `proxy.ts` middleware.
4. **Email Enumeration Prevention:** Password reset endpoints return success regardless of email existence to protect user privacy.
