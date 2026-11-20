import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { HeartHandshake, User, Building2, X, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState(initialMode); // login | signup
  const [role, setRole] = useState('volunteer'); // volunteer | organisation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup({
          email,
          password,
          role,
          name: role === 'volunteer' ? name : undefined,
          org_name: role === 'organisation' ? name : undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0F2744] mx-auto flex items-center justify-center text-white shadow-md mb-3">
            <HeartHandshake className="w-7 h-7 text-[#0F9D8A]" />
          </div>
          <h2 className="text-2xl font-black text-[#0F2744]">
            {mode === 'login' ? 'Welcome Back' : 'Join SevaPath'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Sign in to access your volunteer or organization dashboard'
              : 'Connect with community initiatives across Lucknow'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              {/* Role Selector at signup */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">I am joining as: *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('volunteer')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      role === 'volunteer'
                        ? 'bg-teal-50 border-[#0F9D8A] text-[#0F9D8A] ring-2 ring-teal-200 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <User className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Volunteer</div>
                      <div className="text-[10px] text-slate-400 font-normal">Offer time & skills</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('organisation')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      role === 'organisation'
                        ? 'bg-slate-100 border-[#0F2744] text-[#0F2744] ring-2 ring-slate-300 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Organisation</div>
                      <div className="text-[10px] text-slate-400 font-normal">Organise drives</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {role === 'volunteer' ? 'Full Name' : 'Organisation Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={role === 'volunteer' ? 'e.g. Aarav Sharma' : 'e.g. Seva Relief Foundation'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A] transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F9D8A] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In to SevaPath' : 'Create Account'}
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
          {mode === 'login' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className="font-bold text-[#0F9D8A] hover:underline"
              >
                Sign up free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="font-bold text-[#0F9D8A] hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
