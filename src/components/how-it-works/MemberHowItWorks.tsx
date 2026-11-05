import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ArrowLeft, CheckCircle2, Clock, ShieldCheck, HeartHandshake,
  Award, Sparkles, BookOpen, Search, MapPin, Send, CalendarCheck,
  Coins, MessageSquare, Bell, Star, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const MemberHowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const { user, setShowRegisterModal, setShowLoginModal } = useAuth();

  const memberSteps = [
    {
      num: 1,
      title: 'Register as a Member',
      desc: 'Create your account by selecting the "Individual Member" account type on the registration page with your valid email and secure password.',
      icon: UserPlus,
    },
    {
      num: 2,
      title: 'Complete Personal Profile Information',
      desc: 'Add your full name, telephone number, bio, city, and district. Your exact residential street address or coordinates are always shielded for safety.',
      icon: User,
    },
    {
      num: 3,
      title: 'Wait for Admin Approval',
      desc: 'All new member registrations enter PENDING status while our community administrator reviews your details to keep the network trustworthy and safe.',
      icon: ShieldCheck,
    },
    {
      num: 4,
      title: 'Log In After Approval',
      desc: 'Once approved, sign in to unlock your Member Dashboard, view your starter 3.0 Time Credits, and access all platform features.',
      icon: CheckCircle2,
    },
    {
      num: 5,
      title: 'Add Existing Skills and Talents',
      desc: 'List the skills you can offer, from coding and language tutoring to home cooking, organic gardening, electrical work, and tailoring.',
      icon: Sparkles,
    },
    {
      num: 6,
      title: 'Upload Certificates and Work Samples',
      desc: 'Provide proof of qualifications, certificates, photos, or portfolio links to showcase your craftsmanship and build community credibility.',
      icon: Award,
    },
    {
      num: 7,
      title: 'Add Newly Learned Skills to Profile',
      desc: 'Use "My Learning Journey" to track your progress percentage, document newly acquired capabilities, and obtain verified skill badges.',
      icon: BookOpen,
    },
    {
      num: 8,
      title: 'Explore Available Skills and Services',
      desc: 'Browse our organized catalog of skills spanning Technology, Education, Trades, Health & Wellness, Creative Arts, and Household support.',
      icon: Search,
    },
    {
      num: 9,
      title: 'Create Help Requests When Needed',
      desc: 'When you need assistance, publish a Help Request specifying the needed skill, preferred date and time, duration, and credits offered.',
      icon: HeartHandshake,
    },
    {
      num: 10,
      title: 'Find Nearby Helpers Using Location',
      desc: 'Discover suitable helpers living close to your neighborhood using accurate Haversine distance recommendations without compromising privacy.',
      icon: MapPin,
    },
    {
      num: 11,
      title: 'Select a Helper and Send a Request',
      desc: 'Review helper profiles, ratings, and proximity, then send a direct request or accept an offer submitted to your published request.',
      icon: Send,
    },
    {
      num: 12,
      title: 'Confirm Bookings and Schedules',
      desc: 'Agree on the appointment details. If an unexpected schedule conflict arises, either party can propose a reschedule date and time.',
      icon: CalendarCheck,
    },
    {
      num: 13,
      title: 'Receive Help and Spend Time Credits',
      desc: 'Enjoy the service session. When completed and mutually confirmed, 1 hour of help received deducts 1 Time Credit from your balance.',
      icon: Coins,
    },
    {
      num: 14,
      title: 'Provide Services and Earn Time Credits',
      desc: 'Share your skills with other community members. Every hour of assistance you give earns you 1 Time Credit in your digital wallet.',
      icon: Clock,
    },
    {
      num: 15,
      title: 'Communicate with Other Members',
      desc: 'Use the integrated real-time chat drawer to coordinate session logistics, discuss project requirements, and stay in direct contact.',
      icon: MessageSquare,
    },
    {
      num: 16,
      title: 'Receive Notifications and Email Updates',
      desc: 'Get instant alerts for booking updates, new messages, completion confirmations, and time credit balance transactions.',
      icon: Bell,
    },
    {
      num: 17,
      title: 'Submit Reviews and Ratings',
      desc: 'After each service session, rate your helper or requester 1 to 5 stars and leave constructive written feedback to maintain excellence.',
      icon: Star,
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
            Role Guide &bull; Member
          </span>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EAE7F6] shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center shadow-xs">
                <User className="w-6 h-6" />
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
                Member &bull; How to Use Time Bank
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                As an Individual Member, you are the heartbeat of the Time Bank community. 
                Whether you have skills to share or need a helping hand, every hour you contribute has equal value.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                <img
                  src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80"
                  alt="Community members helping each other"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#452080]/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-bold">Equal Reciprocity</p>
                  <p className="text-[11px] text-purple-100">1 Hour Given = 1 Hour Received</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Principle Box */}
          <div className="mt-8 bg-gradient-to-r from-[#F2ECFF] to-[#FAF8FF] p-5 sm:p-6 rounded-2xl border border-[#6C3FC5]/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#6C3FC5] text-white flex items-center justify-center shrink-0 shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#452080]">
                Important Principle: Members Can Both Request Help and Provide Help
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed mt-1">
                Unlike traditional marketplaces where people are strictly buyers or sellers, every Time Bank Member can both ask for assistance and offer their talents. 
                One hour of teaching computer skills earns one Time Credit, which you can later spend to receive one hour of gardening, electrical assistance, or language practice.
              </p>
            </div>
          </div>
        </div>

        {/* 17 Step-by-Step Instructions */}
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#6C3FC5]">
              Step-by-Step Guide
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#452080] mt-1">
              The 17 Member Activities
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Follow these clear steps to navigate your Time Bank journey from registration to mutual skill exchange.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {memberSteps.map((step) => {
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
        <div className="bg-gradient-to-br from-[#452080] to-[#6C3FC5] rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left max-w-xl">
            <h3 className="font-display font-extrabold text-2xl text-white">
              Ready to Share Your Skills and Connect?
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
              Register your Member profile today. Upon administrator verification, you will receive 3.0 welcome Time Credits to jumpstart your exchanges.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            {!user ? (
              <>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#452080] hover:bg-purple-50 text-xs font-bold transition-all shadow-md cursor-pointer text-center"
                >
                  Register as a Member
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#5A32AA] hover:bg-[#452080] text-white text-xs font-bold border border-white/20 transition-all cursor-pointer text-center"
                >
                  Member Sign In
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#452080] hover:bg-purple-50 text-xs font-bold transition-all shadow-md cursor-pointer text-center"
              >
                Go to Member Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
