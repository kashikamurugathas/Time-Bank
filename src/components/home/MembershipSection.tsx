import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Shield, Building2, Users, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.ts';
import { SubscriptionPlan } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface MembershipSectionProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const MembershipSection: React.FC<MembershipSectionProps> = ({ onSelectPlan }) => {
  const { user, setShowLoginModal } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'COMMUNITY' | 'ORGANIZATION'>('INDIVIDUAL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const data = await api.getPlans();
        setPlans(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const individualPlans = [
    {
      id: 'PLAN_INDIVIDUAL_FREE',
      name: 'Standard Member',
      category: 'PREMIUM_INDIVIDUAL' as const,
      price_lkr: 0,
      duration_days: 30,
      is_active: 1,
      features: [
        'Complete user profile & skill registration',
        'Search & request community help',
        'Earn & spend Time Credits (1 hr = 1 credit)',
        'Real-time one-to-one messaging',
        'Standard time credit digital wallet',
        'My Learning Journey tracker'
      ],
      isPopular: false
    },
    {
      id: 'PLAN_INDIVIDUAL_PREMIUM',
      name: 'Premium Member',
      category: 'PREMIUM_INDIVIDUAL' as const,
      price_lkr: 500,
      duration_days: 30,
      is_active: 1,
      features: [
        'All Standard Free features included',
        'Verified Member badge on profile & listings',
        'Advanced skill portfolio & project work samples',
        'Detailed learning journey certificate uploads',
        'Advanced proximity & category discovery filters',
        'Exportable time exchange activity reports',
        'Priority community support'
      ],
      isPopular: true
    }
  ];

  const communityPlans = plans.filter(p => p.category === 'COMMUNITY');
  const orgPlans = plans.filter(p => p.category === 'ORGANIZATION');

  const displayedPlans = activeTab === 'INDIVIDUAL'
    ? individualPlans
    : activeTab === 'COMMUNITY'
    ? (communityPlans.length > 0 ? communityPlans : [
        { id: 'PLAN_COMMUNITY_FREE', name: 'Basic Community', category: 'COMMUNITY' as const, price_lkr: 0, duration_days: 30, is_active: 1, features: ['Community chapter registration', 'Basic member management', 'Basic service exchange', 'Basic reports'] },
        { id: 'PLAN_COMMUNITY_PLUS', name: 'Community Plus', category: 'COMMUNITY' as const, price_lkr: 3000, duration_days: 30, is_active: 1, features: ['Advanced community dashboard', 'Member analytics & insights', 'Activity reports', 'Priority support'] }
      ])
    : (orgPlans.length > 0 ? orgPlans : [
        { id: 'PLAN_ORG_STANDARD', name: 'Organization Standard', category: 'ORGANIZATION' as const, price_lkr: 7500, duration_days: 30, is_active: 1, features: ['Organization dashboard', 'Multiple community management', 'Volunteer hour tracking', 'Monthly reports'] },
        { id: 'PLAN_ORG_PREMIUM', name: 'Organization Premium', category: 'ORGANIZATION' as const, price_lkr: 15000, duration_days: 30, is_active: 1, features: ['All Standard features', 'Advanced analytics', 'Custom branding', 'Multiple administrators', 'Exportable reports', 'Priority support'] }
      ]);

  return (
    <section className="py-20 bg-[#F7F7FB]" id="membership-plans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
            Fair &bull; Transparent &bull; Configurable
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
            Plans for Individuals, Communities &amp; Organizations
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Core community help and time credit exchange is <strong>100% free forever</strong>. Optional subscriptions provide advanced tooling, analytics, and verified organization dashboards.
          </p>

          {/* Tab selector */}
          <div className="pt-4 flex justify-center">
            <div className="bg-white p-1 rounded-2xl border border-gray-200 inline-flex shadow-xs">
              <button
                onClick={() => setActiveTab('INDIVIDUAL')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'INDIVIDUAL' ? 'bg-[#6C3FC5] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Individual Members</span>
              </button>
              <button
                onClick={() => setActiveTab('COMMUNITY')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'COMMUNITY' ? 'bg-[#6C3FC5] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Community Chapters</span>
              </button>
              <button
                onClick={() => setActiveTab('ORGANIZATION')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'ORGANIZATION' ? 'bg-[#6C3FC5] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Organizations &amp; NGOs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 items-stretch">
          {displayedPlans.map((p: any, idx) => {
            const isPopular = p.isPopular || p.price_lkr > 0;
            return (
              <div
                key={idx}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                  isPopular
                    ? 'bg-white border-2 border-[#6C3FC5] shadow-2xl shadow-[#6C3FC5]/10'
                    : 'bg-white border border-[#EAE7F6] shadow-sm'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 right-8 bg-gradient-to-r from-[#6C3FC5] to-[#452080] text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Recommended
                  </div>
                )}

                <div>
                  <h3 className="font-display font-extrabold text-xl text-[#452080]">{p.name}</h3>
                  <div className="mt-4 mb-6 flex items-baseline gap-1">
                    <span className="font-display font-black text-3xl sm:text-4xl text-gray-900">
                      {p.price_lkr === 0 ? 'Free' : `LKR ${p.price_lkr.toLocaleString()}`}
                    </span>
                    {p.price_lkr > 0 && <span className="text-xs text-gray-500 font-semibold">/ month</span>}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">What&apos;s Included:</span>
                    <ul className="space-y-2.5">
                      {p.features.map((f: string, fi: number) => (
                        <li key={fi} className="flex items-start gap-2.5 text-xs text-gray-700 leading-normal">
                          <div className="w-4 h-4 rounded-full bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => {
                      if (!user) {
                        setShowLoginModal(true);
                      } else {
                        onSelectPlan(p);
                      }
                    }}
                    className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                      isPopular
                        ? 'bg-[#6C3FC5] hover:bg-[#5A32AA] text-white shadow-md shadow-[#6C3FC5]/20'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <span>{p.price_lkr === 0 ? 'Included by Default' : 'Upgrade via PayHere'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    {p.price_lkr === 0 ? 'No credit card needed' : 'Pay securely in Sri Lankan Rupees (LKR)'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
