import React from 'react';
import { ArrowRight, Clock, Heart, Users, Sparkles, Shield, Compass, BookOpen, SunMedium } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface HomePageProps {
  setCurrentView: (view: string) => void;
  onJoinCommunity: () => void;
  onExplore: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentView, onJoinCommunity, onExplore }) => {
  const { user } = useAuth();

  const handleJoinClick = () => {
    if (user) {
      setCurrentView('dashboard');
    } else {
      onJoinCommunity();
    }
  };

  const whyTimeMatters = [
    {
      title: 'Every Hour is Equal',
      description: 'One hour of sharing computer knowledge has the exact same value as one hour of gardening, baking, or fixing a bicycle. Everyone’s contribution is honored equally.',
      icon: Clock,
      tag: 'True Equality'
    },
    {
      title: 'Reciprocity Over Charity',
      description: 'We believe everyone has something valuable to teach and something meaningful to learn. Time banking is an active two-way exchange that preserves dignity.',
      icon: Heart,
      tag: 'Mutual Dignity'
    },
    {
      title: 'Real Neighborhood Connections',
      description: 'Replace isolation with real, caring human relationships. Connect with neighbors you might never have met and build lifelong community friendships.',
      icon: Users,
      tag: 'Social Belonging'
    },
    {
      title: 'Money-Free Abundance',
      description: 'Valuable assistance, personal tutoring, and hands-on repairs become accessible to all families without economic pressure or commercial barriers.',
      icon: SunMedium,
      tag: 'Zero Financial Strain'
    }
  ];

  const communityStories = [
    {
      theme: 'Intergenerational Learning',
      story: 'Youth learn traditional craftsmanship, organic agriculture, and storytelling from village elders, while helping seniors navigate digital tools, smartphones, and online services.',
      badge: 'Knowledge Shared'
    },
    {
      theme: 'Practical Daily Assistance',
      story: 'From fixing leaking pipes and mending clothes to math coaching and home cooking, neighbors support each other through everyday life challenges with genuine care.',
      badge: 'Local Resilience'
    },
    {
      theme: 'Vibrant Local Chapters',
      story: 'Communities in Jaffna, Colombo, Kandy, and beyond coordinate shared vegetable gardens, tool-sharing libraries, and collaborative weekend workshops.',
      badge: 'Collective Growth'
    }
  ];

  return (
    <div className="bg-[#F7F7FB]">
      {/* 1. Welcoming Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#452080] via-[#522599] to-[#6C3FC5] text-white pt-16 pb-20 lg:pt-20 lg:pb-28">
        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-purple-200 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Community Time Exchange Platform</span>
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white">
                Your Time. <br />
                Your Skills. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-300">
                  A Stronger Community.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-purple-100/90 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0">
                Time Bank is a neighbor-to-neighbor community network where time is the currency. Spend an hour helping someone with a talent you have, and receive an hour of help when you need it. No money, no debt—just genuine community care and mutual support.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleJoinClick}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white text-[#452080] hover:bg-purple-50 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <span>{user ? 'Go to My Dashboard' : 'Join Our Community'}</span>
                  <ArrowRight className="w-4 h-4 text-[#6C3FC5]" />
                </button>

                <button
                  onClick={onExplore}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md border border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-purple-200" />
                  <span>Explore Time Bank</span>
                </button>
              </div>

              {/* Core Principles Pills */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-purple-200/90">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>1 Hour = 1 Credit</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Verified Safe Members</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                  <Heart className="w-3.5 h-3.5 text-rose-300" />
                  <span>100% Free of Money</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-Quality Community Teamwork Photograph Showcase */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative max-w-lg w-full group">
                {/* Decorative border accent */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-300 via-white/50 to-purple-400 rounded-[28px] opacity-40 blur-md group-hover:opacity-70 transition-opacity" />

                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white/10 border-2 border-white/30">
                  <img
                    src="/src/assets/images/community_teamwork_photo_1793713257838.jpg"
                    alt="Community Teamwork & Skill Sharing"
                    className="w-full h-auto object-cover aspect-[4/3] transform transition-transform duration-500 hover:scale-[1.02]"
                  />

                  {/* Overlaid caption card */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#452080]/90 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-300" />
                        <span>Community Skill Sharing in Action</span>
                      </div>
                      <p className="text-[11px] text-purple-200">
                        Neighbors teaching digital literacy, crafts, and gardening together
                      </p>
                    </div>
                    <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-white/20 text-purple-100">
                      Reciprocity
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Why Time Matters" Section */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
              Our Guiding Principles
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
              Why Time Matters
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              In conventional markets, some hours are valued more than others. In Time Bank, we believe every person&apos;s time has equal dignity and immense value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyTimeMatters.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F7F7FB] rounded-3xl p-7 border border-[#EAE7F6] hover:border-[#6C3FC5]/40 hover:bg-white hover:shadow-xl hover:shadow-[#6C3FC5]/8 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] group-hover:bg-[#6C3FC5] text-[#6C3FC5] group-hover:text-white flex items-center justify-center mb-5 transition-colors shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C3FC5] bg-purple-100/60 px-2 py-0.5 rounded-md">
                      {item.tag}
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#452080] group-hover:text-[#6C3FC5] transition-colors mt-2.5 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Visually Attractive Community Impact Section */}
      <section className="py-20 bg-[#F7F7FB] border-t border-[#EAE7F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
              Human Stories &bull; Real Resilience
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
              Community Impact Beyond Numbers
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              When we trade time instead of money, we cultivate trust, revive local solidarity, and prove that communities already possess the resources they need to thrive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {communityStories.map((story, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-[#EAE7F6] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {story.badge}
                  </span>
                  <h3 className="font-display font-bold text-lg text-[#452080]">
                    {story.theme}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {story.story}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-semibold text-[#6C3FC5]">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Grassroots Reciprocity</span>
                </div>
              </div>
            ))}
          </div>

          {/* Inspirational Quote Card */}
          <div className="mt-12 bg-gradient-to-r from-[#F2ECFF] to-[#FAF8FF] rounded-3xl p-8 sm:p-10 border border-[#EAE7F6] text-center max-w-3xl mx-auto space-y-3">
            <p className="font-display font-bold text-base sm:text-lg text-[#452080] italic leading-relaxed">
              &ldquo;We don&apos;t need a fortune to help someone grow; we simply need an hour of our attention, our patience, and our willingness to listen.&rdquo;
            </p>
            <span className="text-xs text-[#6C3FC5] font-semibold block">
              — Time Bank Philosophy
            </span>
          </div>
        </div>
      </section>

      {/* 4. Simple Call-to-Action Section */}
      <section className="py-20 bg-white border-t border-[#EAE7F6]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-[#452080] via-[#5A32AA] to-[#6C3FC5] rounded-3xl p-10 sm:p-14 text-white shadow-2xl relative overflow-hidden space-y-6">
            {/* Subtle light accents */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-widest px-3 py-1 rounded-full bg-white/15 text-purple-200 border border-white/20">
                Ready to Get Involved?
              </span>

              <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
                Your Community is Waiting for Your Talent.
              </h2>

              <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-normal">
                Join hundreds of community members sharing skills, learning together, and discovering that time spent helping neighbors is the most rewarding investment of all.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleJoinClick}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-[#452080] hover:bg-purple-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <span>{user ? 'Open My Dashboard' : 'Join Our Community'}</span>
                  <ArrowRight className="w-4 h-4 text-[#6C3FC5]" />
                </button>

                <button
                  onClick={onExplore}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-purple-200" />
                  <span>Explore Time Bank</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
