import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './components/home/HomePage.tsx';
import { HeroSection } from './components/home/HeroSection.tsx';
import { HowItWorks } from './components/home/HowItWorks.tsx';
import { CommunitySkillsSection } from './components/home/CommunitySkillsSection.tsx';
import { NearbyHelpersSection } from './components/home/NearbyHelpersSection.tsx';
import { MembershipSection } from './components/home/MembershipSection.tsx';
import { ImpactSection } from './components/home/ImpactSection.tsx';
import { FaqContactSection } from './components/home/FaqContactSection.tsx';
import { AiAssistant } from './components/AiAssistant.tsx';

// Modals
import { LoginModal } from './components/auth/LoginModal.tsx';
import { RegisterModal } from './components/auth/RegisterModal.tsx';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal.tsx';
import { CreateRequestModal } from './components/requests/CreateRequestModal.tsx';
import { BookingDetailModal } from './components/bookings/BookingDetailModal.tsx';
import { ReviewModal } from './components/reviews/ReviewModal.tsx';
import { PayHereModal } from './components/payment/PayHereModal.tsx';
import { ChatDrawer } from './components/messages/ChatDrawer.tsx';

// Dashboards
import { MemberDashboard } from './components/dashboard/MemberDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { CommunityDashboard } from './components/dashboard/CommunityDashboard.tsx';
import { WalletView } from './components/wallet/WalletView.tsx';
import { LearningJourneySection } from './components/learning/LearningJourneySection.tsx';
import { Booking, HelperRecommendation, SubscriptionPlan } from './types/index.ts';

