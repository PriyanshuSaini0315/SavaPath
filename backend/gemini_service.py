import json
import re
import datetime
from typing import Dict, Any, Optional
import httpx
from config import GEMINI_API_KEY

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def get_empty_mission_form() -> Dict[str, Any]:
    """Returns an empty template structure for manual entry."""
    # Suggest next Sunday by default
    today = datetime.date.today()
    days_ahead = 6 - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    next_sunday = (today + datetime.timedelta(days=days_ahead)).isoformat()

    return {
        "title": "",
        "cause": "Community Welfare",
        "date": next_sunday,
        "time_slot": "Morning (09:00 - 13:00)",
        "city": "Lucknow",
        "neighbourhood_name": "Hazratganj",
        "location_lat": 26.8467,
        "location_lng": 80.9462,
        "roles": [
            {
                "role_name": "Volunteer",
                "required_skills": ["Teamwork"],
                "people_needed": 5,
                "beginner_friendly": True
            }
        ]
    }


def clean_json_response(raw_text: str) -> str:
    """Strips markdown code blocks like ```json ... ``` from LLM response."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def parse_mission_text_with_gemini(user_prompt: str) -> Dict[str, Any]:
    """
    Parses unstructured mission text into structured mission & roles JSON using Gemini.
    Falls back to empty form structure if API key missing or call fails.
    """
    if not GEMINI_API_KEY:
        print("[GeminiService] No GEMINI_API_KEY set. Returning empty mission form.")
        return get_empty_mission_form()

    prompt = f"""
You are an AI assistant for SevaPath, a community volunteer platform.
Extract structured mission details from this organization's request:
"{user_prompt}"

Return ONLY a valid JSON object with EXACTLY this structure (no extra text, no markdown explanation):
{{
  "title": "Concise mission title",
  "cause": "Primary cause (e.g. Food Relief, Education, Environment, Healthcare, Animal Welfare, Disaster Relief)",
  "date": "YYYY-MM-DD (estimate realistic upcoming date or next Sunday if specified like 'this Sunday')",
  "time_slot": "e.g. Morning (09:00 - 13:00) or Afternoon or Evening",
  "city": "City name (e.g. Lucknow)",
  "neighbourhood_name": "Neighbourhood or area name (e.g. Hazratganj, Gomti Nagar)",
  "location_lat": 26.8467,
  "location_lng": 80.9462,
  "roles": [
    {{
      "role_name": "Descriptive Role Title",
      "required_skills": ["Skill1", "Skill2"],
      "people_needed": 5,
      "beginner_friendly": true
    }}
  ]
}}
If location coordinates are not specified, provide sensible coordinates for the mentioned city/neighbourhood (default to Lucknow: lat 26.8467, lng 80.9462).
"""

    try:
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = clean_json_response(text)
                parsed = json.loads(cleaned)
                return parsed
            else:
                print(f"[GeminiService] API returned status {resp.status_code}: {resp.text}")
                return get_empty_mission_form()
    except Exception as e:
        print(f"[GeminiService] Error calling Gemini: {e}")
        return get_empty_mission_form()


def generate_match_explanation(
    volunteer: Dict[str, Any],
    mission: Dict[str, Any],
    role: Dict[str, Any],
    score_data: Dict[str, Any]
) -> str:
    """
    Generates a one-sentence 'Why this fits you' explanation using Gemini,
    with a deterministic template fallback.
    """
    breakdown = score_data.get("breakdown", {})
    distance = score_data.get("distance_km", 0.0)
    score = score_data.get("total_score", 0.0)
    skills_matched = [s for s in role.get("required_skills", []) if any(s.lower() in vs.lower() for vs in volunteer.get("skills", []))]

    # Deterministic fallback sentence
    if breakdown.get("skill_fit", 0) >= 15:
        matched_str = ", ".join(skills_matched[:2]) if skills_matched else "key required skills"
        fallback = f"Great match ({score:.0f}%): You're {distance}km away with relevant experience in {matched_str} and free on the mission date."
    elif role.get("beginner_friendly") and volunteer.get("willingness_to_learn"):
        fallback = f"Ideal beginner-friendly role ({score:.0f}%): Your strong enthusiasm to learn and close proximity ({distance}km) make you a wonderful fit!"
    elif breakdown.get("location_fit", 0) >= 15:
        fallback = f"Convenient local match ({score:.0f}%): Located just {distance}km away in {volunteer.get('neighbourhood_name', 'your area')} aligned with your interest in {mission.get('cause', 'community work')}."
    else:
        fallback = f"Strong community match ({score:.0f}%): Your profile aligns well with this {mission.get('cause', 'community')} initiative in {mission.get('city', 'the city')}."

    if not GEMINI_API_KEY:
        return fallback

    prompt = f"""
Write a single, encouraging, personalized one-sentence explanation (under 25 words) for a volunteer dashboard explaining "Why this mission fits you".

Volunteer Profile:
- Name: {volunteer.get('name')}
- Skills: {', '.join(volunteer.get('skills', []))}
- Experience: {volunteer.get('experience_level')}
- Willingness to learn: {volunteer.get('willingness_to_learn')}
- Distance to mission: {distance} km
- Available on date: {score_data.get('is_eligible')}

Mission & Role:
- Title: {mission.get('title')}
- Cause: {mission.get('cause')}
- Role: {role.get('role_name')}
- Required skills: {', '.join(role.get('required_skills', []))}
- Beginner friendly: {role.get('beginner_friendly')}

Match Score: {score}/100
Factor breakdown: {breakdown}

Output ONLY the one sentence. No quotes, no prefix like 'Why this fits you:'.
"""

    try:
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4}
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Clean up quotes if present
                text = text.strip('"\'')
                if len(text) > 10:
                    return text
    except Exception as e:
        print(f"[GeminiService] Explanation generation failed, using fallback: {e}")

    return fallback

