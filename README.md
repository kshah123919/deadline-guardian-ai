# 🛡️ Deadline Guardian AI

<div align="center">

### *Proactively preventing missed deadlines by intelligently planning, prioritizing, and rescuing overloaded schedules.*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini_API](https://img.shields.io/badge/Gemini_API-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License:_MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📖 Table of Contents

- [🛡️ Deadline Guardian AI](#️-deadline-guardian-ai)
  - [📖 Table of Contents](#-table-of-contents)
  - [🚨 The Problem & The Solution](#-the-problem--the-solution)
    - [The Hackathon Problem Statement](#the-hackathon-problem-statement)
    - [The Solution: Deadline Guardian AI](#the-solution-deadline-guardian-ai)
  - [⚙️ Tech Stack](#️-tech-stack)
  - [🌟 Core Features](#-core-features)
    - [🔐 Authentication \& User Session Management](#-authentication--user-session-management)
    - [📋 Live Sync Task Manager](#-live-sync-task-manager)
    - [📊 Intelligent Unified Dashboard](#-intelligent-unified-dashboard)
    - [⚡ Core Innovation: Guardian Rescue Plan](#-core-innovation-guardian-rescue-plan)
    - [🧠 Gemini-Powered AI Assistant](#-gemini-powered-ai-assistant)
    - [⏱️ Deep Focus Mode](#️-deep-focus-mode)
    - [📈 Interactive Analytics Engine](#-interactive-analytics-engine)
    - [📅 Interactive Calendar Planner](#-interactive-calendar-planner)
  - [💡 Why It’s Unique: The Innovation Deep Dive](#-why-its-unique-the-innovation-deep-dive)
  - [🏗️ System Architecture](#️-system-architecture)
  - [📂 Project Directory Structure](#-project-directory-structure)
  - [🔧 Setup and Installation](#-setup-and-installation)
    - [Prerequisites](#prerequisites)
    - [Installation Steps](#installation-steps)
    - [Environment Variables Config (`.env`)](#environment-variables-config-env)
  - [📸 Screenshots](#-screenshots)
  - [🚀 Future Roadmap](#-future-roadmap)
  - [👨💻 Author](#-author)
  - [📄 License](#-license)

---

## 🚨 The Problem & The Solution

### The Hackathon Problem Statement

Students, busy professionals, and entrepreneurs routinely battle overloaded schedules. Inevitably, they miss critical deadlines—assignments, job interviews, bill payments, client deliverables, or milestone reviews. 

The core issue with traditional productivity solutions (calendars, reminder apps, Kanban boards) is their **passive nature**. They send alerts when a task is already overdue or hours away from failure, but do nothing to help the user recover. When a user realizes they are double-booked or under-resourced, they experience cognitive paralysis. They lack the tools to dynamically reschedule, adjust commitments, or execute a realistic recovery path.

```
[Traditional System] ──► Overloaded Schedule ──► Passive Alarm ──► Panic & Missed Deadline ❌
```

### The Solution: Deadline Guardian AI

**Deadline Guardian AI** shifts productivity from passive tracking to active intervention. It acts as an autonomous cockpit that not only alerts users of impending bottlenecks, but proactively reorganizes schedules, introduces deep focus blocks, sets up safety buffers, and generates step-by-step recovery plans to ensure high-priority deliverables are secured.

```
[Deadline Guardian]  ──► Risk Predictor Engine ──► AI Rescue Plan ──► Dynamic Reorganization ──► Completed Tasks ✅
```

---

## ⚙️ Tech Stack

| Layer | Technology | Key Capabilities / Utilities |
| :--- | :--- | :--- |
| **Frontend UI** | **React 18 + TypeScript** | Strongly typed components, stateful views, high performance |
| **Styling** | **Tailwind CSS** | Responsive utilities, CSS-variable-driven custom themes |
| **Animations** | **Motion (`motion/react`)** | Staggered animations, smooth transitions, layout-id morphs |
| **Icons** | **Lucide React** | Consistent, polished, and lightweight modern vector icons |
| **Backend** | **Node.js + Express** | High-performance custom backend handling AI API routing |
| **Database** | **Cloud Firestore** | NoSQL cloud database, sub-collection queries, real-time sync |
| **Auth** | **Firebase Auth** | Secure Google Sign-In, profile storage, persistent session states |
| **AI Brain** | **Gemini API** | Advanced reasoning, layout analysis, context-aware scheduling |

---

## 🌟 Core Features

### 🔐 Authentication & User Session Management
- **Google OAuth Integration:** Secure, instant profile onboarding.
- **Persistent Sessions:** Uses standard web tokens to maintain authentication across browser refreshes.
- **Profile Customization:** User-configurable daily start/end times, weekly focus hours, and personalized goals.

### 📋 Live Sync Task Manager
- Full CRUD operations synced in real-time with Google Cloud Firestore.
- Dynamic attributes: Titles, due dates, estimated minutes, categories, and priority levels (`High`, `Medium`, `Low`).
- Search and multi-criteria filters (category, priority, completion status) to instantly isolate high-risk work.

### 📊 Intelligent Unified Dashboard
- **Productivity Score (0-100):** Formulated from completion rates, priority ratios, focus consistency, and overdue penalties.
- **Mission Control Engine:** Live automated pipeline analyzing workspace workloads.
- **Workload Meter:** Visually maps cognitive saturation (Light, Balanced, Heavy, Danger) with recommendations.

---

### ⚡ Core Innovation: Guardian Rescue Plan

This is the application's flagship feature, designed to rescue users from catastrophic schedule collapses.

```
                          [ WORKSPACE SENSING ]
                 Detects: Overdue | Overloaded | Conflict
                                    │
                                    ▼
                       [ GUARDIAN RESCUE ENGINE ]
                Recovers: Reorders | Generates Buffers
                                    │
                                    ▼
                [ INTERACTIVE BEFORE VS AFTER WORKSPACE ]
             Visual comparison, optimization rationale, Undo
```

- **Sensing Engine:** Actively detects impossible workloads, overlapping timelines, missed milestones, and excessive task hours in a single day.
- **Dynamic Re-allocation:** Generates optimized morning sprint plans, builds dedicated Deep Focus Blocks, inserts recovery buffers, and spreads lower-priority work to secondary slots.
- **Preserves Data Integrity:** Unlike chaotic auto-schedulers, Guardian **never deletes** your tasks. It moves and transforms them transparently.
- **Before-vs-After Comparison Screen:** Users can inspect previous and newly proposed schedules side-by-side with logical, human-readable explanations explaining every single modification.
- **Undo / Committal Actions:** Full historic transaction management. Users can safely revert any generated rescue plan back to their original calendar layout with a single click.

---

### 🧠 Gemini-Powered AI Assistant
- Powered by the `@google/genai` TypeScript SDK.
- Feed-forwarding: Sends structured Firestore document snapshots (including titles, durations, categories, priorities, deadlines, and completion states) directly into Gemini's high-context window.
- **Analyze My Day & Smart Prioritization:** Computes immediate recommendations, prioritizes tasks based on real complexity, and acts as an interactive coach directly within the app's chat portal.

---

### ⏱️ Deep Focus Mode
An elegant distraction-shield workspace allowing users to enter high-attention states.
- **Telemetry Recording:** Focus sessions run a local state engine that tracks focus duration, browser focus losses, manual pauses, and interruption counts.
- **Intelligent Focus Efficiency Rating:** Formula-driven metrics calculating performance based on distraction frequency.
- **Historic Reports:** Generates post-session reports instantly committed to Firestore.
- **Context-Aware Voice Guidance:** An advanced voice assistant that intelligently detects when the user leaves and returns to the application during an active focus session. Instead of repeating a generic reminder, the assistant responds dynamically with encouraging, professional, and adaptive feedback:
  - **Absence < 30 seconds:** No voice trigger (unobtrusive design).
  - **Absence 30s - 2m:** *"Welcome back. Let's continue your [Task Name] task."*
  - **Absence 2m - 10m:** *"You were away for [X minutes]. Your focus session is still active. Let's get back to [Task Name]."*
  - **Absence > 10m:** *"You've been away for [X minutes]. Resume your focus session to stay on schedule."*
  - **Session ends while away:** *"Your focus session for [Task Name] ended while you were away. Ready to start another session?"*
  - **Task completed:** *"Welcome back! Great job completing [Task Name]. What's next?"*

### 🎙️ Smart Focus Monitoring
Deadline Guardian AI continuously monitors the focus session state and browser visibility to provide intelligent voice reminders only when appropriate.
- **Absence Measurement:** Measures the exact duration of browser tab inactivity or focus loss to calibrate the voice intervention dynamically.
- **Minimal Distraction Philosophy:** Avoids annoying or unnecessary alerts, selecting only critical return-to-focus milestones to trigger speech synthesis.
- **Natural Productivity Experience:** Delivers motivational and supportive feedback based on real performance metrics, avoiding aggressive or repetitive phrasing found in traditional trackers.

#### 🎯 Focus Shields Enabled
- [x] Deep Focus Timer & Telemetry
- [x] Focus Efficiency & Interruption Tracking
- [x] Firestore Persistence & Analytics Reports
- [x] Context-Aware Voice Assistant
- [x] Smart Focus Monitoring
- [x] Adaptive Voice Reminders

---

### 📈 Interactive Analytics Engine
Visualizes raw database entries into interactive graphics powered by `Recharts` and `d3`:
- **Workload Velocity Charts:** Weekly completion trends.
- **Completion Distributions:** Categorized productivity breakdowns.
- **Focus Performance Index:** Highlights distraction ratios and focus time over consecutive days.

---

### 📅 Interactive Calendar Planner
- Combines classical multi-view planning calendars (Weekly/Monthly) with dynamic Guardian-scheduled slots.
- Tasks display as responsive tiles mapped strictly to their real deadlines.

---

## 💡 Why It’s Unique: The Innovation Deep Dive

Most productivity apps act as **passive digital paper**. They record what you put in them, and scream when you fail. If you input 12 hours of high-concentration tasks into a single 8-hour workday, standard calendar apps will simply overlap the boxes, creating a messy, unreadable interface without flagging the physical impossibility of the schedule.

```
┌────────────────────────────────────────────────────────┐
│               THE PARADIGM SHIFT                       │
├───────────────────────────┬────────────────────────────┤
│   Traditional App         │   Deadline Guardian AI     │
├───────────────────────────┼────────────────────────────┤
│ • Passive tracking        │ • Active Risk Sensing      │
│ • Overlaps impossible tasks│ • Resolves schedule conflicts│
│ • Shouts when you fail     │ • Reorganizes schedule     │
│ • Static layout           │ • Interactive Rescue Engine│
└───────────────────────────┴────────────────────────────┘
```

**How the Guardian Rescue Plan Works Behind the Scenes:**
1. **Mathematical Workload Evaluation:** Compares requested task durations against the user’s available working hours.
2. **Conflict Resolution:** Isolates overlapping milestones.
3. **Optimized Strategy Formulation:** Calls our Gemini scheduler to re-group, sequence, and spread out tasks, providing a human-readable argument (e.g., *"Shifted task 'Database Schema' to tomorrow morning because your cognitive load is maxed out today and you need a high-energy window for focus"*).
4. **Interactive Sandbox Preview:** The user sees a split view before finalizing changes to their live database.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │      Client Browser       │
                                  └─────────────┬─────────────┘
                                                │ HTTPS
                                                ▼
                                  ┌───────────────────────────┐
                                  │   Express Backend (Port)  │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
                 ▼                              ▼                              ▼
  ┌─────────────────────────────┐┌─────────────────────────────┐┌─────────────────────────────┐
  │     Firebase Auth SDK       ││     Cloud Firestore SDK     ││      Gemini API (GenAI)     │
  │ (User Session Management)   ││ (Task/Report Synchronization)││ (Workload Analysis Engine)  │
  └─────────────────────────────┘└─────────────────────────────┘└─────────────────────────────┘
```

---

## 📂 Project Directory Structure

```
.
├── firebase-applet-config.json  # App configuration & credentials
├── firebase-blueprint.json      # NoSQL Firestore database schema
├── firestore.rules              # Secure owner-based security definitions
├── metadata.json                # Application permissions & system metadata
├── package.json                 # Project dependencies & scripts
├── server.ts                    # Backend server & Gemini API proxy routing
├── src/
│   ├── App.tsx                  # Main app navigation & sidebar layout
│   ├── index.css                # Global CSS imports with Tailwind CSS @theme
│   ├── main.tsx                 # Client react entry point
│   ├── types.ts                 # Global interface definitions & TypeScript types
│   └── components/
│       ├── Dashboard.tsx        # Dashboard, Mission Control, Risk Predictor
│       ├── CalendarView.tsx     # Weekly & Monthly task visualization
│       ├── TaskList.tsx         # Complete interactive task portal
│       ├── FocusMode.tsx        # Immersive focus workspace & telemetry
│       ├── Analytics.tsx        # Recharts interactive graphs
│       └── Settings.tsx         # Polished profile & theme adjustments
├── tsconfig.json                # TypeScript compilation parameters
└── vite.config.ts               # Vite bundler options
```

---

## 🔧 Setup and Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- A Google Cloud / Firebase project with Firestore and Authentication enabled.
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/krishshah062021/deadline-guardian-ai.git
   cd deadline-guardian-ai
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**
   Create a `.env` file in the root directory (using `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

### Environment Variables Config (`.env`)

```env
# Google Gemini API Access Secret
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web Application Client Configurations
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📸 Screenshots

| Section | Description |
| :--- | :--- |
| **Mission Control Dashboard** | Includes Live Productive Score, Workload Meter, and Pending Tasks. |
| **Guardian Rescue Workspace** | Displays side-by-side Before/After schedule shifts with specific reasons. |
| **Gemini Coach Chat** | Real-time workspace advisor fed with active Firestore collections. |
| **Immersive Focus Workspace** | Fullscreen focus mode displaying real-time telemetry and distraction metrics. |
| **Advanced Data Analytics** | Dynamic charts reflecting workload changes, focus sessions, and completion velocities. |

---

## 🚀 Future Roadmap

- [ ] **Google Workspace Integrations:** Sync task objects instantly with Google Calendar and Gmail to parse deadlines directly from emails.
- [ ] **Mobile Application (React Native):** Create companion apps for Android & iOS to provide local push notifications.
- [ ] **Voice-Activated Workspace Controller:** Interact with your productivity companion using intuitive voice requests.
- [ ] **Wearable API Sync:** Sync with wearable telemetry devices (Fitbit, Apple Watch) to adapt schedule intensity based on physical stress levels.
- [ ] **Automated Team Workspaces:** Multi-agent collaboration where guardians coordinate across team members to prevent collective burnout.

---

## 👨💻 Author

**Krish Shah**

Hackathon Participant • Full Stack Developer • Open Source Contributor

---

## 📄 License

Distributed under the MIT License. See `LICENSE` or click [here](https://opensource.org/licenses/MIT) for more details.

---

<div align="center">
Made with ❤️ for the Hackathon. Proactively protecting your ambitions, one deadline at a time.
</div>
