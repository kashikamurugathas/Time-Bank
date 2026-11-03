import React, { useState, useEffect } from 'react';
import {
  Clock, Shield, Star, Sparkles, Plus, Calendar, MapPin,
  ChevronRight, Award, MessageSquare, AlertCircle, CheckCircle,
  HelpCircle, Settings, User, BookOpen, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { HelpRequest, Booking, UserSkill } from '../../types/index.ts';
import { LearningJourneySection } from '../learning/LearningJourneySection.tsx';
import { WalletView } from '../wallet/WalletView.tsx';

interface MemberDashboardProps {
  onOpenCreateRequest: () => void;
  onOpenBooking: (booking: Booking) => void;
  onOpenChat: (userId?: string, name?: string, photo?: string) => void;
  onOpenUpgrade: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  onOpenCreateRequest,
  onOpenBooking,
  onOpenChat,
  onOpenUpgrade
}) => {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REQUESTS' | 'BOOKINGS' | 'SKILLS' | 'LEARNING' | 'WALLET'>('OVERVIEW');
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Add skill modal state
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [newSkillDesc, setNewSkillDesc] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reqs, bks] = await Promise.all([
        api.getRequests({ requesterId: user.id }),
        api.getBookings('ALL')
      ]);
      setMyRequests(reqs || []);
      setMyBookings(bks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await api.addUserSkill({
        skillName: newSkillName,
        experienceLevel: newSkillLevel,
        description: newSkillDesc
      });
      setShowAddSkillModal(false);
      setNewSkillName('');
      setNewSkillDesc('');
      await refreshProfile();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (confirm('Remove this skill from your profile?')) {
      await api.deleteUserSkill(id);
      await refreshProfile();
    }
  };

  const handleAcceptOffer = async (requestId: string, offerId: string) => {
    try {
      await api.acceptOffer(requestId, offerId);
      alert('Offer accepted and booking confirmed!');
      loadData();
      await refreshProfile();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE7F6] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={user.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
            alt={user.fullName}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[#6C3FC5]/20 shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-extrabold text-2xl text-[#452080]">{user.fullName}</h2>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#F2ECFF] text-[#6C3FC5]">
                {user.accountType}
              </span>
              {user.membershipTier === 'PREMIUM' ? (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  ★ Premium Member
                </span>
              ) : (
                <button
                  onClick={onOpenUpgrade}
                  className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-[#6C3FC5] hover:bg-purple-200 transition-colors"
                >
                  Upgrade to Premium
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{user.city || 'Nallur'}, {user.district || 'Jaffna'}, Sri Lanka</span>
            </p>
            <p className="text-xs text-gray-600 line-clamp-1 max-w-xl">{user.bio}</p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={onOpenCreateRequest}
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-all shadow-md shadow-[#6C3FC5]/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Request Community Help</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'OVERVIEW', label: 'Dashboard Overview' },
          { id: 'REQUESTS', label: `My Help Requests (${myRequests.length})` },
          { id: 'BOOKINGS', label: `My Bookings (${myBookings.length})` },
          { id: 'SKILLS', label: `My Skills (${user.skills?.length || 0})` },
          { id: 'LEARNING', label: 'My Learning Journey' },
          { id: 'WALLET', label: 'Time Credit Wallet' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'border-[#6C3FC5] text-[#6C3FC5]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">WALLET CREDITS</span>
              <div className="font-display font-black text-3xl text-[#6C3FC5]">
                {(user.availableCredits ?? 0).toFixed(1)}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Available to exchange</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">MEMBER RATING</span>
              <div className="font-display font-black text-3xl text-amber-500 flex items-center gap-1">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                <span>{(user.ratingAvg ?? 5.0).toFixed(1)}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">From {user.ratingCount ?? 0} reviews</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">COMPLETED EXCHANGES</span>
              <div className="font-display font-black text-3xl text-[#452080]">
                {user.completedServicesCount ?? 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Sessions finished</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">PUBLISHED SKILLS</span>
              <div className="font-display font-black text-3xl text-emerald-600">
                {user.skills?.length || 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Offered to neighbors</p>
            </div>
          </div>

          {/* Active Requests and Upcoming Bookings Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Help Requests */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#6C3FC5]" />
                  <h3 className="font-display font-bold text-base text-[#452080]">My Active Help Requests</h3>
                </div>
                <button
                  onClick={() => setActiveTab('REQUESTS')}
                  className="text-xs text-[#6C3FC5] font-bold hover:underline"
                >
                  View All
                </button>
              </div>

              {myRequests.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  You have not posted any help requests yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myRequests.slice(0, 3).map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-bold text-xs text-gray-900">{r.title}</h4>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          r.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{r.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                        <span>{r.preferred_date} &bull; {r.duration_hours} Credit(s)</span>
                        <span className="font-bold text-[#6C3FC5]">{r.response_count || 0} Offer(s)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#6C3FC5]" />
                  <h3 className="font-display font-bold text-base text-[#452080]">Upcoming Service Sessions</h3>
                </div>
                <button
                  onClick={() => setActiveTab('BOOKINGS')}
                  className="text-xs text-[#6C3FC5] font-bold hover:underline"
                >
                  View All
                </button>
              </div>

              {myBookings.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No upcoming bookings. Connect with nearby helpers to schedule a session!
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onOpenBooking(b)}
                      className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#6C3FC5]/40 cursor-pointer transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-extrabold text-gray-400">#{b.booking_code}</span>
                          <h4 className="font-display font-bold text-xs text-gray-900">{b.skill_name}</h4>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-[#452080]'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>{b.service_date} at {b.service_time}</span>
                        <span className="font-bold text-[#6C3FC5]">{b.credit_amount} Credit(s)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#452080]">My Help Requests</h3>
            <button
              onClick={onOpenCreateRequest}
              className="px-4 py-2 rounded-xl bg-[#6C3FC5] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Request</span>
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE7F6] text-gray-400 text-xs">
              No help requests posted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myRequests.map((r) => (
                <div key={r.id} className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {r.category}
                      </span>
                      <h4 className="font-display font-bold text-base text-gray-900 mt-1">{r.title}</h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F2ECFF] text-[#6C3FC5]">
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">{r.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl">
                    <div>Preferred: {r.preferred_date} ({r.preferred_time})</div>
                    <div className="text-right font-bold text-[#6C3FC5]">{r.duration_hours} Hour(s) &bull; {r.credits_offered} Credits</div>
                    <div className="col-span-2 text-gray-600 truncate">Venue: {r.location_name}</div>
                  </div>

                  {/* Received Offers */}
                  {r.responses && r.responses.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <span className="text-[11px] font-bold text-[#452080] block">Received Helper Offers ({r.responses.length}):</span>
                      {r.responses.map((offer) => (
                        <div key={offer.id} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-gray-900">{offer.helper_name}</span>
                            <p className="text-[10px] text-gray-600 line-clamp-1">&ldquo;{offer.message}&rdquo;</p>
                          </div>
                          {offer.status === 'PENDING' ? (
                            <button
                              onClick={() => handleAcceptOffer(r.id, offer.id)}
                              className="px-3 py-1 rounded-lg bg-[#6C3FC5] text-white text-xs font-bold hover:bg-[#5A32AA] shrink-0"
                            >
                              Accept Offer
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase">{offer.status}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: BOOKINGS */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-6">
          <h3 className="font-display font-bold text-lg text-[#452080]">My Booking Sessions</h3>
          {myBookings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE7F6] text-gray-400 text-xs">
              No booking sessions scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onOpenBooking(b)}
                  className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs hover:border-[#6C3FC5]/40 cursor-pointer transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Ref #{b.booking_code}</span>
                      <h4 className="font-display font-bold text-base text-gray-900">{b.skill_name}</h4>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-[#452080]'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl">
                    <div>Date: {b.service_date}</div>
                    <div className="text-right">Time: {b.service_time}</div>
                    <div className="col-span-2 truncate">Venue: {b.location_name}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-extrabold text-[#6C3FC5]">{b.credit_amount} Time Credits</span>
                    <button className="text-xs font-bold text-[#6C3FC5] hover:underline flex items-center gap-1">
                      <span>View Details &bull; Confirm</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: SKILLS */}
      {activeTab === 'SKILLS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-[#452080]">My Registered Talents &amp; Skills</h3>
              <p className="text-xs text-gray-500">Skills you offer to other members in exchange for time credits</p>
            </div>
            <button
              onClick={() => setShowAddSkillModal(true)}
              className="px-4 py-2 rounded-xl bg-[#6C3FC5] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {user.skills?.map((s) => (
              <div key={s.id} className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {s.experienceLevel}
                    </span>
                    <button
                      onClick={() => handleDeleteSkill(s.id)}
                      className="text-gray-400 hover:text-rose-500 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                  <h4 className="font-display font-bold text-base text-gray-900 mb-1">{s.skillName}</h4>
                  <p className="text-xs text-gray-600 line-clamp-3">{s.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#6C3FC5]">1 Hour = 1 Credit</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">● {s.availabilityStatus}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Skill Modal */}
          {showAddSkillModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h4 className="font-display font-bold text-lg text-[#452080]">Add Skill to Your Profile</h4>
                  <button onClick={() => setShowAddSkillModal(false)} className="p-1 text-gray-400 hover:text-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddSkill} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Skill Name</label>
                    <input
                      type="text"
                      required
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="e.g. Electrical Repair or Piano Lessons"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Experience Level</label>
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Description &amp; Availability</label>
                    <textarea
                      rows={3}
                      value={newSkillDesc}
                      onChange={(e) => setNewSkillDesc(e.target.value)}
                      placeholder="What can you teach or help with during a session?"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddSkillModal(false)} className="px-4 py-2 border rounded-xl text-xs">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 bg-[#6C3FC5] text-white text-xs font-bold rounded-xl">
                      Save Skill
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: LEARNING */}
      {activeTab === 'LEARNING' && (
        <LearningJourneySection
          records={user.learningJourney || []}
          onRefresh={refreshProfile}
        />
      )}

      {/* Tab 6: WALLET */}
      {activeTab === 'WALLET' && (
        <WalletView />
      )}
    </div>
  );
};
