import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import MatchBreakdownBar from './MatchBreakdownBar';
import VolunteerProfileView from './VolunteerProfileView';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Clock4,
  AlertCircle,
  Award,
  ArrowRight,
  User,
  Heart,
  Send,
  RefreshCw,
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recommendations'); // recommendations | applications | profile
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingRoleId, setApplyingRoleId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, apps] = await Promise.all([
        api.getRecommendations(),
        api.getMyApplications(),
      ]);
      setRecommendations(recs);
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleApply = async (roleId) => {
    try {
      setApplyingRoleId(roleId);
      setActionMessage('');
      const res = await api.applyToRole(roleId);
      setActionMessage(res.message);
      await loadData();
    } catch (err) {
      alert('Application failed: ' + err.message);
    } finally {
      setApplyingRoleId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'selected_primary':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selected: Primary Role
          </span>
        );
      case 'selected_backup':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#F28C28] border border-orange-300 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-[#F28C28]" /> Selected: Backup Role
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Invited by Organisation!
          </span>
        );
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <Clock4 className="w-3.5 h-3.5 text-sky-600" /> Application Under Review
          </span>
        );
      case 'not_selected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Not Selected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Bar */}
      <div className="bg-[#0F2744] rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-[#0F9D8A] border border-teal-500/30 text-xs font-semibold">
                Volunteer Portal
              </span>
              <span className="text-slate-300 text-xs font-medium">
                📍 {user?.profile?.neighbourhood_name || 'Lucknow'} ({user?.profile?.max_distance_km || 10}km radius)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.profile?.name || 'Volunteer'}!
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Deterministic matching engine actively connects your unique skills, availability, and travel radius with verified community missions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Matches
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white text-xs font-bold transition-all shadow-sm"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'recommendations'
              ? 'border-[#0F9D8A] text-[#0F2744]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#0F9D8A]" />
          Recommended Missions
          <span className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-[#0F9D8A] font-bold border border-teal-200">
            {recommendations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'applications'
              ? 'border-[#0F9D8A] text-[#0F2744]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4 text-[#0F2744]" />
          My Applications & Invites
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold border border-slate-200">
            {applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-[#0F9D8A] text-[#0F2744]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4 text-[#0F2744]" />
          Volunteer Profile
        </button>
      </div>

      {/* TAB 1: RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F9D8A]" />
              Calculating deterministic matching scores & generating explanations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No active eligible missions found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                You may be outside the travel distance or your available days don't match the mission dates.
                Try expanding your travel distance in your profile!
              </p>
              <button
                onClick={() => setActiveTab('profile')}
                className="mt-4 px-4 py-2 bg-[#0F9D8A] text-white rounded-xl text-xs font-bold"
              >
                Update Profile Radius
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((item) => {
                const score = item.match_score;
                const isHighMatch = score >= 75;

                return (
                  <div
                    key={`${item.mission_id}-${item.role_id}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-6 sm:p-7 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0F9D8A] border border-teal-200">
                              {item.mission_cause}
                            </span>
                            {item.beginner_friendly && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                🌱 Beginner Friendly
                              </span>
                            )}
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-slate-600">{item.org_name}</span>
                          </div>

                          <h2 className="text-xl font-extrabold text-[#0F2744] tracking-tight pt-1">
                            {item.role_name}
                          </h2>
                          <p className="text-sm text-slate-600 font-medium">
                            Part of: <span className="font-semibold text-slate-800">{item.mission_title}</span>
                          </p>
                        </div>

                        {/* Match Score Badge */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-2xs ${
                            isHighMatch
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-teal-50 border-teal-300 text-[#0F9D8A]'
                          }`}>
                            <div className="text-right">
                              <div className="text-2xl font-black leading-none">{score}</div>
                              <div className="text-[10px] uppercase font-bold tracking-wider">Match Score</div>
                            </div>
                            <Sparkles className="w-5 h-5 text-[#F28C28]" />
                          </div>
                          {item.application_status && getStatusBadge(item.application_status)}
                        </div>
                      </div>

                      {/* Metadata bar */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Calendar className="w-4 h-4 text-[#0F9D8A]" />
                          <span>{item.mission_date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-700">
                          <Clock className="w-4 h-4 text-[#0F9D8A]" />
                          <span>{item.mission_time_slot}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-4 h-4 text-[#F28C28]" />
                          <span>{item.neighbourhood_name}, {item.city}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                            {item.distance_km} km away
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body: Explainable AI & Breakdown */}
                    <div className="p-6 sm:p-7 space-y-5 bg-slate-50/50">
                      {/* One-sentence "Why this fits you" Explanation */}
                      <div className="bg-gradient-to-r from-teal-50/80 to-sky-50/80 rounded-xl p-4 border border-teal-200/80 relative">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0F9D8A] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            <Sparkles className="w-4 h-4 text-amber-200" />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-[#0F9D8A] uppercase tracking-wider mb-0.5">
                              Why this fits you
                            </div>
                            <p className="text-sm font-semibold text-slate-800 italic">
                              "{item.why_fits_you}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Factor Breakdown Bars */}
                      <MatchBreakdownBar breakdown={item.breakdown} totalScore={score} />

                      {/* Required skills & Apply CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-600">Required Skills:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.required_skills?.length > 0 ? (
                              item.required_skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-700"
                                >
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">None required (open to all)</span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3">
                          {item.application_status === 'invited' ? (
                            <button
                              onClick={() => handleApply(item.role_id)}
                              disabled={applyingRoleId === item.role_id}
                              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                            >
                              <Sparkles className="w-4 h-4 text-amber-300" /> Accept Invitation & Apply
                            </button>
                          ) : item.application_status ? (
                            <div className="text-xs font-bold text-slate-500 py-2">
                              Already recorded ({item.application_status.replace('_', ' ')})
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApply(item.role_id)}
                              disabled={applyingRoleId === item.role_id}
                              className="px-6 py-2.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                            >
                              {applyingRoleId === item.role_id ? 'Submitting...' : 'Apply for this Role'}
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Send className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No applications yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Explore the recommended missions feed to discover matching volunteer opportunities.
              </p>
              <button
                onClick={() => setActiveTab('recommendations')}
                className="mt-4 px-4 py-2 bg-[#0F9D8A] text-white rounded-xl text-xs font-bold"
              >
                Browse Recommended Missions
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F2744]">Your Application History</h3>
                <span className="text-xs text-slate-500">Live Status Tracker</span>
              </div>
              <div className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <div key={app.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-500">Mission:</span>
                        <span className="text-xs font-bold text-slate-800">{app.mission_title}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">{app.mission_date}</span>
                      </div>
                      <h4 className="text-lg font-bold text-[#0F2744]">{app.role_name}</h4>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                        <span>Deterministic Match Score:</span>
                        <span className="font-bold text-[#0F9D8A]">{app.match_score}/100</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(app.status)}
                      {app.status === 'invited' && (
                        <button
                          onClick={() => handleApply(app.mission_role_id)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VOLUNTEER PROFILE */}
      {activeTab === 'profile' && (
        <VolunteerProfileView onSaved={loadData} />
      )}
    </div>
  );
}

