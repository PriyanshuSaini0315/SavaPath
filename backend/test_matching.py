from matching import calculate_match_score, haversine_distance

def test_engine():
    # Mission in Hazratganj, Lucknow (26.8467, 80.9462), on Sunday morning, Food Relief
    mission = {
        "title": "Food Distribution Drive",
        "cause": "Food Relief",
        "date": "2026-11-22",  # A Sunday
        "time_slot": "Morning (09:00 - 13:00)",
        "location_lat": 26.8467,
        "location_lng": 80.9462,
        "neighbourhood_name": "Hazratganj"
    }

    # Role 1: Beginner friendly
    role_bf = {
        "role_name": "Meal Packing",
        "required_skills": ["Packaging", "Hygiene"],
        "beginner_friendly": True
    }

    # Role 2: Non-beginner friendly
    role_adv = {
        "role_name": "Logistics Lead",
        "required_skills": ["Logistics", "Driving"],
        "beginner_friendly": False
    }

    # Volunteer 1: Beginner nearby, willing to learn, has packaging skill
    vol_beginner = {
        "name": "Aarav Sharma",
        "skills": ["Packaging", "Communication"],
        "interests": ["Food Relief", "Community Care"],
        "experience_level": "beginner",
        "availability": {"days": ["Sunday"], "hours": ["Morning"]},
        "location_lat": 26.8500,
        "location_lng": 80.9400,
        "max_distance_km": 10.0,
        "willingness_to_learn": True
    }

    # Test 1: Beginner on beginner-friendly role
    score1 = calculate_match_score(vol_beginner, mission, role_bf)
    print("Test 1 (Beginner on BF role):", score1)
    assert score1["is_eligible"] == True
    # In BF role, exp_score should be 10 because willingness_to_learn is True
    assert score1["breakdown"]["experience_fit"] == 10.0
    assert score1["breakdown"]["willingness_fit"] == 10.0
    assert score1["breakdown"]["interest_fit"] == 10.0
    assert score1["breakdown"]["availability_fit"] == 20.0
    print("Test 1 PASSED!")

    # Test 2: Same beginner on advanced role (non-BF)
    score2 = calculate_match_score(vol_beginner, mission, role_adv)
    print("Test 2 (Beginner on Non-BF role):", score2)
    assert score2["is_eligible"] == True
    # Non-BF role should penalize beginner -> exp_score == 2.0
    assert score2["breakdown"]["experience_fit"] == 2.0
    print("Test 2 PASSED!")

    # Test 3: Far away volunteer (outside max distance)
    vol_far = dict(vol_beginner)
    vol_far["location_lat"] = 28.6139  # Delhi
    vol_far["location_lng"] = 77.2090
    score3 = calculate_match_score(vol_far, mission, role_bf)
    print("Test 3 (Outside distance):", score3)
    assert score3["is_eligible"] == False
    assert score3["total_score"] == 0.0
    print("Test 3 PASSED!")

    # Test 4: Volunteer unavailable on Sunday
    vol_unavail = dict(vol_beginner)
    vol_unavail["availability"] = {"days": ["Monday", "Wednesday"], "hours": ["Evening"]}
    score4 = calculate_match_score(vol_unavail, mission, role_bf)
    print("Test 4 (Unavailable day):", score4)
    assert score4["is_eligible"] == False
    assert score4["total_score"] == 0.0
    print("Test 4 PASSED!")

    print("\nALL MATCHING ENGINE TESTS PASSED!")

if __name__ == "__main__":
    test_engine()

