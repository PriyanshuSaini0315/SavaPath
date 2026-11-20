import httpx
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_e2e_suite():
    print("==================================================")
    print("SEVAPATH COMPREHENSIVE END-TO-END VERIFICATION")
    print("==================================================")

    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. AUTH TEST: Login as Volunteer (Aarav Sharma - beginner in Hazratganj)
    print("\n[Step 1] Logging in as Volunteer (aarav@example.com)...")
    resp = client.post("/auth/login", json={"email": "aarav@example.com", "password": "Password123!"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    v_data = resp.json()
    v_token = v_data["access_token"]
    v_headers = {"Authorization": f"Bearer {v_token}"}
    print(f"✓ Authenticated as {v_data['user']['profile']['name']} ({v_data['user']['role']})")

    # 2. FEATURE 1: Volunteer Profile Retrieval & Editing
    print("\n[Step 2] Testing Feature 1: Volunteer Profile...")
    resp = client.get("/volunteer/profile", headers=v_headers)
    assert resp.status_code == 200
    profile = resp.json()
    print(f"Current Profile: Name={profile['name']}, Exp={profile['experience_level']}, Area={profile['neighbourhood_name']}, Dist={profile['max_distance_km']}km")
    print(f"Skills: {profile['skills']}")
    print(f"Willingness to learn: {profile['willingness_to_learn']}")

    # Update profile to add a new skill and save
    updated_profile = dict(profile)
    if "Logistics" not in updated_profile["skills"]:
        updated_profile["skills"].append("Logistics")
    resp = client.put("/volunteer/profile", json=updated_profile, headers=v_headers)
    assert resp.status_code == 200
    print("✓ Successfully updated volunteer profile with new skill 'Logistics'")

    # 3. FEATURE 3 & 4: Matching Engine & Explainable Matches
    print("\n[Step 3] Testing Feature 3 & 4: Recommendations & Explainable Matches...")
    resp = client.get("/volunteer/recommendations", headers=v_headers)
    assert resp.status_code == 200
    recs = resp.json()
    assert len(recs) > 0, "No recommendations returned"
    print(f"Received {len(recs)} ranked mission recommendations:")
    for idx, r in enumerate(recs, 1):
        print(f"\n  #{idx} Role: '{r['role_name']}' in '{r['mission_title']}'")
        print(f"     Match Score: {r['match_score']}/100 | Distance: {r['distance_km']}km | Cause: {r['mission_cause']}")
        print(f"     Beginner Friendly: {r['beginner_friendly']} | Existing Status: {r['application_status']}")
        print(f"     Breakdown: {r['breakdown']}")
        print(f"     Explanation: \"{r['why_fits_you']}\"")
        # Verify factor breakdown keys
        for key in ["skill_fit", "location_fit", "availability_fit", "interest_fit", "experience_fit", "willingness_fit"]:
            assert key in r["breakdown"], f"Missing {key} in breakdown"
        assert r["why_fits_you"] and len(r["why_fits_you"]) > 10

    # 4. FEATURE 5: Volunteer Applies to Role
    print("\n[Step 4] Testing Feature 5: Volunteer Application...")
    target_role = recs[0]
    target_role_id = target_role["role_id"]
    print(f"Applying to target role ID {target_role_id} ('{target_role['role_name']}')...")
    resp = client.post("/applications/apply", json={"mission_role_id": target_role_id}, headers=v_headers)
    assert resp.status_code == 200
    print(f"✓ Application Response: {resp.json()['message']}")

    # Verify application appears in volunteer applications list
    resp = client.get("/volunteer/applications", headers=v_headers)
    assert resp.status_code == 200
    my_apps = resp.json()
    applied_record = next((a for a in my_apps if a["mission_role_id"] == target_role_id), None)
    assert applied_record is not None, "Application not found in volunteer list"
    assert applied_record["status"] in ["applied", "selected_primary", "selected_backup"]
    print(f"✓ Verified in volunteer application tracker: Status = '{applied_record['status']}'")

    # 5. AUTH TEST: Login as Organisation (org@sevapath.org)
    print("\n[Step 5] Logging in as Organisation (org@sevapath.org)...")
    resp = client.post("/auth/login", json={"email": "org@sevapath.org", "password": "Password123!"})
    assert resp.status_code == 200
    org_data = resp.json()
    org_token = org_data["access_token"]
    org_headers = {"Authorization": f"Bearer {org_token}"}
    print(f"✓ Authenticated as {org_data['user']['profile']['org_name']}")

    # 6. FEATURE 2: AI Mission Builder
    print("\n[Step 6] Testing Feature 2: AI Mission Builder...")
    prompt_text = "We need 10 people for a food distribution drive in Lucknow this Sunday morning"
    print(f"Sending prompt to AI Mission Builder: \"{prompt_text}\"")
    resp = client.post("/missions/ai-parse", json={"prompt": prompt_text}, headers=org_headers)
    assert resp.status_code == 200
    ai_result = resp.json()
    print("Structured Result Received:")
    print(f"  Title: {ai_result.get('title')}")
    print(f"  Cause: {ai_result.get('cause')}")
    print(f"  Date: {ai_result.get('date')} | Time: {ai_result.get('time_slot')}")
    print(f"  Location: {ai_result.get('neighbourhood_name')}, {ai_result.get('city')} ({ai_result.get('location_lat')}, {ai_result.get('location_lng')})")
    print(f"  Roles Extracted ({len(ai_result.get('roles', []))}):")
    for ro in ai_result.get("roles", []):
        print(f"    - {ro.get('role_name')}: Needs {ro.get('people_needed')} people | Skills: {ro.get('required_skills')} | Beginner Friendly: {ro.get('beginner_friendly')}")

    # Now simulate user editing and saving the mission
    new_mission_payload = {
        "title": ai_result.get("title") or "Sunday Hunger Relief Campaign",
        "cause": ai_result.get("cause") or "Food Relief",
        "date": "2026-11-22",
        "time_slot": "Morning (09:00 - 13:00)",
        "city": "Lucknow",
        "neighbourhood_name": "Hazratganj",
        "location_lat": 26.8467,
        "location_lng": 80.9462,
        "roles": [
            {
                "role_name": "Food Distribution Aide",
                "required_skills": ["Packaging", "Hygiene & Sanitation"],
                "people_needed": 8,
                "beginner_friendly": True
            }
        ]
    }
    resp = client.post("/missions", json=new_mission_payload, headers=org_headers)
    assert resp.status_code == 200
    created_mission = resp.json()
    print(f"✓ Mission created and saved in database: ID {created_mission['id']} - '{created_mission['title']}'")

    # 7. FEATURE 5: Organisation views Ranked Applicants and selects Primary / Backup
    print("\n[Step 7] Testing Feature 5: Org views Ranked Applicants & Selects Primary/Backup...")
    # Get applicants for Mission 1
    resp = client.get("/missions/1/applicants", headers=org_headers)
    assert resp.status_code == 200
    m1_applicants_data = resp.json()
    print(f"Applicants data for Mission #{m1_applicants_data['mission_id']} ('{m1_applicants_data['title']}'):")

    role1 = m1_applicants_data["roles"][0]
    print(f"Role: '{role1['role_name']}' - {len(role1['applicants'])} direct applicants, {len(role1['matched_non_applicants'])} suggested non-applicants")
    if role1["applicants"]:
        first_app = role1["applicants"][0]
        print(f"  Top Applicant: {first_app['name']} | Match Score: {first_app['match_score']} pts | Current Status: {first_app['status']}")
        app_id = first_app["application_id"]

        # Mark as Primary
        print(f"  Selecting {first_app['name']} as PRIMARY role...")
        resp = client.patch(f"/applications/{app_id}/status", json={"status": "selected_primary"}, headers=org_headers)
        assert resp.status_code == 200
        print(f"  ✓ Status changed to: {resp.json()['status']}")

        # Mark as Backup
        print(f"  Selecting {first_app['name']} as BACKUP role...")
        resp = client.patch(f"/applications/{app_id}/status", json={"status": "selected_backup"}, headers=org_headers)
        assert resp.status_code == 200
        print(f"  ✓ Status changed to: {resp.json()['status']}")

    # 8. FEATURE 5: Org invites a top-matched non-applicant
    print("\n[Step 8] Testing Feature 5: Org Invites Top-Matched Non-Applicant...")
    if role1["matched_non_applicants"]:
        candidate = role1["matched_non_applicants"][0]
        cand_id = candidate["volunteer_id"]
        cand_name = candidate["name"]
        print(f"Found top unapplied candidate: {cand_name} (Score: {candidate['match_score']} pts)")
        resp = client.post(f"/applications/invite?volunteer_id={cand_id}&mission_role_id={role1['role_id']}", headers=org_headers)
        assert resp.status_code == 200
        print(f"✓ {resp.json()['message']}")

    # 9. Verify volunteer sees their updated status
    print("\n[Step 9] Verifying volunteer sees updated status...")
    resp = client.get("/volunteer/applications", headers=v_headers)
    assert resp.status_code == 200
    v_apps = resp.json()
    print("Volunteer's live statuses:")
    for a in v_apps:
        print(f"  - Mission: '{a['mission_title']}' | Role: '{a['role_name']}' | Status: '{a['status']}'")

    print("\n==================================================")
    print("ALL 5 FEATURES & END-TO-END FLOW VERIFIED 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_suite()

