import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import VolunteerDashboard from './components/VolunteerDashboard';
import OrganisationDashboard from './components/OrganisationDashboard';
import AuthModal from './components/AuthModal';
import {
  HeartHandshake,
  Sparkles,
  Target,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Calendar,
  Compass,
  Award,
} from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null
  const [authRole, setAuthRole] = useState('volunteer');

  const openAuth = (mode, role = 'volunteer') => {
    setAuthRole(role);
    setAuthModal(mode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F2744] mx-auto flex items-center justify-center text-white shadow-md animate-pulse">
            <HeartHandshake className="w-7 h-7 text-[#0F9D8A]" />
          </div>
          <div className="text-sm font-bold text-[#0F2744]">Loading SevaPath...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-teal-100 selection:text-teal-900">
      <Navbar onOpenAuthModal={(mode) => openAuth(mode)} />

      {/* Main Content Area */}
      <main className="flex-1">
        {user ? (
          user.role === 'organisation' ? (
            <OrganisationDashboard />
          ) : (
            <VolunteerDashboard />
          )
        ) : (
          /* Real Production Landing Page */
          <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto space-y-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#0F9D8A] text-xs font-bold tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" /> Next-Generation Community Volunteering
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-black text-[#0F2744] tracking-tight leading-[1.15]">
                    Where Local Goodwill <br />
                    Meets <span className="text-[#0F9D8A]">Real Impact</span>
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
                    SevaPath connects verified community organisations with local volunteers using a transparent,
                    weighted 100-point matching engine and generative AI for plain-language mission drafting.
                  </p>

                  {/* Call to Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => openAuth('signup', 'volunteer')}
                      className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Join as a Volunteer</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openAuth('signup', 'organisation')}
                      className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0F2744] hover:bg-[#0A1B30] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-[#0F9D8A]" />
                      <span>Post a Community Mission</span>
                    </button>
                  </div>

                  {/* Quick Sign-In Link */}
                  <p className="text-xs text-slate-500 pt-2">
                    Already registered?{' '}
                    <button
                      onClick={() => openAuth('login')}
                      className="text-[#0F2744] font-bold hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            </section>

            {/* Core Value Pillars */}
            <section className="py-16 bg-white border-y border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0F2744]">
                    Engineered for Precision & Trust
                  </h2>
                  <p className="text-sm text-slate-500 mt-2">
                    Community mobilization without guesswork, black boxes, or missed connections.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Pillar 1 */}
                  <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 text-[#0F9D8A] flex items-center justify-center font-bold">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-[#0F2744] text-lg">Transparent 100-pt Scoring</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Every volunteer and mission role is evaluated against 6 deterministic factors: skills (30),
                      Haversine travel distance (20), availability (20), causes (10), experience (10), and learning eagerness (10).
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-[#0F2744] text-lg">Inclusive Beginner Path</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Beginner-friendly missions never penalize a lack of prior experience. Full experience points are
                      transferred directly to enthusiasm and willingness to learn, opening doors for first-time volunteers.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-7 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-[#0F2744] text-lg">AI-Powered Efficiency</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Organisations type missions in natural language and Gemini converts them into structured requirements.
                      Volunteers receive a personalized one-sentence explanation on exactly why each mission fits them.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="py-16 sm:py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-14">
                  <span className="text-xs font-bold text-[#0F9D8A] uppercase tracking-wider">How SevaPath Works</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0F2744] mt-1">
                    Three Steps to Meaningful Community Action
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="w-8 h-8 rounded-full bg-[#0F2744] text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h4 className="font-bold text-[#0F2744] text-base">Create Your Profile</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Specify your skills, causes you support, weekly availability, and travel radius. Organisations define roles and headcount needed.
                    </p>
                  </div>

                  <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="w-8 h-8 rounded-full bg-[#0F9D8A] text-white flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h4 className="font-bold text-[#0F2744] text-base">Intelligent Matchmaking</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our deterministic engine calculates exact fit percentages and distance, accompanied by personalized Gemini AI explanations.
                    </p>
                  </div>

                  <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="w-8 h-8 rounded-full bg-[#F28C28] text-white flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h4 className="font-bold text-[#0F2744] text-base">Apply & Mobilize</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Volunteers apply in 1 click or receive direct invitations from organisations. Teams are confirmed with Primary and Backup crews.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom CTA Banner */}
            <section className="bg-[#0F2744] text-white py-14">
              <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Ready to Make a Real Difference in Your City?
                </h2>
                <p className="text-sm text-slate-300 max-w-xl mx-auto font-normal">
                  Whether you have two hours this Sunday or need dedicated volunteers for a grassroots campaign, SevaPath is your bridge.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => openAuth('signup')}
                    className="px-6 py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white font-bold text-sm shadow-md transition-all"
                  >
                    Get Started Now
                  </button>
                  <button
                    onClick={() => openAuth('login')}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-black text-[#0F2744] text-sm">SevaPath</span>
            <span>• Community Volunteer Platform</span>
          </div>
          <div>
            Powered by Deterministic Matching & Gemini AI
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
