import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowLeft, CheckCircle2, UserCheck, Users, Sparkles,
  CalendarCheck, Coins, Building2, CreditCard, Receipt, AlertCircle,
  BarChart3, Settings, LogIn, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const AdminHowItWorks: React.FC = () => {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();

  const adminSteps = [
    {
      num: 1,
      title: 'Log In Using the Authorized Admin Account',
      desc: 'Authenticate through the secure login portal using assigned Super Administrator or Community Administrator credentials.',
      icon: Lock,
    },
    {
      num: 2,
      title: 'Access the Admin Dashboard',
      desc: 'Open the centralized Governance Command Center displaying real-time platform KPIs, pending queues, and security alerts.',
      icon: Shield,
    },
    {
      num: 3,
      title: 'View New User Registration Requests',
      desc: 'Examine the live queue of newly submitted user applications currently held in PENDING verification status.',
      icon: UserCheck,
    },
    {
      num: 4,
      title: 'Review Member & Coordinator Applications',
      desc: 'Thoroughly assess personal credentials, contact numbers, intended roles, and chapter information to prevent fraudulent profiles.',
      icon: CheckCircle2,
    },
    {
      num: 5,
      title: 'Approve or Reject Registrations',
      desc: 'Grant full platform access to authentic applicants or reject incomplete submissions with documented rejection reasons sent via email.',
      icon: CheckCircle2,
    },
    {
      num: 6,
      title: 'Manage Users, Roles, and Account Status',
      desc: 'Temporarily suspend policy violators, reinstate accounts, adjust user roles (Super Admin, Admin, Member), and monitor failed logins.',
      icon: Users,
    },
    {
      num: 7,
      title: 'Monitor Skills and Help Requests',
      desc: 'Oversee the skills catalog, verify member qualification certificates, and monitor all open and accepted community help requests.',
      icon: Sparkles,
    },
    {
      num: 8,
      title: 'Monitor Bookings and Service Activities',
      desc: 'Audit scheduled, in-progress, and completed service sessions across all districts to ensure mutual confirmation rules are adhered to.',
      icon: CalendarCheck,
    },
    {
      num: 9,
      title: 'Monitor Time Credit Transactions',
      desc: 'Inspect the platform double-entry credit ledger, detect anomalies, and perform authorized administrative balance adjustments when necessary.',
      icon: Coins,
    },
    {
      num: 10,
      title: 'Manage Communities and Organizations',
      desc: 'Review neighborhood chapter profiles, verify non-profit and community NGO partners, and oversee coordinator appointments.',
      icon: Building2,
    },
    {
      num: 11,
      title: 'Manage Subscription Plans and Memberships',
      desc: 'Configure subscription packages, prices in Sri Lankan Rupees (LKR), billing durations, and premium feature allocations.',
      icon: CreditCard,
    },
    {
      num: 12,
      title: 'Monitor Payment Records',
      desc: 'Track PayHere checkout transactions, inspect payment status (SUCCESS/PENDING/FAILED), and audit generated system invoices.',
      icon: Receipt,
    },
    {
      num: 13,
      title: 'Handle Complaints and Disputes',
      desc: 'Investigate member grievances, mediate service session disagreements, review communication records, and issue fair resolutions.',
      icon: AlertCircle,
    },
    {
      num: 14,
      title: 'View Platform Analytics and Reports',
      desc: 'Evaluate total hours exchanged, SDG impact metrics, regional distribution, member engagement velocity, and retention trends.',
      icon: BarChart3,
    },
    {
      num: 15,
      title: 'Manage Application Settings and Security',
      desc: 'Supervise microservice operational health, database integrity, email template dispatch logs, and platform security standards.',
      icon: Settings,
    },
  ];

  const isAdmin = user?.roleId === 'SUPER_ADMIN' || user?.roleId === 'ADMIN';

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
            Role Guide &bull; Admin
          </span>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#EAE7F6] shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F2ECFF] text-[#6C3FC5] flex items-center justify-center shadow-xs">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#452080] tracking-tight">
                Admin &bull; How to Use Time Bank
              </h1>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Platform Administrators carry the ultimate responsibility for platform integrity, security, trust, and operational continuity. 
                From personally verifying every member to resolving disputes, administrators protect the community.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
                  alt="Platform administrator dashboard analysis"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#452080]/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs font-bold">Platform Governance</p>
                  <p className="text-[11px] text-purple-100">Integrity, Security, and Trust Across All Chapters</p>
                </div>
              </div>
            </div>
          </div>

          {/* Strict Permission Callout */}
          <div className="mt-8 bg-purple-50/90 border border-purple-200/80 p-5 sm:p-6 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#452080] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#452080]">
                Exclusive Authority: Platform Governance &amp; Registration Approval
              </h3>
              <p className="text-xs text-purple-900 leading-relaxed mt-1">
                Only authenticated Administrators possess platform-wide authority to approve or reject Member and Community Coordinator registrations, 
                moderate skills, adjust balances, configure subscription pricing, and manage security settings. 
                Neither Members nor Community Coordinators have access to these governance tools.
              </p>
            </div>
          </div>
        </div>

        {/* 15 Step-by-Step Instructions */}
        <div className="space-y-6">
          <div className="text-center sm:text-left">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#6C3FC5]">
              Step-by-Step Guide
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#452080] mt-1">
              The 15 Administrator Activities
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Comprehensive responsibilities and operational workflows executed through the Time Bank Governance Portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {adminSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white rounded-2xl p-6 border border-[#EAE7F6] hover:border-[#6C3FC5]/40 hover:shadow-md transition-all flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F2ECFF] group-hover:bg-[#452080] text-[#452080] group-hover:text-white flex items-center justify-center shrink-0 font-display font-extrabold text-sm transition-colors shadow-xs">
                    {step.num}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#6C3FC5]" />
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
        <div className="bg-gradient-to-br from-[#2D1654] to-[#452080] rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left max-w-xl">
            <h3 className="font-display font-extrabold text-2xl text-white">
              Platform Governance Portal
            </h3>
            <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
              Authorized administrators can log in to view pending user approvals, inspect microservice health, and oversee platform transactions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            {isAdmin ? (
              <button
                onClick={() => navigate('/admin')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#452080] hover:bg-purple-50 text-xs font-bold transition-all shadow-md cursor-pointer text-center"
              >
                Open Admin Dashboard
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold border border-white/20 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
