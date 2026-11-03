import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const ChangePasswordModal: React.FC = () => {
  const { user, showChangePasswordModal, setShowChangePasswordModal, refreshProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!showChangePasswordModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => {
        setSuccess(false);
        setShowChangePasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const isMandatoryChange = Boolean(user?.requiresPasswordChange);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#EAE7F6] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
          {!isMandatoryChange && (
            <button
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">
              {isMandatoryChange ? 'Mandatory Security Update' : 'Security Settings'}
            </span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white">Change Password</h3>
          <p className="text-xs text-purple-100/90 mt-1">
            {isMandatoryChange
              ? 'You are required to replace the initial default password with your own secure password.'
              : 'Keep your Time Bank account secure with a strong password.'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Password successfully updated! Proceeding to platform...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isMandatoryChange ? 'Current Initial Password (e.g. kashi123)' : 'Current Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-all shadow-md shadow-[#6C3FC5]/20 disabled:opacity-50"
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
