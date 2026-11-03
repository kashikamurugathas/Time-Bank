import React from 'react';
import { Clock, Shield, Sparkles, ArrowRight, CheckCircle2, Users, HeartHandshake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface HeroSectionProps {
  setCurrentView: (view: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ setCurrentView }) => {
  const { user, setShowRegisterModal, setShowLoginModal, quickLoginAs } = useAuth();

  return (
    <div className="relative overflow-hidden bg-[#452080] text-white">
      {/* Background Photograph with Purple Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/time_bank_hero_bg_1793681906806.jpg"
          alt="Time Bank Community Volunteers"
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Gradients Overlay for clean text readability & purple branding */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#341663]/95 via-[#452080]/85 to-[#6C3FC5]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-purple-100 shadow-inner">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sri Lanka&apos;s Community Time Exchange &bull; Money-Free Reciprocity</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white">
              Your Time Has Value.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-300">
                Share It. Earn It. Grow Together.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-purple-100/90 max-w-2xl font-normal leading-relaxed">
              Connect with your community, exchange valuable skills, and help one another grow without exchanging money. One hour of teaching earns one time credit, which you can use for any other service.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-6 py-3.5 rounded-2xl bg-white text-[#452080] hover:bg-purple-50 font-bold text-sm flex items-center gap-2 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-[#6C3FC5]" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-7 py-3.5 rounded-2xl bg-white text-[#452080] hover:bg-purple-50 font-bold text-sm flex items-center gap-2 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all"
                  >
                    <span>Get Started – Join Free</span>
                    <ArrowRight className="w-4 h-4 text-[#6C3FC5]" />
                  </button>
                  <button
                    onClick={() => setCurrentView('skills')}
                    className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md border border-white/30 transition-all flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-purple-200" />
                    <span>Explore Community Skills</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setCurrentView('nearby')}
                className="px-5 py-3.5 rounded-2xl bg-purple-900/60 hover:bg-purple-900/80 text-purple-200 font-semibold text-sm border border-purple-400/30 transition-all"
              >
                Find Helpers Near You
              </button>
            </div>

            {/* Trust badges */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-purple-200/80">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>1 Hour = 1 Credit Principle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Mandatory Admin Approval</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-400" />
                <span>Mutual Confirmation Protection</span>
              </div>
            </div>
          </div>

          {/* Community Teamwork Showcase Photograph */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-full max-w-md group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-300 to-purple-500 rounded-[26px] opacity-40 blur-sm group-hover:opacity-60 transition-opacity" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/10 border-2 border-white/25">
                <img
                  src="/src/assets/images/community_teamwork_photo_1793713257838.jpg"
                  alt="Community Members Sharing Skills"
                  className="w-full h-auto object-cover aspect-[4/3] transform transition-transform duration-500 hover:scale-[1.02]"
                />
                <div className="p-4 bg-[#341663]/90 backdrop-blur-md text-white border-t border-white/15">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Users className="w-3.5 h-3.5 text-amber-300" />
                    <span>Real Community Teamwork</span>
                  </div>
                  <p className="text-[11px] text-purple-200 mt-0.5">
                    Connecting people of all generations through shared skills
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-white">1,450+</div>
            <div className="text-xs text-purple-200 font-medium mt-1">Hours Exchanged</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-white">480+</div>
            <div className="text-xs text-purple-200 font-medium mt-1">Approved Members</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-white">16+</div>
            <div className="text-xs text-purple-200 font-medium mt-1">Skill Categories</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-white">LKR 0</div>
            <div className="text-xs text-purple-200 font-medium mt-1">Cash Exchanged</div>
          </div>
        </div>
      </div>
    </div>
  );
};
