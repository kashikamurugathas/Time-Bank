import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ArrowLeft, CheckCircle2, ShieldAlert, Calendar, UserPlus,
  FileText, Sparkles, HeartHandshake, BarChart2, CreditCard,
  Building2, MapPin, MailCheck, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const CoordinatorHowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const { user, setShowRegisterModal, setShowLoginModal } = useAuth();

  const coordinatorSteps = [
    {
      num: 1,
      title: 'Register as a Community Coordinator',
      desc: 'Submit your coordinator application by choosing the "Community / Chapter Coordinator" account type on the registration page.',
      icon: UserPlus,
    },
    {
      num: 2,
      title: 'Enter Community Details and Contact Info',
      desc: 'Provide your regional chapter name, geographical focus (district/city), contact telephone, mission statement, and community description.',
      icon: Building2,
    },
    {
      num: 3,
      title: 'Wait for Admin Approval',
      desc: 'The platform administrator reviews all coordinator submissions to verify grassroots authenticity and organizational legitimacy before approving.',
      icon: ShieldCheck,
    },
    {
      num: 4,
      title: 'Log In After Approval',
      desc: 'Upon receiving approval, sign in to unlock the Community Coordinator Dashboard customized for localized group administration.',
      icon: CheckCircle2,
    },
    {
      num: 5,
      title: 'Create and Manage Their Community',
      desc: 'Establish your local chapter profile, configure meeting hubs, define community goals, and showcase your neighborhood vision.',
      icon: MapPin,
    },
    {
      num: 6,
      title: 'Update Community Information',
      desc: 'Keep chapter contact details, announcements, meeting places, and community guidelines up to date for all participating residents.',
      icon: FileText,
    },
    {
      num: 7,
      title: 'Invite Members to Join Their Community',
      desc: 'Share your community invitation link to onboard neighborhood residents, local volunteers, and skill enthusiasts to your local chapter.',
      icon: MailCheck,
    },
    {
      num: 8,
      title: 'Manage Community Membership Requests',
      desc: 'Review and accept requests from registered platform members who wish to affiliate with your specific local community chapter.',
      icon: Users,
    },
    {
      num: 9,
      title: 'Organize Community Events and Programmes',
      desc: 'Schedule group workshops, peer learning sessions, community garden working-bees, and collaborative skill exchange days.',
      icon: Calendar,
    },
    {
      num: 10,
      title: 'Encourage Members to Share Skills',
      desc: 'Identify unique, underutilized skills in your neighborhood (e.g. baking, crafts, tech literacy) and motivate members to offer them.',
      icon: Sparkles,
    },
    {
      num: 11,
      title: 'Help Members Connect with Suitable Helpers',
      desc: 'Support elderly or less tech-savvy neighbors by helping them formulate requests and matching them with trusted local helpers.',
      icon: HeartHandshake,
    },
    {
      num: 12,
      title: 'Monitor Community Participation and Activities',
      desc: 'Track local participation rates, active exchange sessions, and volunteer commitment across your local chapter membership.',
      icon: CheckCircle2,
    },
    {
      num: 13,
      title: 'View Authorized Community Reports',
      desc: 'Access aggregated impact metrics, total hours exchanged in your district, top requested skills, and community growth trends.',
      icon: BarChart2,
    },
    {
      num: 14,
      title: 'Manage Community Subscription Details',
      desc: 'Oversee your community subscription tier (such as the Community Basic or Plus plan) and manage chapter renewal where applicable.',
      icon: CreditCard,
    },
  ];

  return (
    <div className="py-10 sm:py-14 bg-[#F7F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
          <button
            onClick={() => navigate('/how-it-works')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#6C3FC5] hover:text-[#5A32AA] bg-white px-4 py-2.5 rounded-xl border border-[#EAE7F6] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to How It Works</span>
          </button>

          <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-[#F2ECFF] text-[#6C3FC5] border border-[#6C3FC5]/20">
            Role Guide &bull; Community Coordinator
          </span>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EAE7F6] shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
                Community Coordinator &bull; How to Use Time Bank
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                As a Community Coordinator, you act as the localized catalyst for neighborhood resilience. 
                You build localized solidarity, arrange skill-sharing initiatives, and ensure neighbors find the help they need.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                <img
                  src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80"
                  alt="Community Coordinator organizing workshop"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#452080]/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-bold">Grassroots Leadership</p>
                  <p className="text-[11px] text-purple-100">Connecting Communities Through Shared Time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Strict Permission Boundary Callout */}
          <div className="mt-8 bg-amber-50/90 border border-amber-200/80 p-5 sm:p-6 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-amber-950">
                Important Permission Boundary: Local Chapter Management Only
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed mt-1">
                Community Coordinators must only manage their own authorized community chapter. 
                They do <strong>not</strong> have platform-wide Admin permissions, cannot approve or reject platform user registrations, 
                and cannot access private member data without explicit authorization. Platform governance is strictly reserved for the Administrator.
              </p>
            </div>
          </div>
        </div>

        {/* 14 Step-by-Step Instructions */}
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#6C3FC5]">
              Step-by-Step Guide
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#452080] mt-1">
              The 14 Community Coordinator Activities
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Follow these clear steps to launch, nurture, and coordinate a thriving Time Bank chapter in your neighborhood.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {coordinatorSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white rounded-2xl p-6 border border-[#EAE7F6] hover:border-[#6C3FC5]/40 hover:shadow-md transition-all flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F2ECFF] group-hover:bg-[#6C3FC5] text-[#6C3FC5] group-hover:text-white flex items-center justify-center shrink-0 font-display font-extrabold text-sm transition-colors shadow-xs">
                    {step.num}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#8E51FF]" />
                      <h3 className="font-display font-bold text-sm text-[#452080]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call-to-Action Footer Banner */}
        <div className="bg-gradient-to-br from-[#452080] to-[#5A32AA] rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left max-w-xl">
            <h3 className="font-display font-extrabold text-2xl text-white">
              Champion a Skill-Sharing Chapter in Your Area
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
              Register as a Community Coordinator to organize local events, invite neighbors, and help build a more resilient Sri Lankan community.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            {!user ? (
              <>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#452080] hover:bg-purple-50 text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                >
                  Register as Coordinator
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold border border-white/20 transition-all cursor-pointer text-center"
                >
                  Coordinator Sign In
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/communities')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#452080] hover:bg-purple-50 text-xs font-bold transition-all shadow-md cursor-pointer text-center"
              >
                Go to Communities Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
