# SevaPath Frontend

React + Vite + Tailwind CSS responsive web application for SevaPath community volunteer matching platform.

## Features
- **Design System**: Off-white background (`#F8FAFC`), dark navy (`#0F2744`) headers/cards, teal (`#0F9D8A`) actions/matches, and orange (`#F28C28`) highlights.
- **Dual Role Dashboards**: Separate views for Volunteers and Organisations with 1-click demo switcher.
- **Volunteer Profile (Feature 1)**: Interactive editor for skills, causes, availability days/hours, Lucknow neighbourhood coordinates, and travel radius.
- **AI Mission Builder (Feature 2)**: Plain-language prompt generation via Gemini with review & edit form.
- **Deterministic 100-pt Breakdown & Explainable AI (Features 3 & 4)**: Per-factor mini-bars and one-sentence "Why this fits you" personalized explanation.
- **Apply & Select (Feature 5)**: Real-time application workflow, status tracking, candidate invitation, and Primary/Backup role assignments.

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   App will be live at: `http://localhost:5173` (with `/api` proxied to FastAPI on port 8000).

3. **Production Build**:
   ```bash
   npm run build
   ```
