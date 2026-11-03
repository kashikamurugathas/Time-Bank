import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, AlertCircle, Shield, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

interface LoginModalProps {
  onSuccess?: () => void;
  onOpenRegister?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onOpenRegister }) => {
  const { showLoginModal, setShowLoginModal, login, quickLoginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      if (res.success) {
        setShowLoginModal(false);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err: any) {
      setForgotMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#EAE7F6] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
          <button
            onClick={() => setShowLoginModal(false)}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">Sign In</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white">Welcome Back</h3>
          <p className="text-xs text-purple-100/90 mt-1">Access your time credits, requests, and exchanges</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span>{error}</span>
                {error.includes('pending') && (
                  <p className="mt-1 font-semibold text-rose-900">
                    Newly registered accounts must be approved by the platform administrator before access is granted.
                  </p>
                )}
              </div>
            </div>
          )}

          {!showForgot ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kashikamurugathas@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-[#6C3FC5] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#6C3FC5] rounded"
                  />
                  <span>Remember me for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-all shadow-md shadow-[#6C3FC5]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Time Bank'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-gray-600">
                Enter your registered email address and we will send you password reset instructions.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
                />
              </div>

              {forgotMsg && (
                <div className="p-3 rounded-xl bg-purple-50 text-[#452080] text-xs font-medium">
                  {forgotMsg}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#6C3FC5] text-white text-xs font-bold hover:bg-[#5A32AA]"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Logins Helper */}
          <div className="pt-4 border-t border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Instant 1-Click Demo Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs('kashikamurugathas@gmail.com', 'kashi123')}
                className="p-2 text-left rounded-xl bg-[#F2ECFF] hover:bg-[#E9DEFF] text-[#452080] border border-[#6C3FC5]/20 transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <Shield className="w-3 h-3 text-[#6C3FC5]" />
                  <span>Super Admin</span>
                </div>
                <div className="text-[10px] text-gray-500 truncate">Kashika (kashi123)</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('avi.sharma@example.com', 'AviPass123!')}
                className="p-2 text-left rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <Sparkles className="w-3 h-3 text-[#6C3FC5]" />
                  <span>Member Avi</span>
                </div>
                <div className="text-[10px] text-gray-500 truncate">Computer Teaching</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('selvi.t@example.com', 'SelviPass123!')}
                className="p-2 text-left rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <Sparkles className="w-3 h-3 text-[#6C3FC5]" />
                  <span>Member Selvi</span>
                </div>
                <div className="text-[10px] text-gray-500 truncate">Gardening &amp; Baking</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('ranjan.pending@example.com', 'RanjanPass123!')}
                className="p-2 text-left rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-[11px]">
                  <UserCheck className="w-3 h-3 text-amber-600" />
                  <span>Pending Test</span>
                </div>
                <div className="text-[10px] text-amber-700 truncate">Ranjan (Pending)</div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-gray-500">
              Don&apos;t have an account yet?{' '}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  if (onOpenRegister) onOpenRegister();
                }}
                className="font-bold text-[#6C3FC5] hover:underline"
              >
                Join Time Bank
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
