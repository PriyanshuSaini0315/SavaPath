// API helper client for SevaPath

const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('sevapath_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('sevapath_token', token);
  } else {
    localStorage.removeItem('sevapath_token');
  }
}

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  signup: (payload) => request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMe: () => request('/auth/me'),

  // Volunteer Profile
  getVolunteerProfile: () => request('/volunteer/profile'),
  updateVolunteerProfile: (profile) => request('/volunteer/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }),

  // Organisation Profile
  getOrgProfile: () => request('/organisation/profile'),
  updateOrgProfile: (profile) => request('/organisation/profile', {
    method: 'PUT',
    body: JSON.stringify(profile)
  }),

  // AI Mission Builder
  aiParseMission: (prompt) => request('/missions/ai-parse', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  }),

  // Missions
  createMission: (missionData) => request('/missions', {
    method: 'POST',
    body: JSON.stringify(missionData)
  }),
  listMissions: (orgOnly = false) => request(`/missions?org_only=${orgOnly}`),
  getMissionDetail: (missionId) => request(`/missions/${missionId}`),
  getMissionApplicants: (missionId) => request(`/missions/${missionId}/applicants`),

  // Recommendations & Matching
  getRecommendations: () => request('/volunteer/recommendations'),

  // Applications
  applyToRole: (missionRoleId) => request('/applications/apply', {
    method: 'POST',
    body: JSON.stringify({ mission_role_id: missionRoleId })
  }),
  inviteVolunteer: (volunteerId, missionRoleId) => request(`/applications/invite?volunteer_id=${volunteerId}&mission_role_id=${missionRoleId}`, {
    method: 'POST'
  }),
  updateApplicationStatus: (applicationId, status) => request(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  getMyApplications: () => request('/volunteer/applications'),
};

