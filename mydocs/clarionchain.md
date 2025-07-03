# ClarionChain Project Documentation

## Overview
ClarionChain is a next-generation Bitcoin on-chain analytics and AI insights platform. It provides real-time, professional-grade charting, statistical analysis, and AI-powered insights for both casual users and professional analysts. The platform connects to a BRK (Bitcoin Research Kit) instance to pull advanced Bitcoin on-chain metrics and delivers actionable insights through a modern, dark-mode web interface.

## High-Level Objective
- Deliver a seamless, modern, and responsive web app for Bitcoin analytics and AI-driven insights.
- Integrate with a BRK instance for real-time, advanced on-chain data.
- Provide a professional user experience with customizable dashboards, advanced charting, and AI chat/analysis features.

## Tech Stack
- **Frontend Framework:** Next.js (v15+)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui, Radix UI
- **Icons:** Lucide React
- **Charting:** Chart.js (with react-chartjs-2), chartjs-plugin-zoom, chartjs-adapter-date-fns
- **AI Integration:** OpenAI (GPT-4), Anthropic (Claude) (user provides API keys)
- **State Management:** React hooks (useState, useEffect, useRef)
- **Other Libraries:** class-variance-authority, clsx, tailwind-merge
- **Deployment:** Vercel (or self-hosted)

## Project Structure
```
clarionchain/
├── mydocs/                  # Custom documentation (this file and others)
├── public/                  # Static assets (logo, icons, etc.)
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── layout.tsx       # Root layout with sidebar
│   │   ├── page.tsx         # Dashboard page
│   │   └── ai-workbench/    # AI Workbench page
│   └── components/          # Shared React components (Sidebar, etc.)
├── package.json             # Project dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.mjs       # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
└── ...
```

## Tech Stack Design & Configuration
### Next.js & TypeScript
- Uses the App Router (`src/app/`) for routing and layouts.
- All pages and components are written in TypeScript with strict type checking.
- SSR and dynamic imports are used for performance and safety.

### Tailwind CSS
- Configured in `tailwind.config.js` and imported in `src/app/globals.css`.
- All styling is done using Tailwind utility classes for rapid, consistent design.
- Dark mode is enforced by default (backgrounds are always black, text is always white).

### shadcn/ui & Radix UI
- Used for layout primitives, accessibility, and consistent UI patterns.
- Sidebar and layout reference shadcn/ui dashboard structure for spacing and responsiveness.

### Charting
- Chart.js is used for all data visualizations, with react-chartjs-2 for React integration.
- Plugins like chartjs-plugin-zoom and chartjs-adapter-date-fns enable advanced features (zoom, pan, date axes).
- All chart components are dynamically imported to ensure SSR safety.

### Icons
- Lucide React provides all sidebar and UI icons.

### AI Integration
- OpenAI and Anthropic APIs are integrated for AI-powered chart analysis and chat.
- Users provide their own API keys via the UI.

### State Management
- React hooks are used for all state (no external state management library).
- Each page fetches and manages its own data, passing it down to components as needed.

### Deployment
- Designed for Vercel, but can be self-hosted.
- Environment variables are managed via `.env.local` (not committed).

## Step-by-Step: Recreate This App from Scratch
1. **Clone the repository:**
   ```sh
   git clone https://github.com/tjw74/clarionchain.git
   cd clarionchain
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up Tailwind CSS:**
   - Tailwind is already configured in `tailwind.config.js` and imported in `src/app/globals.css`.
4. **Project structure:**
   - All pages are in `src/app/` (App Router).
   - Sidebar is in `src/components/Sidebar.tsx`.
   - Custom documentation is in `mydocs/`.
5. **Add your logo:**
   - Place your logo in `public/clarion_chain_logo.png` (or update the path in Sidebar).
6. **Run the development server:**
   ```sh
   npm run dev
   ```
   - Open [http://localhost:3000](http://localhost:3000) to view the app.
7. **Configure AI keys and BRK endpoint:**
   - Add your API keys and BRK endpoint in the UI or `.env.local` as needed.
8. **Deploy:**
   - Deploy to Vercel or your preferred platform.

## Keeping This Document Updated
- **Update this file after any major architectural, tech stack, or configuration change.**
- Document new features, dependencies, or changes to the project structure.
- This file is intended for both human developers and LLMs to fully understand and reproduce the project.

---

_Last updated: July 2024_ 