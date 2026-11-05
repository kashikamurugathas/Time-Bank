import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Shield, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export const HowItWorksMain: React.FC = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'member',
      title: 'Member',
      tagline: 'Exchange skills, give help & receive help',
      description: 'Join as an individual to share your skills and talents, earn Time Credits by helping others, and use your credits to receive assistance when you need it.',
      icon: User,
      badge: 'Individual Member',
      image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
      highlights: ['Earn & spend 1 hr = 1 credit', 'Request help & offer skills', 'Learn and verify new talents'],
      path: '/how-it-works/member',
      accentColor: 'from-[#6C3FC5] to-[#8E51FF]',
      borderHover: 'hover:border-[#6C3FC5]',
    },
    {
      id: 'community-coordinator',
      title: 'Community Coordinator',
      tagline: 'Organize, guide & inspire local chapters',
      description: 'Lead a local neighborhood group or community chapter. Organize skill-sharing programmes, encourage mutual aid, and help neighbors connect with suitable helpers.',
      icon: Users,
      badge: 'Community Leader',
      image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80',
      highlights: ['Manage local chapter profile', 'Organize skill-sharing workshops', 'Connect neighbors with helpers'],
      path: '/how-it-works/community-coordinator',
      accentColor: 'from-[#5A32AA] to-[#7B46E8]',
      borderHover: 'hover:border-[#5A32AA]',
    },
    {
      id: 'admin',
      title: 'Admin',
      tagline: 'Platform governance, security & approvals',
      description: 'Oversee platform operations, review and verify new registrations, safeguard community trust, monitor time credit transactions, and resolve disputes.',
      icon: Shield,
      badge: 'Platform Administrator',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
      highlights: ['Mandatory user verification', 'Platform security & audit trails', 'Analytics & dispute resolution'],
      path: '/how-it-works/admin',
      accentColor: 'from-[#452080] to-[#5A32AA]',
      borderHover: 'hover:border-[#452080]',
    },
  ];

  return (
    <div className="py-12 sm:py-16 bg-[#F7F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header / Intro */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-widest px-3.5 py-1.5 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#6C3FC5]" />
            Three Dedicated Roles &bull; One United Community
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#452080] tracking-tight">
            How Time Bank Works
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Time Bank operates on equal reciprocity where 1 hour of any service equals 1 Time Credit. 
            Select your role below to explore detailed step-by-step guidance tailored specifically to you.
          </p>
        </div>

        {/* The 3 Dedicated Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.id}
                className={`bg-white rounded-3xl overflow-hidden border border-[#EAE7F6] ${role.borderHover} hover:shadow-2xl hover:shadow-[#6C3FC5]/10 transition-all duration-300 flex flex-col justify-between group`}
              >
                <div>
                  {/* Image Header with Badge */}
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-purple-100">
                    <img
                      src={role.image}
                      alt={role.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/95 text-[#452080] shadow-sm backdrop-blur-sm">
                        {role.badge}
                      </span>
                    </div>

                    {/* Floating Role Icon */}
                    <div className="absolute -bottom-5 right-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C3FC5] to-[#8E51FF] flex items-center justify-center text-white shadow-lg shadow-[#6C3FC5]/30">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-6 pt-8 space-y-4">
                    <div>
                      <h2 className="font-display font-extrabold text-2xl text-[#452080] group-hover:text-[#6C3FC5] transition-colors">
                        {role.title}
                      </h2>
                      <p className="text-xs font-semibold text-[#8E51FF] mt-0.5">
                        {role.tagline}
                      </p>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {role.description}
                    </p>

                    {/* Highlights */}
                    <div className="pt-2 space-y-2 border-t border-gray-100">
                      {role.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle2 className="w-4 h-4 text-[#6C3FC5] shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => navigate(role.path)}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-all shadow-md shadow-[#6C3FC5]/20 flex items-center justify-center gap-2 group/btn cursor-pointer"
                  >
                    <span>Learn More &bull; {role.title} Guide</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
