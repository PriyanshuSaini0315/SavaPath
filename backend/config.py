import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current directory or parent directory
env_path = Path(".env")
if not env_path.exists():
    env_path = Path("..") / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    if os.getenv("VERCEL"):
        # Vercel serverless functions have a read-only filesystem except /tmp
        DATABASE_URL = "sqlite:////tmp/sevapath.db"
    else:
        # Always resolve to a consistent database file inside backend/
        base_dir = Path(__file__).resolve().parent
        db_file = (base_dir / "sevapath.db").as_posix()
        DATABASE_URL = f"sqlite:///{db_file}"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
JWT_SECRET = os.getenv("JWT_SECRET", "sevapath_dev_secret_key_change_me_in_prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
PORT = int(os.getenv("PORT", "8000"))

