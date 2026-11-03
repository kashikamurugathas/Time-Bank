import React from 'react';
import { UserCheck, Search, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  setCurrentView: (view: string) => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ setCurrentView }) => {
  const steps = [
    {
      num: '01',
      title: 'Register & Admin Approval',
      desc: 'Join as an Individual, Community, or Organization. Every registration is personally reviewed by our administrator to guarantee safety and authenticity.',
      icon: UserCheck,
      highlight: 'Mandatory Admin Verification'
    },
    {
      num: '02',
      title: 'Explore or Request Help',
      desc: 'Use location-based discovery to find nearby members offering computer teaching, gardening, sewing, repairs, and languages, or publish a help request.',
      icon: Search,
      highlight: 'Proximity Recommendations'
    },
    {
      num: '03',
      title: '1 Hour = 1 Time Credit',
      desc: 'Exchange services directly without money. One hour of your time spent helping someone earns one full time credit in your digital wallet.',
      icon: Clock,
      highlight: 'Equal Value For Everyone'
    },
    {
      num: '04',
      title: 'Mutual Confirmation & Transfer',
      desc: 'Once the service session ends, both the requester and helper confirm completion in the app. Time credits are securely transferred automatically.',
      icon: CheckCircle2,
      highlight: 'Double Confirmation Security'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
            Simple &bull; Transparent &bull; Empowering
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
            How Time Bank Works
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Time banking is an alternative currency system where time is the principal asset. Everyone has something valuable to teach, share, or offer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative bg-[#F7F7FB] rounded-3xl p-7 border border-[#EAE7F6] hover:border-[#6C3FC5]/40 hover:shadow-xl hover:shadow-[#6C3FC5]/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-display font-black text-3xl text-purple-200 group-hover:text-[#6C3FC5] transition-colors">
                      {s.num}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] group-hover:bg-[#6C3FC5] flex items-center justify-center text-[#6C3FC5] group-hover:text-white transition-colors shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#452080] mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">{s.desc}</p>
                </div>
                <div className="pt-4 border-t border-gray-200/60">
                  <span className="text-[11px] font-bold text-[#6C3FC5] bg-purple-50 px-2.5 py-1 rounded-lg">
                    {s.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature banner */}
        <div className="mt-14 bg-gradient-to-r from-[#F2ECFF] to-[#FAF8FF] rounded-3xl p-8 border border-[#EAE7F6] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-display font-bold text-lg text-[#452080]">Have a talent or wanting to learn something new?</h4>
            <p className="text-xs text-gray-600">Register your profile and get 3.0 welcome time credits upon administrator approval.</p>
          </div>
          <button
            onClick={() => setCurrentView('skills')}
            className="px-6 py-3 rounded-2xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-[#6C3FC5]/20 shrink-0"
          >
            <span>Browse Skill Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
