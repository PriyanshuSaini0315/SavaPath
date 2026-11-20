import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
from models import User, VolunteerProfile, OrganisationProfile, Mission, MissionRole, Application
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from matching import calculate_match_score
from gemini_service import parse_mission_text_with_gemini, generate_match_explanation
from config import PORT

# Create database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty (ensures demo data on fresh Vercel / Cloud deployments)
try:
    from database import SessionLocal
    with SessionLocal() as init_db:
        if init_db.query(User).count() == 0:
            print("[SevaPath] Empty database detected. Auto-seeding initial community data...")
            from seed import seed_database
            seed_database(drop_existing=False)
except Exception as e:
    print(f"[SevaPath] Database startup auto-seed check: {e}")

app = FastAPI(
    title="SevaPath API",
    description="Community Volunteer Matching Platform with Explainable AI",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_user_profile_dict(user: User) -> Dict[str, Any]:
    if user.role == "volunteer" and user.volunteer_profile:
        vp = user.volunteer_profile
        return {
            "id": vp.id,
            "name": vp.name,
            "age": vp.age,
            "contact": vp.contact,
            "interests": vp.interests or [],
            "skills": vp.skills or [],
            "experience_level": vp.experience_level,
            "availability": vp.availability or {"days": [], "hours": []},
            "location_lat": vp.location_lat,
            "location_lng": vp.location_lng,
            "neighbourhood_name": vp.neighbourhood_name,
            "max_distance_km": vp.max_distance_km,
            "willingness_to_learn": vp.willingness_to_learn,
        }
    elif user.role == "organisation" and user.organisation_profile:
        op = user.organisation_profile
        return {
            "id": op.id,
            "org_name": op.org_name,
            "contact": op.contact,
            "location_city": op.location_city,
            "description": op.description,
        }
    return {}


# -------------------------------------------------------------
# AUTH ENDPOINTS
# -------------------------------------------------------------

@app.post("/api/auth/signup", response_model=schemas.TokenResponse)
def signup(data: schemas.UserSignup, db: Session = Depends(get_db)):
    # Check existing user
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    if data.role not in ["volunteer", "organisation"]:
        raise HTTPException(status_code=400, detail="Role must be either 'volunteer' or 'organisation'.")

    hashed_pw = get_password_hash(data.password)
    user = User(
        email=data.email.lower(),
        hashed_password=hashed_pw,
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default profile
    if data.role == "volunteer":
        v_name = data.name.strip() if data.name else data.email.split("@")[0].capitalize()
        profile = VolunteerProfile(
            user_id=user.id,
            name=v_name,
            age=24,
            contact=data.email,
            interests=["Community Welfare", "Food Relief"],
            skills=["Teamwork", "Communication"],
            experience_level="beginner",
            availability={"days": ["Saturday", "Sunday"], "hours": ["Morning", "Afternoon"]},
            location_lat=26.8467,
            location_lng=80.9462,
            neighbourhood_name="Hazratganj",
            max_distance_km=10.0,
            willingness_to_learn=True
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        o_name = data.org_name.strip() if data.org_name else (data.name or "Seva Foundation")
        profile = OrganisationProfile(
            user_id=user.id,
            org_name=o_name,
            contact=data.email,
            location_city="Lucknow",
            description="Grassroots community action group"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    profile_dict = get_user_profile_dict(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "profile": profile_dict
        }
    }


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    profile_dict = get_user_profile_dict(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "profile": profile_dict
        }
    }


@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "profile": get_user_profile_dict(current_user)
    }


# -------------------------------------------------------------
# VOLUNTEER PROFILE ENDPOINTS (FEATURE 1)
# -------------------------------------------------------------

@app.get("/api/volunteer/profile", response_model=schemas.VolunteerProfileSchema)
def get_volunteer_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access only.")
    profile = current_user.volunteer_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Volunteer profile not found.")
    return profile


@app.put("/api/volunteer/profile", response_model=schemas.VolunteerProfileSchema)
def update_volunteer_profile(
    data: schemas.VolunteerProfileSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access only.")
    profile = current_user.volunteer_profile
    if not profile:
        profile = VolunteerProfile(user_id=current_user.id)
        db.add(profile)

    profile.name = data.name
    profile.age = data.age
    profile.contact = data.contact
    profile.interests = data.interests
    profile.skills = data.skills
    profile.experience_level = data.experience_level
    profile.availability = data.availability
    profile.location_lat = data.location_lat
    profile.location_lng = data.location_lng
    profile.neighbourhood_name = data.neighbourhood_name
    profile.max_distance_km = data.max_distance_km
    profile.willingness_to_learn = data.willingness_to_learn

    db.commit()
    db.refresh(profile)
    return profile


# -------------------------------------------------------------
# ORGANISATION PROFILE ENDPOINTS
# -------------------------------------------------------------

@app.get("/api/organisation/profile", response_model=schemas.OrganisationProfileSchema)
def get_org_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "organisation":
        raise HTTPException(status_code=403, detail="Organisation access only.")
    profile = current_user.organisation_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Organisation profile not found.")
    return profile


@app.put("/api/organisation/profile", response_model=schemas.OrganisationProfileSchema)
def update_org_profile(
    data: schemas.OrganisationProfileSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "organisation":
        raise HTTPException(status_code=403, detail="Organisation access only.")
    profile = current_user.organisation_profile
    if not profile:
        profile = OrganisationProfile(user_id=current_user.id)
        db.add(profile)

    profile.org_name = data.org_name
    profile.contact = data.contact
    profile.location_city = data.location_city
    profile.description = data.description

    db.commit()
    db.refresh(profile)
    return profile


# -------------------------------------------------------------
# AI MISSION BUILDER (FEATURE 2)
# -------------------------------------------------------------

@app.post("/api/missions/ai-parse")
def ai_parse_mission(
    request: schemas.ParseMissionRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "organisation":
        raise HTTPException(status_code=403, detail="Only organisations can use the AI Mission Builder.")
    
    parsed_json = parse_mission_text_with_gemini(request.prompt)
    return parsed_json


# -------------------------------------------------------------
# MISSION MANAGEMENT
# -------------------------------------------------------------

@app.post("/api/missions", response_model=schemas.MissionResponseSchema)
def create_mission(
    data: schemas.MissionCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "organisation":
        raise HTTPException(status_code=403, detail="Only organisations can create missions.")
    org_profile = current_user.organisation_profile
    if not org_profile:
        raise HTTPException(status_code=400, detail="Organisation profile missing.")

    mission = Mission(
        org_id=org_profile.id,
        title=data.title,
        cause=data.cause,
        date=data.date,
        time_slot=data.time_slot,
        location_lat=data.location_lat,
        location_lng=data.location_lng,
        neighbourhood_name=data.neighbourhood_name,
        city=data.city
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)

    for role_data in data.roles:
        m_role = MissionRole(
            mission_id=mission.id,
            role_name=role_data.role_name,
            required_skills=role_data.required_skills,
            people_needed=role_data.people_needed,
            beginner_friendly=role_data.beginner_friendly
        )
        db.add(m_role)
    db.commit()
    db.refresh(mission)

    res = schemas.MissionResponseSchema.from_orm(mission)
    res.org_name = org_profile.org_name
    return res


@app.get("/api/missions", response_model=List[schemas.MissionResponseSchema])
def list_missions(org_only: bool = False, current_user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Mission)
    if org_only:
        if current_user.role != "organisation" or not current_user.organisation_profile:
            return []
        query = query.filter(Mission.org_id == current_user.organisation_profile.id)

    missions = query.order_by(Mission.id.desc()).all()
    results = []
    for m in missions:
        item = schemas.MissionResponseSchema.from_orm(m)
        item.org_name = m.organisation.org_name if m.organisation else "Community Partner"
        results.append(item)
    return results


@app.get("/api/missions/{mission_id}", response_model=schemas.MissionResponseSchema)
def get_mission_detail(mission_id: int, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")
    res = schemas.MissionResponseSchema.from_orm(mission)
    res.org_name = mission.organisation.org_name if mission.organisation else "Community Partner"
    return res


# -------------------------------------------------------------
# VOLUNTEER RECOMMENDATIONS & EXPLAINABLE MATCHES (FEATURES 3 & 4)
# -------------------------------------------------------------

@app.get("/api/volunteer/recommendations", response_model=List[schemas.MatchRecommendationSchema])
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access only.")
    profile = current_user.volunteer_profile
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete your profile first.")

    v_dict = {
        "name": profile.name,
        "skills": profile.skills or [],
        "interests": profile.interests or [],
        "experience_level": profile.experience_level,
        "availability": profile.availability or {},
        "location_lat": profile.location_lat,
        "location_lng": profile.location_lng,
        "neighbourhood_name": profile.neighbourhood_name,
        "max_distance_km": profile.max_distance_km,
        "willingness_to_learn": profile.willingness_to_learn
    }

    # Fetch existing applications by this volunteer
    existing_apps = {
        app.mission_role_id: app.status
        for app in db.query(Application).filter(Application.volunteer_id == profile.id).all()
    }

    # Iterate all missions and roles
    missions = db.query(Mission).all()
    recommendations = []

    for m in missions:
        m_dict = {
            "title": m.title,
            "cause": m.cause,
            "date": m.date,
            "time_slot": m.time_slot,
            "location_lat": m.location_lat,
            "location_lng": m.location_lng,
            "city": m.city,
            "neighbourhood_name": m.neighbourhood_name
        }
        for r in m.roles:
            r_dict = {
                "role_name": r.role_name,
                "required_skills": r.required_skills or [],
                "beginner_friendly": r.beginner_friendly
            }

            match_result = calculate_match_score(v_dict, m_dict, r_dict)
            if not match_result["is_eligible"]:
                continue

            why_fits = generate_match_explanation(v_dict, m_dict, r_dict, match_result)
            status_val = existing_apps.get(r.id, None)

            recommendations.append({
                "mission_id": m.id,
                "mission_title": m.title,
                "mission_cause": m.cause,
                "mission_date": m.date,
                "mission_time_slot": m.time_slot,
                "neighbourhood_name": m.neighbourhood_name,
                "city": m.city,
                "org_name": m.organisation.org_name if m.organisation else "Community Org",
                "role_id": r.id,
                "role_name": r.role_name,
                "required_skills": r.required_skills or [],
                "beginner_friendly": r.beginner_friendly,
                "people_needed": r.people_needed,
                "match_score": match_result["total_score"],
                "distance_km": match_result["distance_km"],
                "is_eligible": match_result["is_eligible"],
                "breakdown": match_result["breakdown"],
                "why_fits_you": why_fits,
                "application_status": status_val
            })

    # Sort descending by match score
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)
    return recommendations


# -------------------------------------------------------------
# APPLY AND SELECT (FEATURE 5)
# -------------------------------------------------------------

@app.post("/api/applications/apply")
def apply_to_role(
    data: schemas.ApplicationCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access only.")
    profile = current_user.volunteer_profile
    if not profile:
        raise HTTPException(status_code=400, detail="Profile required.")

    role = db.query(MissionRole).filter(MissionRole.id == data.mission_role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Mission role not found.")

    # Check if already applied or invited
    existing = db.query(Application).filter(
        Application.mission_role_id == role.id,
        Application.volunteer_id == profile.id
    ).first()
    if existing:
        if existing.status == "invited":
            existing.status = "applied"
            db.commit()
            return {"message": "Accepted invitation and applied!", "status": existing.status}
        return {"message": f"Already applied. Current status: {existing.status}", "status": existing.status}

    # Calculate match score & breakdown
    v_dict = {
        "name": profile.name,
        "skills": profile.skills or [],
        "interests": profile.interests or [],
        "experience_level": profile.experience_level,
        "availability": profile.availability or {},
        "location_lat": profile.location_lat,
        "location_lng": profile.location_lng,
        "max_distance_km": profile.max_distance_km,
        "willingness_to_learn": profile.willingness_to_learn
    }
    m = role.mission
    m_dict = {
        "date": m.date,
        "time_slot": m.time_slot,
        "cause": m.cause,
        "location_lat": m.location_lat,
        "location_lng": m.location_lng
    }
    r_dict = {
        "role_name": role.role_name,
        "required_skills": role.required_skills or [],
        "beginner_friendly": role.beginner_friendly
    }
    match_result = calculate_match_score(v_dict, m_dict, r_dict)

    application = Application(
        mission_role_id=role.id,
        volunteer_id=profile.id,
        status="applied",
        match_score=match_result["total_score"],
        score_breakdown=match_result["breakdown"]
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {"message": "Application submitted successfully!", "status": "applied", "match_score": application.match_score}


@app.get("/api/volunteer/applications", response_model=List[schemas.ApplicationResponseSchema])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "volunteer":
        raise HTTPException(status_code=403, detail="Volunteer access only.")
    profile = current_user.volunteer_profile
    if not profile:
        return []

    apps = db.query(Application).filter(Application.volunteer_id == profile.id).order_by(Application.updated_at.desc()).all()
    results = []
    for a in apps:
        m = a.role.mission
        results.append({
            "id": a.id,
            "mission_role_id": a.mission_role_id,
            "role_name": a.role.role_name,
            "mission_id": m.id,
            "mission_title": m.title,
            "mission_date": m.date,
            "volunteer_id": a.volunteer_id,
            "volunteer_name": a.volunteer.name,
            "status": a.status,
            "match_score": a.match_score,
            "score_breakdown": a.score_breakdown or {},
            "updated_at": a.updated_at
        })
    return results


@app.post("/api/applications/invite")
def invite_volunteer(
    volunteer_id: int,
    mission_role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "organisation":
        raise HTTPException(status_code=403, detail="Only organisations can invite volunteers.")
    
    role = db.query(MissionRole).filter(MissionRole.id == mission_role_id).first()
    if not role or role.mission.org_id != current_user.organisation_profile.id:
        raise HTTPException(status_code=403, detail="Unauthorized role access.")

    volunteer = db.query(VolunteerProfile).filter(VolunteerProfile.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    existing = db.query(Application).filter(
        Application.mission_role_id == role.id,
        Application.volunteer_id == volunteer.id
    ).first()
    if existing:
        return {"message": f"Volunteer already in application records with status: {existing.status}"}

    # Calculate match score & breakdown
    v_dict = {
        "name": volunteer.name,
        "skills": volunteer.skills or [],
        "interests": volunteer.interests or [],
        "experience_level": volunteer.experience_level,
        "availability": volunteer.availability or {},
        "location_lat": volunteer.location_lat,
        "location_lng": volunteer.location_lng,
        "max_distance_km": volunteer.max_distance_km,
        "willingness_to_learn": volunteer.willingness_to_learn
    }
    m = role.mission
    m_dict = {
        "date": m.date,
        "time_slot": m.time_slot,
        "cause": m.cause,
        "location_lat": m.location_lat,
        "location_lng": m.location_lng
    }
    r_dict = {
        "role_name": role.role_name,
        "required_skills": role.required_skills or [],
        "beginner_friendly": role.beginner_friendly
    }
    match_result = calculate_match_score(v_dict, m_dict, r_dict)

    application = Application(
        mission_role_id=role.id,
        volunteer_id=volunteer.id,
        status="invited",
        match_score=match_result["total_score"],
        score_breakdown=match_result["breakdown"]
    )
    db.add(application)
    db.commit()

    return {"message": f"Successfully invited {volunteer.name} to {role.role_name}!", "status": "invited"}


@app.patch("/api/applications/{application_id}/status")
def update_application_status(
    application_id: int,
    data: schemas.ApplicationStatusUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "organisation":
        raise HTTPException(status_code=403, detail="Organisation access only.")

    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Check organisation ownership
    if application.role.mission.org_id != current_user.organisation_profile.id:
        raise HTTPException(status_code=403, detail="Unauthorized to manage this mission.")

    allowed = ["applied", "invited", "selected_primary", "selected_backup", "not_selected"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {allowed}")

    application.status = data.status
    db.commit()
    db.refresh(application)

    return {"message": "Status updated successfully", "status": application.status}


@app.get("/api/missions/{mission_id}/applicants")
def get_mission_applicants(
    mission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "organisation":
        raise HTTPException(status_code=403, detail="Organisation access only.")

    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found.")
    if mission.org_id != current_user.organisation_profile.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this mission.")

    m_dict = {
        "date": mission.date,
        "time_slot": mission.time_slot,
        "cause": mission.cause,
        "location_lat": mission.location_lat,
        "location_lng": mission.location_lng
    }

    # Group applicants per role, and find top-matched non-applicants per role
    all_volunteers = db.query(VolunteerProfile).all()
    roles_data = []

    for role in mission.roles:
        r_dict = {
            "role_name": role.role_name,
            "required_skills": role.required_skills or [],
            "beginner_friendly": role.beginner_friendly
        }

        # Applicants for this role
        apps = db.query(Application).filter(Application.mission_role_id == role.id).all()
        applicants_list = []
        applied_vol_ids = set()

        for a in apps:
            applied_vol_ids.add(a.volunteer_id)
            v = a.volunteer
            applicants_list.append({
                "application_id": a.id,
                "volunteer_id": v.id,
                "name": v.name,
                "age": v.age,
                "contact": v.contact,
                "skills": v.skills or [],
                "experience_level": v.experience_level,
                "neighbourhood_name": v.neighbourhood_name,
                "willingness_to_learn": v.willingness_to_learn,
                "match_score": a.match_score,
                "breakdown": a.score_breakdown or {},
                "status": a.status
            })

        # Sort applicants by match score descending
        applicants_list.sort(key=lambda x: x["match_score"], reverse=True)

        # Top-matched non-applicants who have not applied or been invited
        non_applicants = []
        for v in all_volunteers:
            if v.id in applied_vol_ids:
                continue
            v_dict = {
                "name": v.name,
                "skills": v.skills or [],
                "interests": v.interests or [],
                "experience_level": v.experience_level,
                "availability": v.availability or {},
                "location_lat": v.location_lat,
                "location_lng": v.location_lng,
                "max_distance_km": v.max_distance_km,
                "willingness_to_learn": v.willingness_to_learn
            }
            score_data = calculate_match_score(v_dict, m_dict, r_dict)
            if score_data["is_eligible"]:
                non_applicants.append({
                    "volunteer_id": v.id,
                    "name": v.name,
                    "age": v.age,
                    "contact": v.contact,
                    "skills": v.skills or [],
                    "experience_level": v.experience_level,
                    "neighbourhood_name": v.neighbourhood_name,
                    "distance_km": score_data["distance_km"],
                    "match_score": score_data["total_score"],
                    "breakdown": score_data["breakdown"],
                    "willingness_to_learn": v.willingness_to_learn
                })

        non_applicants.sort(key=lambda x: x["match_score"], reverse=True)

        roles_data.append({
            "role_id": role.id,
            "role_name": role.role_name,
            "required_skills": role.required_skills or [],
            "people_needed": role.people_needed,
            "beginner_friendly": role.beginner_friendly,
            "applicants": applicants_list,
            "matched_non_applicants": non_applicants[:5]  # Top 5 suggestions
        })

    return {
        "mission_id": mission.id,
        "title": mission.title,
        "cause": mission.cause,
        "date": mission.date,
        "time_slot": mission.time_slot,
        "location": f"{mission.neighbourhood_name}, {mission.city}",
        "roles": roles_data
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "SevaPath", "version": "1.0.0"}

