import math
import datetime
from typing import Dict, Any, Tuple, List, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees).
    """
    R = 6371.0  # Earth's radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 2)


def get_day_name(date_str: str) -> Optional[str]:
    """
    Attempt to extract the weekday name from date_str.
    Supports formats like 'YYYY-MM-DD', 'Sunday', etc.
    """
    if not date_str:
        return None
    
    # If the date_str itself is or contains a day name
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    for day in weekdays:
        if day.lower() in date_str.lower():
            return day

    # Try ISO formats
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            dt = datetime.datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%A")
        except ValueError:
            pass
    return None


def calculate_match_score(
    volunteer: Dict[str, Any],
    mission: Dict[str, Any],
    role: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates deterministic weighted match score out of 100 with per-factor breakdown.
    
    Factors:
    - Skill fit: 30
    - Location fit: 20
    - Availability fit: 20
    - Interest fit: 10
    - Experience fit: 10
    - Willingness to learn: 10
    
    Eligibility filter:
    - Drops volunteers outside their maximum travel distance or unavailable on date.
    
    Beginner path:
    - If role is beginner_friendly, does not penalise low experience;
      gives the experience points for willingness to learn instead.
    """
    v_lat = float(volunteer.get("location_lat", 0.0))
    v_lng = float(volunteer.get("location_lng", 0.0))
    m_lat = float(mission.get("location_lat", 0.0))
    m_lng = float(mission.get("location_lng", 0.0))
    max_dist = float(volunteer.get("max_distance_km", 10.0))

    distance = haversine_distance(v_lat, v_lng, m_lat, m_lng)

    # 1. Eligibility Filter: Distance check
    is_distance_eligible = distance <= max_dist

    # 2. Eligibility Filter: Date & Day Availability check
    v_avail = volunteer.get("availability") or {}
    avail_days = [d.strip().lower() for d in v_avail.get("days", [])]
    mission_date_str = str(mission.get("date", ""))
    mission_day = get_day_name(mission_date_str)

    # If mission specifies a day, volunteer must have that day in availability
    # (or if volunteer listed "Any" / all days)
    is_availability_eligible = True
    if mission_day:
        if avail_days and "any" not in avail_days:
            is_availability_eligible = (mission_day.lower() in avail_days)

    is_eligible = is_distance_eligible and is_availability_eligible

    # Initialize breakdown
    breakdown = {
        "skill_fit": 0.0,
        "location_fit": 0.0,
        "availability_fit": 0.0,
        "interest_fit": 0.0,
        "experience_fit": 0.0,
        "willingness_fit": 0.0
    }

    if not is_eligible:
        return {
            "total_score": 0.0,
            "is_eligible": False,
            "ineligibility_reason": "Outside travel radius" if not is_distance_eligible else "Unavailable on mission date",
            "distance_km": distance,
            "breakdown": breakdown
        }

    # Factor 1: Skill Fit (30 pts)
    req_skills = [s.strip().lower() for s in role.get("required_skills", [])]
    vol_skills = [s.strip().lower() for s in volunteer.get("skills", [])]

    if not req_skills:
        skill_score = 30.0
    else:
        # Count overlaps
        matched_count = 0
        for r_skill in req_skills:
            if any(r_skill == v_skill or r_skill in v_skill or v_skill in r_skill for v_skill in vol_skills):
                matched_count += 1
        skill_score = round((matched_count / len(req_skills)) * 30.0, 1)

    breakdown["skill_fit"] = min(30.0, skill_score)

    # Factor 2: Location Fit (20 pts)
    # Haversine distance against volunteer's max distance; 0 if outside
    if distance > max_dist:
        loc_score = 0.0
    elif max_dist <= 0:
        loc_score = 20.0 if distance == 0 else 0.0
    else:
        loc_score = round(max(0.0, (1.0 - (distance / max_dist))) * 20.0, 1)

    breakdown["location_fit"] = loc_score

    # Factor 3: Availability Fit (20 pts)
    avail_score = 15.0  # Day matched (eligible)
    mission_time = str(mission.get("time_slot", "")).lower()
    vol_hours = [h.strip().lower() for h in v_avail.get("hours", [])]

    if not vol_hours or "any" in vol_hours:
        avail_score = 20.0
    else:
        # Check if morning / afternoon / evening / weekend matches
        time_keywords = ["morning", "afternoon", "evening", "night"]
        matched_time = False
        for kw in time_keywords:
            if kw in mission_time and any(kw in vh for vh in vol_hours):
                matched_time = True
                break
        if matched_time:
            avail_score = 20.0

    breakdown["availability_fit"] = avail_score

    # Factor 4: Interest Fit (10 pts)
    mission_cause = str(mission.get("cause", "")).strip().lower()
    vol_interests = [i.strip().lower() for i in volunteer.get("interests", [])]

    if any(mission_cause in vi or vi in mission_cause for vi in vol_interests):
        interest_score = 10.0
    else:
        interest_score = 0.0

    breakdown["interest_fit"] = interest_score

    # Factor 5: Experience Fit (10 pts)
    exp_level = str(volunteer.get("experience_level", "beginner")).lower()
    willingness = bool(volunteer.get("willingness_to_learn", True))
    beginner_friendly = bool(role.get("beginner_friendly", False))

    if beginner_friendly:
        # Beginner path: for roles marked beginner_friendly, do not penalise low experience;
        # give the experience points for willingness to learn instead.
        if willingness:
            exp_score = 10.0
        else:
            exp_score = 5.0
    else:
        if exp_level == "experienced":
            exp_score = 10.0
        elif exp_level == "some":
            exp_score = 6.0
        else:  # beginner
            exp_score = 2.0

    breakdown["experience_fit"] = exp_score

    # Factor 6: Willingness to Learn (10 pts)
    willingness_score = 10.0 if willingness else 0.0
    breakdown["willingness_fit"] = willingness_score

    # Total Score
    total = round(sum(breakdown.values()), 1)
    total = max(0.0, min(100.0, total))

    return {
        "total_score": total,
        "is_eligible": True,
        "ineligibility_reason": None,
        "distance_km": distance,
        "breakdown": breakdown
    }

