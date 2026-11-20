# SevaPath (सेवापथ)

**SevaPath** is an AI-powered community volunteer matching platform that bridges local volunteers with grassroots causes and community missions.

It combines a **deterministic, weighted 100-point matching engine** (with zero black-box LLM hallucinations in scoring) with **Google Gemini AI** for plain-language mission drafting and personalized match explanations.

---

## 🌟 Key Highlights

- **Dual Role Architecture**: Purpose-built dashboards for both **Volunteers** and **Community Organisations**.
- **Deterministic 100-pt Matching Engine**: Transparent, explainable scoring based on:
  - **Skill Fit (30 pts)**: Overlap ratio of volunteer skills to role requirements.
  - **Location Fit (20 pts)**: Haversine distance decay against maximum travel radius.
  - **Availability Fit (20 pts)**: Weekday match and preferred time slots.
  - **Interest / Cause Fit (10 pts)**: Alignment with mission causes.
  - **Experience Fit (10 pts)**: Standard scoring for seasoned volunteers.
  - **Learning Eagerness (10 pts)**: Full credit for enthusiasm and willingness to learn.
- **Inclusive Beginner Path**: Roles flagged as `beginner_friendly` do **not** penalize low or zero experience; full experience points are awarded for eagerness to learn.
- **AI Mission Builder**: Organisations can describe drives in natural language (e.g. *"We need 10 people for a food distribution drive in Lucknow this Sunday morning"*); Gemini extracts structured metadata into an editable review form.
- **Explainable Matches**: Every recommendation card provides visual mini-breakdown bars and a personalized one-sentence explanation on why the role fits the volunteer.
- **Crew Management**: Organisations can view ranked applicants, assign **Primary** and **Backup** roles, or proactively invite top-matched volunteers.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React
- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, PyJWT, Passlib (Bcrypt)
- **Database**: PostgreSQL support via `DATABASE_URL` with automatic SQLite (`sevapath.db`) fallback
- **AI Integration**: Google Gemini API (`gemini-2.0-flash` / `gemini-1.5-flash`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

### 1. Clone the Repository
```bash
git clone https://github.com/EC-Roshan/SevaPath.git
cd SevaPath
```

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(Optional: Add your `GEMINI_API_KEY` for live AI mission parsing and match explanations. The platform includes full deterministic fallbacks if no key is set).*

---

### 3. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt

# Seed the database with demo organisation and 8 diverse volunteers
python seed.py

# Start backend server
uvicorn main:app --reload --port 8000
```
- API Documentation is live at: `http://localhost:8000/docs`

---

### 4. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
- Web Application is live at: `http://localhost:5173`

---

## 👥 Seed Accounts (for Immediate Testing)

All accounts share the password: `Password123!`

### Organisation
- **Email**: `org@sevapath.org`
- **Name**: Seva Relief Foundation (Lucknow)

### Volunteers (Varied Skills, Locations & Experience Levels)
- `aarav@example.com` — **Beginner** (Hazratganj, Food Relief, Packaging)
- `priya@example.com` — **Beginner** (Gomti Nagar, Youth, Math)
- `rohan@example.com` — **Beginner** (Alambagh, Inventory, Disaster Relief)
- `ananya@example.com` — **Some Experience** (Indira Nagar, Teaching, English)
- `vikram@example.com` — **Some Experience** (Mahanagar, Cooking, Sanitation)
- `neha@example.com` — **Experienced** (Chowk, First Aid, Medical)
- `kabir@example.com` — **Experienced** (Hazratganj, Logistics, Heavy Lifting)
- `meera@example.com` — **Experienced** (Vikas Nagar, Coding, Curriculum)

---

## 📂 Project Structure

```
SevaPath/
├── backend/
│   ├── main.py              # FastAPI application & REST endpoints
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic validation schemas
│   ├── matching.py          # Deterministic 100-pt matching engine
│   ├── gemini_service.py    # Gemini API client & fallback logic
│   ├── auth.py              # JWT authentication & password hashing
│   ├── config.py            # Environment & database configuration
│   ├── seed.py              # Database seeding script
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Dashboards, Modals, Breakdown bars
│   │   ├── AuthContext.jsx  # Authentication state & session provider
│   │   ├── api.js           # Centralized API fetch wrapper
│   │   ├── App.jsx          # Root layout & landing page
│   │   └── index.css        # Tailwind styles & theme variables
│   ├── package.json
│   └── vite.config.js
├── .env.example             # Template for environment variables
├── .gitignore
└── README.md
```

---

## 📄 License
MIT License

