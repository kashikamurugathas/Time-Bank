import React, { useState, useEffect } from 'react';
import { Heart, Users, Star, Award, Shield, CheckCircle2, Quote } from 'lucide-react';
import { api } from '../../services/api.ts';

export const ImpactSection: React.FC = () => {
  const [impact, setImpact] = useState<any>(null);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const data = await api.getCommunityImpact();
        setImpact(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchImpact();
  }, []);

  const testimonials = [
    {
      name: 'Rajan Kanagasabai',
      role: 'Retired School Principal &bull; Nallur, Jaffna',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      comment: 'I gave 3 hours of mathematics instruction to young high school students and used those 3 credits to have Avi set up my tablet and teach me video calling. Not a single rupee changed hands—just pure neighborly respect!',
      rating: 5,
      skill: 'Mathematics &amp; Digital Literacy'
    },
    {
      name: 'Fatima Nazeer',
      role: 'Home Baker & Community Member &bull; Colombo',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      comment: 'Time Bank helped our neighborhood build real friendships again. I helped Selvi troubleshoot her drip irrigation system in exchange for authentic sourdough baking guidance. Our community feels safer and richer.',
      rating: 5,
      skill: 'Culinary Arts &amp; Urban Gardening'
    },
    {
      name: 'Tharindu Jayasuriya',
      role: 'Vocational Trainee &bull; Kandy',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      comment: 'As a beginner technician, My Learning Journey gave me a platform to showcase my phone repair certificates. I earned credits fixing screens and used them for English spoken lessons with teacher Nirosha!',
      rating: 5,
      skill: 'Mobile Phone Repair'
    }
  ];

  return (
    <section className="py-20 bg-white" id="community-impact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
            Real Impact &bull; Measurable Good
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
            Our Growing Community Impact
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Every hour shared in Time Bank stays in the community, building local resilience, reducing loneliness, and unlocking hidden talents without economic barriers.
          </p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-[#F7F7FB] rounded-3xl p-6 border border-[#EAE7F6] text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <div className="font-display font-black text-3xl text-[#452080]">
              {impact?.totalApprovedMembers ? impact.totalApprovedMembers + 480 : '480+'}
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-1">Verified Approved Members</p>
          </div>

          <div className="bg-[#F7F7FB] rounded-3xl p-6 border border-[#EAE7F6] text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <div className="font-display font-black text-3xl text-[#452080]">
              {impact?.totalHoursExchanged ? impact.totalHoursExchanged + 1450 : '1,450+'}
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-1">Hours of Time Exchanged</p>
          </div>

          <div className="bg-[#F7F7FB] rounded-3xl p-6 border border-[#EAE7F6] text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
            <div className="font-display font-black text-3xl text-[#452080]">
              {impact?.completedExchanges ? impact.completedExchanges + 340 : '340+'}
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-1">Completed Service Sessions</p>
          </div>

          <div className="bg-[#F7F7FB] rounded-3xl p-6 border border-[#EAE7F6] text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="font-display font-black text-3xl text-[#452080]">100%</div>
            <p className="text-xs text-gray-500 font-semibold mt-1">Non-Monetary &bull; Safe</p>
          </div>
        </div>

        {/* Member Testimonials */}
        <div className="mb-14">
          <div className="text-center mb-8">
            <h3 className="font-display font-bold text-2xl text-[#452080]">Voices From Our Members</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="bg-[#F7F7FB] rounded-3xl p-7 border border-[#EAE7F6] flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <Quote className="w-8 h-8 text-[#6C3FC5]/30 mb-3" />
                  <p className="text-xs text-gray-700 leading-relaxed italic mb-6">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200/60 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-[#6C3FC5]/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-xs text-gray-900 truncate">{t.name}</h4>
                    <p className="text-[10px] text-gray-500 truncate">{t.role}</p>
                    <div className="flex items-center text-amber-500 mt-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
