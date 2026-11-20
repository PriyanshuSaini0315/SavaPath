import os
import sys
import datetime

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from database import engine, Base, SessionLocal
from models import User, VolunteerProfile, OrganisationProfile, Mission, MissionRole, Application
from auth import get_password_hash
from matching import calculate_match_score

def seed_database(drop_existing=True):
    print("--------------------------------------------------")
    print("Seeding SevaPath Database...")
    print("--------------------------------------------------")

    # Recreate tables if drop_existing is True
    if drop_existing:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # 1. Create Organisation
        org_user = User(
            email="org@sevapath.org",
            hashed_password=get_password_hash("Password123!"),
            role="organisation"
        )
        db.add(org_user)
        db.commit()
        db.refresh(org_user)

        org_profile = OrganisationProfile(
            user_id=org_user.id,
            org_name="Seva Relief Foundation (Lucknow)",
            contact="+91-9876543210",
            location_city="Lucknow",
            description="Grassroots community action network delivering food security, emergency aid, and literacy support across Lucknow."
        )
        db.add(org_profile)
        db.commit()
        db.refresh(org_profile)

        # 2. Create 8 Diverse Volunteers (at least 3 beginners)
        volunteers_data = [
            {
                "email": "aarav@example.com",
                "name": "Aarav Sharma",
                "age": 20,
                "contact": "+91-9123456780",
                "interests": ["Food Relief", "Community Care"],
                "skills": ["Packaging", "Communication", "Social Media"],
                "experience_level": "beginner",
                "availability": {"days": ["Sunday", "Saturday"], "hours": ["Morning", "Afternoon"]},
                "location_lat": 26.8480,
                "location_lng": 80.9450,
                "neighbourhood_name": "Hazratganj",
                "max_distance_km": 10.0,
                "willingness_to_learn": True
            },
            {
                "email": "priya@example.com",
                "name": "Priya Verma",
                "age": 19,
                "contact": "+91-9123456781",
                "interests": ["Education", "Youth Development"],
                "skills": ["Basic Math", "Art & Craft", "Patience"],
                "experience_level": "beginner",
                "availability": {"days": ["Sunday", "Wednesday"], "hours": ["Morning"]},
                "location_lat": 26.8530,
                "location_lng": 80.9980,
                "neighbourhood_name": "Gomti Nagar",
                "max_distance_km": 12.0,
                "willingness_to_learn": True
            },
            {
                "email": "rohan@example.com",
                "name": "Rohan Gupta",
                "age": 22,
                "contact": "+91-9123456782",
                "interests": ["Disaster Relief", "Food Relief"],
                "skills": ["Data Entry", "Inventory Management", "Packaging"],
                "experience_level": "beginner",
                "availability": {"days": ["Sunday", "Saturday"], "hours": ["Morning", "Evening"]},
                "location_lat": 26.8140,
                "location_lng": 80.8980,
                "neighbourhood_name": "Alambagh",
                "max_distance_km": 8.0,
                "willingness_to_learn": True
            },
            {
                "email": "ananya@example.com",
                "name": "Ananya Singh",
                "age": 25,
                "contact": "+91-9123456783",
                "interests": ["Education", "Youth Development"],
                "skills": ["Teaching", "Basic Math", "English"],
                "experience_level": "some",
                "availability": {"days": ["Sunday", "Saturday"], "hours": ["Morning", "Afternoon"]},
                "location_lat": 26.8830,
                "location_lng": 80.9850,
                "neighbourhood_name": "Indira Nagar",
                "max_distance_km": 15.0,
                "willingness_to_learn": True
            },
            {
                "email": "vikram@example.com",
                "name": "Vikram Malhotra",
                "age": 28,
                "contact": "+91-9123456784",
                "interests": ["Food Relief", "Health & Sanitation"],
                "skills": ["Cooking", "Hygiene & Sanitation", "Crowd Control"],
                "experience_level": "some",
                "availability": {"days": ["Sunday"], "hours": ["Morning"]},
                "location_lat": 26.8720,
                "location_lng": 80.9520,
                "neighbourhood_name": "Mahanagar",
                "max_distance_km": 10.0,
                "willingness_to_learn": False
            },
            {
                "email": "neha@example.com",
                "name": "Dr. Neha Saxena",
                "age": 34,
                "contact": "+91-9123456785",
                "interests": ["Healthcare", "Disaster Relief", "Food Relief"],
                "skills": ["First Aid", "Triage", "Medical Support", "Hygiene & Sanitation"],
                "experience_level": "experienced",
                "availability": {"days": ["Sunday", "Saturday"], "hours": ["Morning", "Afternoon", "Evening"]},
                "location_lat": 26.8680,
                "location_lng": 80.9080,
                "neighbourhood_name": "Chowk",
                "max_distance_km": 20.0,
                "willingness_to_learn": True
            },
            {
                "email": "kabir@example.com",
                "name": "Kabir Khan",
                "age": 31,
                "contact": "+91-9123456786",
                "interests": ["Food Relief", "Disaster Relief"],
                "skills": ["Driving", "Logistics", "Heavy Lifting", "Route Planning"],
                "experience_level": "experienced",
                "availability": {"days": ["Sunday"], "hours": ["Morning", "Afternoon"]},
                "location_lat": 26.8450,
                "location_lng": 80.9420,
                "neighbourhood_name": "Hazratganj",
                "max_distance_km": 25.0,
                "willingness_to_learn": True
            },
            {
                "email": "meera@example.com",
                "name": "Meera Iyer",
                "age": 29,
                "contact": "+91-9123456787",
                "interests": ["Education", "Youth Development"],
                "skills": ["Coding", "Curriculum Design", "Mentorship", "Basic Math"],
                "experience_level": "experienced",
                "availability": {"days": ["Sunday", "Saturday"], "hours": ["Morning", "Afternoon"]},
                "location_lat": 26.8920,
                "location_lng": 80.9620,
                "neighbourhood_name": "Vikas Nagar",
                "max_distance_km": 15.0,
                "willingness_to_learn": True
            }
        ]

        created_volunteers = []
        for vd in volunteers_data:
            u = User(
                email=vd["email"],
                hashed_password=get_password_hash("Password123!"),
                role="volunteer"
            )
            db.add(u)
            db.commit()
            db.refresh(u)

            vp = VolunteerProfile(
                user_id=u.id,
                name=vd["name"],
                age=vd["age"],
                contact=vd["contact"],
                interests=vd["interests"],
                skills=vd["skills"],
                experience_level=vd["experience_level"],
                availability=vd["availability"],
                location_lat=vd["location_lat"],
                location_lng=vd["location_lng"],
                neighbourhood_name=vd["neighbourhood_name"],
                max_distance_km=vd["max_distance_km"],
                willingness_to_learn=vd["willingness_to_learn"]
            )
            db.add(vp)
            db.commit()
            db.refresh(vp)
            created_volunteers.append(vp)

        # 3. Create 2 Realistic Missions with Roles
        # Mission 1: Food Distribution
        # Use upcoming Sunday
        today = datetime.date.today()
        days_ahead = 6 - today.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_sunday = (today + datetime.timedelta(days=days_ahead)).isoformat()

        m1 = Mission(
            org_id=org_profile.id,
            title="Weekend Community Food Distribution Drive",
            cause="Food Relief",
            date=next_sunday,
            time_slot="Morning (09:00 - 13:00)",
            location_lat=26.8467,
            location_lng=80.9462,
            neighbourhood_name="Hazratganj",
            city="Lucknow"
        )
        db.add(m1)
        db.commit()
        db.refresh(m1)

        r1_1 = MissionRole(
            mission_id=m1.id,
            role_name="Meal Packing & Hygiene Volunteer",
            required_skills=["Packaging", "Hygiene & Sanitation"],
            people_needed=6,
            beginner_friendly=True
        )
        r1_2 = MissionRole(
            mission_id=m1.id,
            role_name="Logistics & Fleet Driver",
            required_skills=["Driving", "Logistics"],
            people_needed=2,
            beginner_friendly=False
        )
        db.add_all([r1_1, r1_2])
        db.commit()
        db.refresh(r1_1)
        db.refresh(r1_2)

        # Mission 2: Youth Education
        m2 = Mission(
            org_id=org_profile.id,
            title="Youth Digital Literacy & Math Mentorship",
            cause="Education",
            date=next_sunday,
            time_slot="Morning (10:00 - 13:00)",
            location_lat=26.8530,
            location_lng=80.9980,
            neighbourhood_name="Gomti Nagar",
            city="Lucknow"
        )
        db.add(m2)
        db.commit()
        db.refresh(m2)

        r2_1 = MissionRole(
            mission_id=m2.id,
            role_name="Math & Logic Mentor",
            required_skills=["Teaching", "Basic Math"],
            people_needed=4,
            beginner_friendly=True
        )
        r2_2 = MissionRole(
            mission_id=m2.id,
            role_name="Hands-on Coding Instructor",
            required_skills=["Coding", "Curriculum Design"],
            people_needed=2,
            beginner_friendly=False
        )
        db.add_all([r2_1, r2_2])
        db.commit()
        db.refresh(r2_1)
        db.refresh(r2_2)

        # 4. Seed Initial Sample Applications
        # Aarav (beginner) applied to Meal Packing
        v_aarav = created_volunteers[0]
        score_aarav = calculate_match_score(
            {
                "location_lat": v_aarav.location_lat, "location_lng": v_aarav.location_lng,
                "max_distance_km": v_aarav.max_distance_km, "availability": v_aarav.availability,
                "skills": v_aarav.skills, "interests": v_aarav.interests,
                "experience_level": v_aarav.experience_level, "willingness_to_learn": v_aarav.willingness_to_learn
            },
            {"location_lat": m1.location_lat, "location_lng": m1.location_lng, "date": m1.date, "time_slot": m1.time_slot, "cause": m1.cause},
            {"required_skills": r1_1.required_skills, "beginner_friendly": r1_1.beginner_friendly}
        )
        app_aarav = Application(
            mission_role_id=r1_1.id,
            volunteer_id=v_aarav.id,
            status="applied",
            match_score=score_aarav["total_score"],
            score_breakdown=score_aarav["breakdown"]
        )
        db.add(app_aarav)

        # Kabir (experienced) selected as Primary for Logistics
        v_kabir = created_volunteers[6]
        score_kabir = calculate_match_score(
            {
                "location_lat": v_kabir.location_lat, "location_lng": v_kabir.location_lng,
                "max_distance_km": v_kabir.max_distance_km, "availability": v_kabir.availability,
                "skills": v_kabir.skills, "interests": v_kabir.interests,
                "experience_level": v_kabir.experience_level, "willingness_to_learn": v_kabir.willingness_to_learn
            },
            {"location_lat": m1.location_lat, "location_lng": m1.location_lng, "date": m1.date, "time_slot": m1.time_slot, "cause": m1.cause},
            {"required_skills": r1_2.required_skills, "beginner_friendly": r1_2.beginner_friendly}
        )
        app_kabir = Application(
            mission_role_id=r1_2.id,
            volunteer_id=v_kabir.id,
            status="selected_primary",
            match_score=score_kabir["total_score"],
            score_breakdown=score_kabir["breakdown"]
        )
        db.add(app_kabir)

        # Priya invited to Math Mentor
        v_priya = created_volunteers[1]
        score_priya = calculate_match_score(
            {
                "location_lat": v_priya.location_lat, "location_lng": v_priya.location_lng,
                "max_distance_km": v_priya.max_distance_km, "availability": v_priya.availability,
                "skills": v_priya.skills, "interests": v_priya.interests,
                "experience_level": v_priya.experience_level, "willingness_to_learn": v_priya.willingness_to_learn
            },
            {"location_lat": m2.location_lat, "location_lng": m2.location_lng, "date": m2.date, "time_slot": m2.time_slot, "cause": m2.cause},
            {"required_skills": r2_1.required_skills, "beginner_friendly": r2_1.beginner_friendly}
        )
        app_priya = Application(
            mission_role_id=r2_1.id,
            volunteer_id=v_priya.id,
            status="invited",
            match_score=score_priya["total_score"],
            score_breakdown=score_priya["breakdown"]
        )
        db.add(app_priya)

        db.commit()

        print("\nDatabase successfully seeded!")
        print("==================================================")
        print("DEMO LOGIN CREDENTIALS")
        print("==================================================")
        print("All accounts share the default password: Password123!")
        print("\n1. Organisation Account:")
        print("   Email: org@sevapath.org")
        print("   Name:  Seva Relief Foundation (Lucknow)")
        print("\n2. Volunteer Accounts (8 Volunteers, 3+ Beginners):")
        for v in created_volunteers:
            print(f"   - {v.user.email.ljust(20)} | {v.name.ljust(18)} | {v.experience_level.ljust(11)} | {v.neighbourhood_name}")
        print("==================================================")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

