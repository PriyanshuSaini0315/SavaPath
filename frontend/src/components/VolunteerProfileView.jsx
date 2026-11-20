import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { User, MapPin, Sparkles, Check, Plus, X, Save, AlertCircle } from 'lucide-react';

const COMMON_INTERESTS = [
  'Food Relief',
  'Education',
  'Environment',
  'Healthcare',
  'Animal Welfare',
  'Disaster Relief',
  'Youth Development',
  'Community Care',
];

const COMMON_SKILLS = [
  'Packaging',
  'Cooking',
  'Hygiene & Sanitation',
  'Logistics',
  'Driving',
  'Teaching',
  'Basic Math',
  'First Aid',
  'Coding',
  'Data Entry',
  'Communication',
  'Crowd Control',
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];

const LUCKNOW_NEIGHBOURHOODS = [
  { name: 'Hazratganj', lat: 26.8467, lng: 80.9462 },
  { name: 'Gomti Nagar', lat: 26.8530, lng: 80.9980 },
  { name: 'Alambagh', lat: 26.8140, lng: 80.8980 },
  { name: 'Indira Nagar', lat: 26.8830, lng: 80.9850 },
  { name: 'Mahanagar', lat: 26.8720, lng: 80.9520 },
  { name: 'Chowk', lat: 26.8680, lng: 80.9080 },
  { name: 'Vikas Nagar', lat: 26.8920, lng: 80.9620 },
];

