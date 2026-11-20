# SevaPath Backend

FastAPI REST API with JWT Authentication, Deterministic Weighted Matching Engine, and Gemini AI integration for mission understanding and match explanations.

## Tech Stack
- Python 3.11+
- FastAPI & Uvicorn
- SQLAlchemy (PostgreSQL support with automatic SQLite fallback)
- PyJWT & Passlib (Bcrypt)
- Google Gemini API (via HTTP REST client)

## Setup & Running

1. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux / macOS:
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   # If DATABASE_URL is left empty, SQLite (sevapath.db) will be used automatically.
   # Set GEMINI_API_KEY for live AI mission builder and explanations (smart fallbacks work without a key).
   ```

4. **Seed the Database with Demo Data**:
   ```bash
   python seed.py
   ```
   This creates:
   - 1 Organisation (`org@sevapath.org` / `Password123!`)
   - 8 Diverse Volunteers across Lucknow (3+ beginners) (all passwords: `Password123!`)
   - 2 Community Missions with multiple roles and sample applications

5. **Start the API Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   API Documentation available at: `http://localhost:8000/docs`

6. **Run Matching Tests**:
   ```bash
   python test_matching.py
   python test_api.py
   ```

