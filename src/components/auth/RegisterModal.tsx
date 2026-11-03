import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, MapPin, Sparkles, Navigation, Plus, Trash2, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface RegisterModalProps {
  onOpenLogin?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onOpenLogin }) => {
  const { showRegisterModal, setShowRegisterModal, register } = useAuth();

  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [accountType, setAccountType] = useState<'INDIVIDUAL' | 'COMMUNITY' | 'ORGANIZATION'>('INDIVIDUAL');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [district, setDistrict] = useState('Jaffna');
  const [city, setCity] = useState('Nallur');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 9.6749, lng: 80.0292 });
  const [locating, setLocating] = useState(false);

  // Dynamic skills list
  const [skills, setSkills] = useState<Array<{ skillName: string; level: string; description: string }>>([
    { skillName: 'Computer Teaching', level: 'INTERMEDIATE', description: 'Assisting beginners with computers, typing, and online forms' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showRegisterModal) return null;

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleAddSkill = () => {
    setSkills([...skills, { skillName: '', level: 'INTERMEDIATE', description: '' }]);
  };

  const handleRemoveSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const handleSkillChange = (idx: number, field: string, value: string) => {
    const updated = [...skills];
    (updated[idx] as any)[field] = value;
    setSkills(updated);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setProfilePhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        country,
        district,
        city,
        bio,
        accountType,
        profilePhotoData: profilePhoto,
        currentLocation: {
          lat: coords.lat,
          lng: coords.lng,
          address: `${city}, ${district}, ${country}`
        },
        skills: skills.filter(s => s.skillName.trim())
      });

      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#EAE7F6] overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
          <button
            onClick={() => setShowRegisterModal(false)}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">New Registration</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white">Join Time Bank Community</h3>
          <p className="text-xs text-purple-100/90 mt-1">Exchange your skills and earn time credits without using money</p>
        </div>

        {/* Content */}
        {step === 'SUCCESS' ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="font-display font-extrabold text-2xl text-[#452080]">Registration Submitted!</h4>
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 max-w-md mx-auto text-left space-y-2">
              <p className="text-xs font-bold text-amber-900">
                Your registration is pending administrator approval.
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                To guarantee safety and verified skills across our network, every account must be reviewed by the main platform administrator. You will receive an email as soon as your account is approved.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  if (onOpenLogin) onOpenLogin();
                }}
                className="px-6 py-3 rounded-2xl bg-[#6C3FC5] text-white text-xs font-bold hover:bg-[#5A32AA]"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            {/* Account Type Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Account Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'INDIVIDUAL', label: 'Individual Member', desc: 'Personal skill exchange' },
                  { id: 'COMMUNITY', label: 'Community Chapter', desc: 'Local neighborhood group' },
                  { id: 'ORGANIZATION', label: 'Organization / NGO', desc: 'Volunteer coordinator' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccountType(t.id as any)}
                    className={`p-3 text-left rounded-2xl border transition-all ${
                      accountType === t.id
                        ? 'border-[#6C3FC5] bg-[#F2ECFF] text-[#452080] ring-2 ring-[#6C3FC5]/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{t.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kasun Fernando"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">District / City</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="px-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5]"
                  >
                    <option value="Jaffna">Jaffna</option>
                    <option value="Colombo">Colombo</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Galle">Galle</option>
                    <option value="Gampaha">Gampaha</option>
                    <option value="Batticaloa">Batticaloa</option>
                  </select>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City / Village"
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5]"
                  />
                </div>
              </div>
            </div>

            {/* Location Geotagging */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Location Coordinates</span>
                <span className="text-[10px] text-gray-500">
                  Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)} (Approximate)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCaptureLocation}
                disabled={locating}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-xs font-bold text-[#6C3FC5] hover:bg-[#F2ECFF] flex items-center gap-1.5 transition-colors"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'Detect GPS'}</span>
              </button>
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Profile Photo</label>
              <div className="flex items-center gap-3">
                <img
                  src={profilePhoto}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#6C3FC5]/30"
                />
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handlePhotoUpload}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#F2ECFF] file:text-[#6C3FC5] hover:file:bg-purple-100 cursor-pointer"
                />
              </div>
            </div>

            {/* Biography */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Short Biography</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell neighbors what you love sharing and learning..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
              />
            </div>

            {/* Skills Registration */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Your Skills &amp; Talents</h4>
                  <p className="text-[10px] text-gray-500">Add the skills you can offer to other community members</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-2.5 py-1 rounded-lg bg-[#F2ECFF] text-[#6C3FC5] text-xs font-bold hover:bg-purple-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </div>

              {skills.map((s, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Skill Name (e.g. Computer Teaching, Gardening)"
                        value={s.skillName}
                        onChange={(e) => handleSkillChange(idx, 'skillName', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <select
                        value={s.level}
                        onChange={(e) => handleSkillChange(idx, 'level', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                        <option value="EXPERT">Expert</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {skills.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Short description of what you offer"
                    value={s.description}
                    onChange={(e) => handleSkillChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              ))}
            </div>

            {/* Notice */}
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-[11px] text-[#452080] leading-relaxed">
              <strong>Notice:</strong> After submission, your registration status will be <strong>PENDING</strong> until reviewed and approved by the platform administrator.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-all shadow-md shadow-[#6C3FC5]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Submitting Registration...' : 'Complete Registration'}</span>
            </button>

            <div className="text-center">
              <span className="text-xs text-gray-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className="font-bold text-[#6C3FC5] hover:underline"
                >
                  Sign In
                </button>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