function AppContent() {
  const { user, refreshProfile, setShowLoginModal, setShowRegisterModal } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');

  // Modals state
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [initialSkillForRequest, setInitialSkillForRequest] = useState<string | undefined>(undefined);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ id?: string; name?: string; photo?: string }>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleSelectSkill = (skillName: string) => {
    setInitialSkillForRequest(skillName);
    if (!user) {
      setShowLoginModal(true);
    } else {
      setIsCreateRequestOpen(true);
    }
  };

  const handleSelectHelper = (helper: HelperRecommendation) => {
    // Open chat or direct booking
    setChatTarget({ id: helper.userId, name: helper.fullName, photo: helper.profilePhotoUrl });
    setChatOpen(true);
  };

  const handleOpenChat = (userId?: string, name?: string, photo?: string) => {
    setChatTarget({ id: userId, name, photo });
    setChatOpen(true);
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.price_lkr === 0) {
      alert(`The ${plan.name} is already active for standard members!`);
      return;
    }
    setSelectedPlanForPayment(plan);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7FB]">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openChat={() => handleOpenChat()}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            setCurrentView={setCurrentView}
            onJoinCommunity={() => setShowRegisterModal(true)}
            onExplore={() => setCurrentView('skills')}
          />
        )}

        {currentView === 'skills' && (
          <div className="py-6">
            <CommunitySkillsSection onSelectSkill={handleSelectSkill} />
          </div>
        )}

        {currentView === 'nearby' && (
          <div className="py-6">
            <NearbyHelpersSection onSelectHelper={handleSelectHelper} onRequestHelp={() => setIsCreateRequestOpen(true)} />
          </div>
        )}

        {currentView === 'how-it-works' && (
          <div className="py-6">
            <HowItWorks setCurrentView={setCurrentView} />
            <FaqContactSection />
          </div>
        )}

        {currentView === 'communities' && (
          <CommunityDashboard />
        )}

        {currentView === 'membership' && (
          <div className="py-6">
            <MembershipSection onSelectPlan={handleSelectPlan} />
          </div>
        )}

        {currentView === 'contact' && (
          <div className="py-6">
            <FaqContactSection />
          </div>
        )}

        {currentView === 'dashboard' && (
          <MemberDashboard
            onOpenCreateRequest={() => setIsCreateRequestOpen(true)}
            onOpenBooking={(b) => setSelectedBooking(b)}
            onOpenChat={handleOpenChat}
            onOpenUpgrade={() => setCurrentView('membership')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard />
        )}

        {currentView === 'wallet' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <WalletView />
          </div>
        )}

        {currentView === 'learning' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <LearningJourneySection
              records={user?.learningJourney || []}
              onRefresh={refreshProfile}
            />
          </div>
        )}

        {currentView === 'privacy' && (
          <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
            <h2 className="font-display font-bold text-3xl text-[#452080]">Privacy Policy &bull; Location Protection</h2>
            <div className="bg-white p-8 rounded-3xl border border-[#EAE7F6] text-xs leading-relaxed space-y-4 text-gray-700">
              <p>At <strong>Time Bank</strong>, member safety and privacy are paramount:</p>
              <h4 className="font-bold text-sm text-[#452080]">1. Exact Residential Coordinates Shielding</h4>
              <p>We do not disclose exact street addresses, building numbers, or GPS lat/long to other users. The platform uses Haversine distance computations solely to show approximate distances (e.g. &ldquo;2.4 km away in Nallur, Jaffna&rdquo;).</p>
              <h4 className="font-bold text-sm text-[#452080]">2. Mandatory Registration Review</h4>
              <p>All registration applications are held in PENDING status for administrator review before dashboard access is permitted.</p>
              <h4 className="font-bold text-sm text-[#452080]">3. Time Credit Ledger Integrity</h4>
              <p>All time exchange records and credits are saved securely in SQLite database ledgers. Time credits are never sold or converted into cash.</p>
            </div>
          </div>
        )}

        {currentView === 'terms' && (
          <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
            <h2 className="font-display font-bold text-3xl text-[#452080]">Terms of Exchange &bull; Community Code</h2>
            <div className="bg-white p-8 rounded-3xl border border-[#EAE7F6] text-xs leading-relaxed space-y-4 text-gray-700">
              <h4 className="font-bold text-sm text-[#452080]">1. Equal Valuation Principle</h4>
              <p>One hour of service equals one Time Credit regardless of the technical discipline, academic qualification, or nature of assistance.</p>
              <h4 className="font-bold text-sm text-[#452080]">2. Mutual Confirmation</h4>
              <p>Time credits are transferred only after both the requester and helper confirm completion of the session.</p>
              <h4 className="font-bold text-sm text-[#452080]">3. Non-Monetary Exchange</h4>
              <p>Members agree never to solicit cash, gratuity, or monetary payment for services exchanged under the Time Bank platform.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer setCurrentView={setCurrentView} />

      {/* Floating AI Assistant across application */}
      <AiAssistant />

      {/* Global Modals */}
      <LoginModal
        onSuccess={() => {
          if (user?.roleId === 'SUPER_ADMIN' || user?.roleId === 'ADMIN') {
            setCurrentView('admin');
          } else {
            setCurrentView('dashboard');
          }
        }}
        onOpenRegister={() => setShowRegisterModal(true)}
      />

      <RegisterModal
        onOpenLogin={() => setShowLoginModal(true)}
      />

      <ChangePasswordModal />

      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        initialSkill={initialSkillForRequest}
        onCreated={() => {
          refreshProfile();
          setCurrentView('dashboard');
        }}
      />

      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdated={() => {
          refreshProfile();
        }}
        onOpenReview={(bookingId) => setReviewBookingId(bookingId)}
      />

      <ReviewModal
        bookingId={reviewBookingId}
        onClose={() => setReviewBookingId(null)}
        onSubmitted={() => refreshProfile()}
      />

      <PayHereModal
        plan={selectedPlanForPayment}
        onClose={() => setSelectedPlanForPayment(null)}
        onSuccess={() => {
          setSelectedPlanForPayment(null);
          refreshProfile();
        }}
      />

      <ChatDrawer
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        targetUserId={chatTarget.id}
        targetUserName={chatTarget.name}
        targetUserPhoto={chatTarget.photo}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
