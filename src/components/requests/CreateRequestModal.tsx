import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Calendar, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Skill } from '../../types/index.ts';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (request: any) => void;
  initialSkill?: string;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialSkill
}) => {
  const { user } = useAuth();
  const [catalogSkills, setCatalogSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Education');
  const [skillName, setSkillName] = useState(initialSkill || 'Computer Teaching');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [durationHours, setDurationHours] = useState(1.0);
  const [locationName, setLocationName] = useState(user?.city ? `${user.city}, ${user.district}` : 'Nallur, Jaffna');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSkill) setSkillName(initialSkill);
    const fetchCatalog = async () => {
      try {
        const skills = await api.getCatalogSkills();
        setCatalogSkills(skills || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCatalog();
  }, [initialSkill]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const availableCredits = user?.availableCredits ?? 0;
    if (availableCredits < durationHours) {
      setError(`Insufficient time credits. You have ${availableCredits.toFixed(1)} credits, but this request requires ${durationHours} credit(s). Offer a service first to earn credits!`);
      return;
    }

    setLoading(true);
    try {
      const matchSkill = catalogSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
      const res = await api.createRequest({
        title,
        category,
        skillId: matchSkill?.id,
        skillName,
        description,
        preferredDate,
        preferredTime,
        durationHours,
        creditsOffered: durationHours,
        locationName,
        latitude: user?.latitude || 9.6749,
        longitude: user?.longitude || 80.0292,
        additionalNotes
      });
      onCreated(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create help request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#EAE7F6] overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">Community Exchange</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white">Request Help From Members</h3>
          <p className="text-xs text-purple-100/90 mt-1">
            Exchange your time credits for valuable neighborly help
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Help Request Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need patient computer lessons for spreadsheet tracking"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800 font-medium"
              >
                <option value="Education">Education</option>
                <option value="Technology">Technology</option>
                <option value="Creative">Creative</option>
                <option value="Culinary">Culinary</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Trades & Maintenance">Trades & Maintenance</option>
                <option value="Health">Health</option>
                <option value="Caregiving">Caregiving</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Required Skill *</label>
              <input
                type="text"
                required
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. Computer Teaching"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Date *</label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Preferred Time *</label>
              <input
                type="text"
                required
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                placeholder="e.g. 10:00 AM or 3:30 PM"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Duration &amp; Credits Offered</label>
              <div className="flex items-center gap-2">
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800 font-bold"
                >
                  <option value={1.0}>1 Hour = 1.0 Credit</option>
                  <option value={1.5}>1.5 Hours = 1.5 Credits</option>
                  <option value={2.0}>2 Hours = 2.0 Credits</option>
                  <option value={3.0}>3 Hours = 3.0 Credits</option>
                  <option value={4.0}>4 Hours = 4.0 Credits</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Location / Venue *</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Nallur Community Center, Jaffna"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what assistance you need, goals for the session, and any materials available..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
            />
          </div>

          <div className="p-3 bg-[#F2ECFF] rounded-2xl border border-[#6C3FC5]/20 flex items-center justify-between text-xs text-[#452080]">
            <span>Your Available Wallet Balance:</span>
            <span className="font-extrabold text-[#6C3FC5]">
              {(user?.availableCredits ?? 0).toFixed(1)} Time Credits
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold shadow-md shadow-[#6C3FC5]/20 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Publishing Request...' : 'Publish Help Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
