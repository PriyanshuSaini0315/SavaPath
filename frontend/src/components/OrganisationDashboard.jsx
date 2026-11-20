import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import MatchBreakdownBar from './MatchBreakdownBar';
import {
  Building2,
  Sparkles,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Award,
  AlertCircle,
  UserPlus,
  Send,
  Trash2,
  Save,
  Check,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const SAMPLE_PROMPTS = [
  "We need 10 people for a food distribution drive in Lucknow this Sunday morning",
  "Looking for 5 volunteers for basic math tutoring and digital literacy in Gomti Nagar this Sunday morning",
  "Need 8 volunteers for emergency relief kit packaging and logistics transport in Hazratganj this weekend",
];

export default function OrganisationDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('missions'); // missions | ai_builder
  const [missions, setMissions] = useState([]);
  const [selectedMissionId, setSelectedMissionId] = useState(null);
  const [applicantsData, setApplicantsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // AI Builder state
  const [promptText, setPromptText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [missionForm, setMissionForm] = useState(null);
  const [savingMission, setSavingMission] = useState(false);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const list = await api.listMissions(true);
      setMissions(list);
      if (list.length > 0 && !selectedMissionId) {
        setSelectedMissionId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
  }, [user]);

  // Load applicants for selected mission
  useEffect(() => {
    if (!selectedMissionId) return;
    async function loadApplicants() {
      try {
        setLoadingApplicants(true);
        const data = await api.getMissionApplicants(selectedMissionId);
        setApplicantsData(data);
      } catch (err) {
        console.error('Failed to load applicants:', err);
      } finally {
        setLoadingApplicants(false);
      }
    }
    loadApplicants();
  }, [selectedMissionId]);

  // Feature 2: AI Parse Prompt
  const handleAIGenerate = async (textToUse) => {
    const text = textToUse || promptText;
    if (!text.trim()) {
      alert('Please enter a mission description in plain language.');
      return;
    }
    try {
      setAiParsing(true);
      setAiMessage('');
      const structured = await api.aiParseMission(text);
      setMissionForm(structured);
      setAiMessage('Gemini extracted structured mission details! Please review and edit before saving.');
    } catch (err) {
      console.warn('AI Parsing failed, falling back to empty form:', err);
      setMissionForm({
        title: '',
        cause: 'Food Relief',
        date: '2026-11-22',
        time_slot: 'Morning (09:00 - 13:00)',
        city: 'Lucknow',
        neighbourhood_name: 'Hazratganj',
        location_lat: 26.8467,
        location_lng: 80.9462,
        roles: [
          {
            role_name: 'Volunteer Assistant',
            required_skills: ['Communication'],
            people_needed: 5,
            beginner_friendly: true,
          },
        ],
      });
      setAiMessage('AI call unavailable or key unset. Loaded empty editable form for manual entry.');
    } finally {
      setAiParsing(false);
    }
  };

  // Save new mission
  const handleSaveMission = async (e) => {
    e.preventDefault();
    if (!missionForm) return;
    try {
      setSavingMission(true);
      const res = await api.createMission(missionForm);
      alert('Mission created successfully!');
      setMissionForm(null);
      setPromptText('');
      await loadMissions();
      setSelectedMissionId(res.id);
      setActiveTab('missions');
    } catch (err) {
      alert('Failed to save mission: ' + err.message);
    } finally {
      setSavingMission(false);
    }
  };

  // Feature 5: Update Applicant Status (Primary / Backup / Not Selected)
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await api.updateApplicationStatus(applicationId, newStatus);
      // Reload applicants
      const data = await api.getMissionApplicants(selectedMissionId);
      setApplicantsData(data);
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  // Feature 5: Invite Non-Applicant
  const handleInvite = async (volunteerId, roleId) => {
    try {
      const res = await api.inviteVolunteer(volunteerId, roleId);
      alert(res.message);
      // Reload applicants
      const data = await api.getMissionApplicants(selectedMissionId);
      setApplicantsData(data);
    } catch (err) {
      alert('Invite failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-[#0F2744] rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-[#0F9D8A] border border-teal-500/30 text-xs font-semibold">
                Organisation Portal
              </span>
              <span className="text-slate-300 text-xs font-medium">
                🏢 {user?.profile?.org_name || 'Community Organisation'} • {user?.profile?.location_city || 'Lucknow'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mission Command & Volunteer Selection
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Describe missions in natural language with Gemini AI, review ranked applicant matches, and select Primary/Backup crews.
            </p>
          </div>

          <button
            onClick={() => {
              setActiveTab('ai_builder');
              if (!missionForm) {
                setPromptText(SAMPLE_PROMPTS[0]);
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all self-start md:self-center"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            + AI Mission Builder
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4">
        <button
          onClick={() => setActiveTab('missions')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'missions'
              ? 'border-[#0F9D8A] text-[#0F2744]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-[#0F2744]" />
          Missions & Ranked Applicants
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {missions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ai_builder')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'ai_builder'
              ? 'border-[#0F9D8A] text-[#0F2744]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#0F9D8A]" />
          AI Mission Builder
        </button>
      </div>

      {/* TAB 1: MISSIONS & APPLICANTS */}
      {activeTab === 'missions' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading missions...</div>
          ) : missions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No missions created yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Use the AI Mission Builder to describe your first volunteer drive in plain English!
              </p>
              <button
                onClick={() => setActiveTab('ai_builder')}
                className="mt-4 px-4 py-2 bg-[#0F9D8A] text-white rounded-xl text-xs font-bold"
              >
                Open AI Mission Builder
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Mission Selector Sidebar */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Your Active Missions</h3>
                <div className="space-y-2">
                  {missions.map((m) => {
                    const isSelected = m.id === selectedMissionId;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMissionId(m.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#0F2744] text-white border-[#0F2744] shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSelected ? 'bg-teal-500/30 text-teal-200' : 'bg-teal-50 text-[#0F9D8A]'
                          }`}>
                            {m.cause}
                          </span>
                          <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>{m.date}</span>
                        </div>
                        <h4 className="text-sm font-bold truncate">{m.title}</h4>
                        <div className={`text-xs mt-1 truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          📍 {m.neighbourhood_name}, {m.city}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Mission Details & Applicants View */}
              <div className="lg:col-span-3 space-y-6">
                {loadingApplicants ? (
                  <div className="py-12 text-center text-slate-500">Loading applicant rankings...</div>
                ) : !applicantsData ? (
                  <div className="py-12 text-center text-slate-400">Select a mission to view applicants.</div>
                ) : (
                  <div className="space-y-6">
                    {/* Mission Header */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0F9D8A] border border-teal-200">
                              {applicantsData.cause}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-slate-500">Mission #{applicantsData.mission_id}</span>
                          </div>
                          <h2 className="text-2xl font-extrabold text-[#0F2744]">{applicantsData.title}</h2>
                        </div>
                        <div className="text-xs font-medium text-slate-600 space-y-0.5 text-left sm:text-right">
                          <div className="flex items-center sm:justify-end gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#0F9D8A]" />
                            <span>{applicantsData.date} ({applicantsData.time_slot})</span>
                          </div>
                          <div className="flex items-center sm:justify-end gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-[#F28C28]" />
                            <span>{applicantsData.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Per-Role Applicants */}
                      <div className="space-y-8">
                        {applicantsData.roles.map((role) => (
                          <div key={role.role_id} className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-extrabold text-[#0F2744]">{role.role_name}</h3>
                                  {role.beginner_friendly && (
                                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      🌱 Beginner Friendly
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Requires: {role.required_skills?.join(', ') || 'No specific skills required'} • Target: {role.people_needed} volunteers
                                </div>
                              </div>
                              <span className="text-xs font-bold text-[#0F9D8A] px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200">
                                {role.applicants.length} Applicants
                              </span>
                            </div>

                            {/* Applicants Ranked List */}
                            {role.applicants.length === 0 ? (
                              <div className="p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                No direct applications for this role yet. See top-matched volunteers below to invite them!
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {role.applicants.map((applicant) => {
                                  const score = applicant.match_score;
                                  return (
                                    <div
                                      key={applicant.application_id}
                                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-sm text-[#0F2744]">{applicant.name}</span>
                                            <span className="text-xs text-slate-400">({applicant.age} yrs)</span>
                                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold capitalize">
                                              {applicant.experience_level}
                                            </span>
                                            {applicant.willingness_to_learn && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-[#0F9D8A] font-bold">
                                                Eager Learner
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-slate-500 mt-0.5">
                                            📍 {applicant.neighbourhood_name} • Skills: {applicant.skills?.join(', ') || 'None listed'}
                                          </div>
                                        </div>

                                        {/* Match Score & Selection Action */}
                                        <div className="flex items-center gap-3">
                                          <div className="text-right">
                                            <div className="text-lg font-black text-[#0F9D8A] leading-none">{score}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">Score / 100</div>
                                          </div>

                                          {/* Status Actions: Primary, Backup, Not Selected */}
                                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                            <button
                                              onClick={() => handleUpdateStatus(applicant.application_id, 'selected_primary')}
                                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                                applicant.status === 'selected_primary'
                                                  ? 'bg-emerald-600 text-white shadow-xs'
                                                  : 'text-slate-600 hover:text-emerald-700'
                                              }`}
                                            >
                                              Primary
                                            </button>
                                            <button
                                              onClick={() => handleUpdateStatus(applicant.application_id, 'selected_backup')}
                                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                                applicant.status === 'selected_backup'
                                                  ? 'bg-[#F28C28] text-white shadow-xs'
                                                  : 'text-slate-600 hover:text-[#F28C28]'
                                              }`}
                                            >
                                              Backup
                                            </button>
                                            <button
                                              onClick={() => handleUpdateStatus(applicant.application_id, 'not_selected')}
                                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                                applicant.status === 'not_selected'
                                                  ? 'bg-slate-700 text-white shadow-xs'
                                                  : 'text-slate-400 hover:text-red-600'
                                              }`}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Small breakdown snippet */}
                                      <div className="pt-2 border-t border-slate-100">
                                        <MatchBreakdownBar breakdown={applicant.breakdown} totalScore={score} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Top Matched Non-Applicants: Invite to Apply (Feature 5) */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-[#0F9D8A]" />
                                  Top Matched Community Volunteers (Haven't Applied Yet)
                                </h4>
                                <span className="text-[11px] text-slate-400">Deterministic Engine Recommendations</span>
                              </div>

                              {role.matched_non_applicants?.length === 0 ? (
                                <div className="text-xs text-slate-400 italic">No additional eligible matches in database.</div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {role.matched_non_applicants.map((candidate) => (
                                    <div
                                      key={candidate.volunteer_id}
                                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                                    >
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-slate-800">{candidate.name}</span>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 text-[#0F9D8A] font-bold">
                                            {candidate.match_score} pts
                                          </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          📍 {candidate.neighbourhood_name} ({candidate.distance_km}km) • {candidate.experience_level}
                                        </div>
                                      </div>

                                      <button
                                        onClick={() => handleInvite(candidate.volunteer_id, role.role_id)}
                                        className="px-2.5 py-1.5 rounded-lg bg-[#0F2744] hover:bg-[#0A1B30] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                                      >
                                        <UserPlus className="w-3 h-3 text-[#0F9D8A]" /> Invite
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI MISSION BUILDER (FEATURE 2) */}
      {activeTab === 'ai_builder' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Natural Language Prompt Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F2744] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#0F9D8A]" /> AI Mission Builder
                </h2>
                <p className="text-sm text-slate-500">
                  Type your mission in plain language. Gemini AI will structure it into dates, coordinates, and roles with required skills.
                </p>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-[#0F9D8A] font-semibold text-xs rounded-full border border-teal-200">
                Gemini API Powered
              </span>
            </div>

            {/* Prompt input */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Describe your community drive in natural language:
              </label>
              <textarea
                rows="3"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. We need 10 people for a food distribution drive in Lucknow this Sunday morning"
                className="w-full p-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A] shadow-inner"
              />

              {/* Sample Prompts */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">Example Prompts:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PROMPTS.map((sp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPromptText(sp);
                        handleAIGenerate(sp);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-left truncate max-w-md"
                    >
                      "{sp}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={aiParsing}
                  onClick={() => handleAIGenerate()}
                  className="px-6 py-2.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  {aiParsing ? 'Gemini AI is Structuring...' : 'Generate with Gemini'}
                </button>
              </div>
            </div>
          </div>

          {/* Result: Editable Mission Form before saving */}
          {aiMessage && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-[#0F2744] text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-[#0F9D8A]" /> {aiMessage}
            </div>
          )}

          {missionForm && (
            <form onSubmit={handleSaveMission} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-[#0F2744]">Review & Edit Structured Mission</h3>
                <p className="text-xs text-slate-500">Correct any details before publishing to community volunteers.</p>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mission Title *</label>
                  <input
                    type="text"
                    required
                    value={missionForm.title}
                    onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Cause *</label>
                  <input
                    type="text"
                    required
                    value={missionForm.cause}
                    onChange={(e) => setMissionForm({ ...missionForm, cause: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mission Date (YYYY-MM-DD) *</label>
                  <input
                    type="text"
                    required
                    value={missionForm.date}
                    onChange={(e) => setMissionForm({ ...missionForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <input
                    type="text"
                    required
                    value={missionForm.time_slot}
                    onChange={(e) => setMissionForm({ ...missionForm, time_slot: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={missionForm.city}
                    onChange={(e) => setMissionForm({ ...missionForm, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Neighbourhood Area</label>
                  <input
                    type="text"
                    value={missionForm.neighbourhood_name}
                    onChange={(e) => setMissionForm({ ...missionForm, neighbourhood_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={missionForm.location_lat}
                    onChange={(e) => setMissionForm({ ...missionForm, location_lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={missionForm.location_lng}
                    onChange={(e) => setMissionForm({ ...missionForm, location_lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                  />
                </div>
              </div>

              {/* Roles Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mission Roles</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMissionForm({
                        ...missionForm,
                        roles: [
                          ...missionForm.roles,
                          {
                            role_name: 'Volunteer Assistant',
                            required_skills: ['Teamwork'],
                            people_needed: 4,
                            beginner_friendly: true,
                          },
                        ],
                      });
                    }}
                    className="text-xs text-[#0F9D8A] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Role
                  </button>
                </div>

                <div className="space-y-3">
                  {missionForm.roles.map((r, rIdx) => (
                    <div key={rIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role Title</label>
                          <input
                            type="text"
                            required
                            value={r.role_name}
                            onChange={(e) => {
                              const updated = [...missionForm.roles];
                              updated[rIdx].role_name = e.target.value;
                              setMissionForm({ ...missionForm, roles: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">People Needed</label>
                          <input
                            type="number"
                            min="1"
                            value={r.people_needed}
                            onChange={(e) => {
                              const updated = [...missionForm.roles];
                              updated[rIdx].people_needed = parseInt(e.target.value) || 1;
                              setMissionForm({ ...missionForm, roles: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Required Skills (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={r.required_skills?.join(', ') || ''}
                            onChange={(e) => {
                              const updated = [...missionForm.roles];
                              updated[rIdx].required_skills = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean);
                              setMissionForm({ ...missionForm, roles: updated });
                            }}
                            placeholder="e.g. Packaging, Logistics"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={r.beginner_friendly}
                              onChange={(e) => {
                                const updated = [...missionForm.roles];
                                updated[rIdx].beginner_friendly = e.target.checked;
                                setMissionForm({ ...missionForm, roles: updated });
                              }}
                              className="w-4 h-4 rounded text-[#0F9D8A] focus:ring-[#0F9D8A]"
                            />
                            <span className="text-xs font-bold text-slate-700">🌱 Beginner Friendly</span>
                          </label>

                          {missionForm.roles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = missionForm.roles.filter((_, i) => i !== rIdx);
                                setMissionForm({ ...missionForm, roles: updated });
                              }}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMissionForm(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMission}
                  className="px-6 py-2.5 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#0F9D8A]" />
                  {savingMission ? 'Publishing...' : 'Save & Publish Mission'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

