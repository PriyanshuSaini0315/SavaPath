import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_matching_endpoint():
    print("Testing Auth & Recommendations...")
    # 1. Login as volunteer Aarav (beginner in Hazratganj)
    login_resp = client.post("/api/auth/login", json={
        "email": "aarav@example.com",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Call recommendations endpoint
    rec_resp = client.get("/api/volunteer/recommendations", headers=headers)
    assert rec_resp.status_code == 200, f"Rec failed: {rec_resp.text}"
    recommendations = rec_resp.json()

    print(f"\nFetched {len(recommendations)} recommendations for Aarav Sharma:")
    for r in recommendations:
        print(f"\n- Role: {r['role_name']} in '{r['mission_title']}'")
        print(f"  Match Score: {r['match_score']}/100 | Distance: {r['distance_km']}km | Beginner Friendly: {r['beginner_friendly']}")
        print(f"  Breakdown: {r['breakdown']}")
        print(f"  Why fits you: {r['why_fits_you']}")
        print(f"  Existing Status: {r['application_status']}")

    assert len(recommendations) > 0
    top = recommendations[0]
    assert top["match_score"] > 50
    assert "breakdown" in top
    print("\n✓ MATCHING ENDPOINT VERIFIED WITH SENSIBLE SCORES!")

if __name__ == "__main__":
    test_matching_endpoint()