export default function VolunteerProfileView({ onSaved }) {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    age: 22,
    contact: '',
    interests: [],
    skills: [],
    experience_level: 'beginner',
    availability: { days: ['Saturday', 'Sunday'], hours: ['Morning'] },
    location_lat: 26.8467,
    location_lng: 80.9462,
    neighbourhood_name: 'Hazratganj',
    max_distance_km: 10,
    willingness_to_learn: true,
  });

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const data = await api.getVolunteerProfile();
        setForm({
          name: data.name || '',
          age: data.age || 20,
          contact: data.contact || '',
          interests: data.interests || [],
          skills: data.skills || [],
          experience_level: data.experience_level || 'beginner',
          availability: data.availability || { days: ['Sunday'], hours: ['Morning'] },
          location_lat: data.location_lat ?? 26.8467,
          location_lng: data.location_lng ?? 80.9462,
          neighbourhood_name: data.neighbourhood_name || 'Hazratganj',
          max_distance_km: data.max_distance_km ?? 10,
          willingness_to_learn: data.willingness_to_learn ?? true,
        });
      } catch (err) {
        setError('Failed to load profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleNeighbourhoodPreset = (nh) => {
    setForm((prev) => ({
      ...prev,
      neighbourhood_name: nh.name,
      location_lat: nh.lat,
      location_lng: nh.lng,
    }));
  };

  const toggleInterest = (interest) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists ? prev.interests.filter((i) => i !== interest) : [...prev.interests, interest],
      };
    });
  };

  const addCustomInterest = () => {
    if (!newInterest.trim()) return;
    if (!form.interests.includes(newInterest.trim())) {
      setForm((prev) => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }));
    }
    setNewInterest('');
  };

  const toggleSkill = (skill) => {
    setForm((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  };

  const addCustomSkill = () => {
    if (!newSkill.trim()) return;
    if (!form.skills.includes(newSkill.trim())) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
    }
    setNewSkill('');
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const curDays = prev.availability?.days || [];
      const exists = curDays.includes(day);
      return {
        ...prev,
        availability: {
          ...prev.availability,
          days: exists ? curDays.filter((d) => d !== day) : [...curDays, day],
        },
      };
    });
  };

  const toggleHour = (hour) => {
    setForm((prev) => {
      const curHours = prev.availability?.hours || [];
      const exists = curHours.includes(hour);
      return {
        ...prev,
        availability: {
          ...prev.availability,
          hours: exists ? curHours.filter((h) => h !== hour) : [...curHours, hour],
        },
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.updateVolunteerProfile(form);
      await refreshUser();
      setMessage('Profile updated successfully! Match scores have updated.');
      if (onSaved) onSaved();
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading volunteer profile...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F2744]">Volunteer Profile</h2>
          <p className="text-sm text-slate-500">
            Keep your skills, location, and availability current to receive the best match recommendations.
          </p>
        </div>
        <span className="px-3 py-1 bg-teal-50 text-[#0F9D8A] font-semibold text-xs rounded-full border border-teal-200">
          Profile Settings
        </span>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Age *</label>
            <input
              type="number"
              min="14"
              max="99"
              required
              value={form.age}
              onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 18 })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact (Phone/Email) *</label>
            <input
              type="text"
              required
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
            />
          </div>
        </div>

        {/* Experience Level & Willingness to learn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Experience Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'beginner', label: 'Beginner', desc: 'New to field work' },
                { id: 'some', label: 'Some', desc: 'Participated before' },
                { id: 'experienced', label: 'Experienced', desc: 'Lead / specialized' },
              ].map((lvl) => (
                <button
                  type="button"
                  key={lvl.id}
                  onClick={() => setForm({ ...form, experience_level: lvl.id })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    form.experience_level === lvl.id
                      ? 'bg-white border-[#0F9D8A] ring-2 ring-teal-200 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`text-xs font-bold ${form.experience_level === lvl.id ? 'text-[#0F9D8A]' : 'text-slate-800'}`}>
                    {lvl.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Beginner-friendly missions never penalize beginner level if willingness to learn is checked.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Willingness to Learn New Skills?</label>
            <div className="flex items-center space-x-3 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.willingness_to_learn}
                  onChange={(e) => setForm({ ...form, willingness_to_learn: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F9D8A]"></div>
              </label>
              <span className="text-sm font-semibold text-slate-800">
                {form.willingness_to_learn ? 'Yes, eager to learn (Full 10/10 Eagerness)' : 'No (0/10 Eagerness)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Gives full experience fit bonus on all beginner-friendly roles!
            </p>
          </div>
        </div>

        {/* Causes & Interests */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Causes of Interest (Cause Fit: 10 pts)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_INTERESTS.map((item) => {
              const active = form.interests.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? 'bg-teal-50 border-[#0F9D8A] text-[#0F9D8A] font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {item} {active && '✓'}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 max-w-sm mt-2">
            <input
              type="text"
              placeholder="Add other cause..."
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomInterest();
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 flex-1 focus:outline-none focus:border-[#0F9D8A]"
            />
            <button
              type="button"
              onClick={addCustomInterest}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Skills (Skill Fit: 30 pts)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {COMMON_SKILLS.map((item) => {
              const active = form.skills.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleSkill(item)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {item} {active && '✓'}
                </button>
              );
            })}
            {form.skills
              .filter((s) => !COMMON_SKILLS.includes(s))
              .map((custom) => (
                <span
                  key={custom}
                  className="text-xs px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold flex items-center gap-1"
                >
                  {custom}
                  <button type="button" onClick={() => toggleSkill(custom)}>
                    <X className="w-3 h-3 hover:text-red-600" />
                  </button>
                </span>
              ))}
          </div>
          <div className="flex gap-2 max-w-sm mt-2">
            <input
              type="text"
              placeholder="Add custom skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSkill();
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 flex-1 focus:outline-none focus:border-[#0F9D8A]"
            />
            <button
              type="button"
              onClick={addCustomSkill}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <label className="block text-xs font-bold text-slate-700">Availability (20 pts + Eligibility Gate)</label>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Available Days:</div>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const active = form.availability?.days?.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                      active
                        ? 'bg-[#0F2744] text-white border-[#0F2744]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Preferred Hours:</div>
            <div className="flex flex-wrap gap-1.5">
              {TIME_SLOTS.map((hour) => {
                const active = form.availability?.hours?.includes(hour);
                return (
                  <button
                    type="button"
                    key={hour}
                    onClick={() => toggleHour(hour)}
                    className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location & Radius */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0F9D8A]" /> Location & Travel Radius (20 pts + Eligibility Gate)
            </label>
            <span className="text-xs text-slate-500 font-medium">Quick Lucknow Presets:</span>
          </div>

          {/* Quick Neighbourhood Presets */}
          <div className="flex flex-wrap gap-1.5">
            {LUCKNOW_NEIGHBOURHOODS.map((nh) => (
              <button
                type="button"
                key={nh.name}
                onClick={() => handleNeighbourhoodPreset(nh)}
                className={`text-[11px] px-2.5 py-1 rounded-md border ${
                  form.neighbourhood_name === nh.name
                    ? 'bg-[#0F9D8A] text-white border-[#0F9D8A] font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {nh.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Neighbourhood Area</label>
              <input
                type="text"
                value={form.neighbourhood_name}
                onChange={(e) => setForm({ ...form, neighbourhood_name: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.location_lat}
                onChange={(e) => setForm({ ...form, location_lat: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={form.location_lng}
                onChange={(e) => setForm({ ...form, location_lng: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0F9D8A]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
              <span>Maximum Travel Distance:</span>
              <span className="text-[#0F9D8A] font-bold">{form.max_distance_km} km</span>
            </div>
            <input
              type="range"
              min="2"
              max="40"
              step="1"
              value={form.max_distance_km}
              onChange={(e) => setForm({ ...form, max_distance_km: parseFloat(e.target.value) })}
              className="w-full accent-[#0F9D8A] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>2 km</span>
              <span>10 km</span>
              <span>25 km</span>
              <span>40 km</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#0F9D8A] hover:bg-[#0C8575] text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

