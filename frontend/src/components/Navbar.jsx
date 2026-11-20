import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { HeartHandshake, User, Building2, LogOut, Sparkles, ChevronDown } from 'lucide-react';

export default function Navbar({ onOpenAuthModal, onNavigate }) {
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const displayName = user
    ? user.role === 'volunteer'
      ? user.profile?.name || 'Volunteer'
      : user.profile?.org_name || 'Organisation'
    : '';

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate && onNavigate('home')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0F2744] flex items-center justify-center text-white shadow-sm group-hover:bg-[#0A1B30] transition-colors">
            <HeartHandshake className="w-6 h-6 text-[#0F9D8A]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-[#0F2744]">SevaPath</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-[#0F9D8A] font-bold border border-teal-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Matched
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Community Volunteer Network
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0F9D8A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {getInitials(displayName)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-[#0F2744] leading-tight max-w-[140px] truncate">
                    {displayName}
                  </div>
                  <div className="text-[10px] capitalize text-slate-500 font-semibold flex items-center gap-1">
                    {user.role === 'organisation' ? (
                      <span className="text-[#0F2744] font-bold">Community Organisation</span>
                    ) : (
                      <span className="text-[#0F9D8A] font-bold">Volunteer Member</span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#0F2744] truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="text-xs sm:text-sm font-bold text-[#0F2744] hover:text-[#0F9D8A] px-3 py-2 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="text-xs sm:text-sm font-bold text-white bg-[#0F9D8A] hover:bg-[#0C8575] px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                Join SevaPath
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
