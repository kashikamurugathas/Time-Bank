import React, { useState, useEffect } from 'react';
import {
  Shield, UserCheck, Users, Clock, Award, AlertCircle, CheckCircle2,
  XCircle, Ban, Search, DollarSign, FileText, Settings, Key, Sliders, ExternalLink
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { SubscriptionPlan } from '../../types/index.ts';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'APPROVALS' | 'USERS' | 'PLANS' | 'TRANSACTIONS' | 'LOGS'>('APPROVALS');
  const [report, setReport] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter state for users
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject modal
  const [rejectModalUser, setRejectModalUser] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Wallet adjustment modal
  const [adjustModalUser, setAdjustModalUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(5.0);
  const [adjustReason, setAdjustReason] = useState('Community volunteer bonus');

  // Edit plan price modal
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [newPlanPrice, setNewPlanPrice] = useState<number>(0);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [rep, pending, usersData, txs, plansData, auditLogs] = await Promise.all([
        api.getAdminReport(),
        api.getPendingApprovals(),
        api.getAllUsers({ status: statusFilter, type: typeFilter, search: searchQuery }),
        api.getAllTransactions(),
        api.getPlans(),
        api.getAuditLogs()
      ]);
      setReport(rep);
      setPendingUsers(pending || []);
      setAllUsers(usersData || []);
      setTransactions(txs || []);
      setPlans(plansData || []);
      setLogs(auditLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter, typeFilter]);

  const handleApprove = async (targetUserId: string) => {
    try {
      const res = await api.approveUser(targetUserId);
      setMsg({ type: 'success', text: res.message });
      fetchAdminData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalUser) return;
    try {
      const res = await api.rejectUser(rejectModalUser.id, rejectReason);
      setMsg({ type: 'success', text: res.message });
      setRejectModalUser(null);
      setRejectReason('');
      fetchAdminData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleToggleSuspend = async (targetUserId: string, isSuspended: boolean) => {
    const action = isSuspended ? 'reactivate' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await api.suspendUser(targetUserId, !isSuspended, 'Administrative policy enforcement');
      setMsg({ type: 'success', text: res.message });
      fetchAdminData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalUser) return;
    try {
      const res = await api.adjustWallet(adjustModalUser.id, adjustAmount, adjustReason);
      setMsg({ type: 'success', text: `Adjusted wallet credits. New balance: ${res.newBalance} credits.` });
      setAdjustModalUser(null);
      fetchAdminData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlan) return;
    try {
      await api.updatePlan(editPlan.id, { priceLkr: newPlanPrice });
      setMsg({ type: 'success', text: `Updated ${editPlan.name} price to LKR ${newPlanPrice}.` });
      setEditPlan(null);
      fetchAdminData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-[#452080] via-[#5A32AA] to-[#6C3FC5] rounded-3xl p-8 text-white relative shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-purple-200">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>SUPER_ADMIN Governance Panel</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl">Platform Management &amp; Approvals</h2>
            <p className="text-xs text-purple-100/90 max-w-xl">
              Administrator control center for member verification, community safety, time credit governance, and subscription billing in Sri Lanka.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-center">
              <span className="text-[10px] font-bold text-purple-200 uppercase block">Pending Review</span>
              <span className="font-display font-black text-2xl text-amber-300">{pendingUsers.length}</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <span className="text-[10px] font-bold text-purple-200 uppercase block">Total Members</span>
              <span className="font-display font-black text-2xl text-white">{report?.users?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="font-bold underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'APPROVALS', label: `Pending Approvals (${pendingUsers.length})`, highlight: pendingUsers.length > 0 },
          { id: 'OVERVIEW', label: 'Platform KPIs' },
          { id: 'USERS', label: `User Management (${allUsers.length})` },
          { id: 'PLANS', label: 'Subscriptions & Pricing' },
          { id: 'TRANSACTIONS', label: 'Time Credit Ledger' },
          { id: 'LOGS', label: 'Audit Trail Logs' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-[1px] flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-[#6C3FC5] text-[#6C3FC5]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.highlight && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Tab: PENDING APPROVALS (Mandatory Workflow) */}
      {activeTab === 'APPROVALS' && (
        <div className="space-y-6">
          <div className="bg-[#F2ECFF] p-4 rounded-2xl border border-[#6C3FC5]/20 flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#6C3FC5] shrink-0" />
            <p className="text-xs text-[#452080] leading-relaxed">
              <strong>Mandatory Admin Approval Workflow:</strong> Newly registered accounts remain in PENDING state and cannot log in until approved. Approving grants 3.0 welcome credits and dispatches an approval email.
            </p>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE7F6] space-y-3">
              <UserCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-display font-bold text-lg text-gray-800">All Registrations Reviewed!</h4>
              <p className="text-xs text-gray-500">There are no pending accounts waiting for administrator review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingUsers.map((u) => (
                <div key={u.id} className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <img
                        src={u.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                        alt={u.full_name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-base text-gray-900 truncate">{u.full_name}</h4>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{u.phone_number || 'No phone provided'}</p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                      <div>Location: <strong>{u.city}, {u.district}</strong> ({u.country})</div>
                      <div>Account Type: <strong>{u.account_type}</strong></div>
                      <div>Registered On: {new Date(u.created_at).toLocaleString()}</div>
                      {u.bio && <div className="italic text-gray-600 pt-1">&ldquo;{u.bio}&rdquo;</div>}
                    </div>

                    {/* Registered Skills */}
                    {u.skills && u.skills.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Proposed Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {u.skills.map((s: any) => (
                            <span key={s.id} className="text-[11px] font-semibold bg-purple-50 text-[#452080] border border-purple-100 px-2.5 py-1 rounded-lg">
                              {s.skill_name} ({s.experience_level})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Approve / Reject buttons */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => setRejectModalUser(u)}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleApprove(u.id)}
                      className="px-5 py-2 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold shadow-md shadow-[#6C3FC5]/20 transition-all flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Approve Account</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: OVERVIEW KPIS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Accounts</span>
              <div className="font-display font-black text-3xl text-gray-900 mt-1">{report?.users?.total || 0}</div>
              <div className="text-[10px] text-emerald-600 mt-1">{report?.users?.approved || 0} Approved</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Pending Approvals</span>
              <div className="font-display font-black text-3xl text-amber-500 mt-1">{report?.users?.pending || 0}</div>
              <div className="text-[10px] text-amber-700 mt-1">Requires review</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Platform Revenue</span>
              <div className="font-display font-black text-3xl text-[#6C3FC5] mt-1">
                LKR {(report?.financials?.totalRevenueLkr || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-purple-700 mt-1">{report?.financials?.activeSubscriptions || 0} Active Subscriptions</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6]">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Service Bookings</span>
              <div className="font-display font-black text-3xl text-[#452080] mt-1">{report?.operations?.totalBookings || 0}</div>
              <div className="text-[10px] text-gray-500 mt-1">{report?.operations?.totalHelpRequests || 0} Help Requests</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: USERS MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-3xl p-5 border border-[#EAE7F6] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="ALL">All Account Types</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="COMMUNITY">Community</option>
                <option value="ORGANIZATION">Organization</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by name, email, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
              />
              <button
                onClick={fetchAdminData}
                className="px-4 py-2 bg-[#6C3FC5] text-white text-xs font-bold rounded-xl"
              >
                Search
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-3xl border border-[#EAE7F6] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7FB] text-gray-500 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role &amp; Type</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Wallet</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map((u) => {
                    const isSuspended = u.status === 'SUSPENDED';
                    const isPending = u.status === 'PENDING';
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-purple-100"
                            />
                            <div>
                              <div className="font-bold text-gray-900">{u.full_name}</div>
                              <div className="text-[10px] text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">{u.account_type}</span>
                          <div className="text-[10px] text-[#6C3FC5] font-bold">{u.role_id}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{u.city || 'N/A'}, {u.district}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            u.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#6C3FC5]">
                          {(u.available_credits ?? 0).toFixed(1)} Cr
                        </td>
                        <td className="py-3 px-4">
                          {(u.rating_avg ?? 5.0).toFixed(1)} ★
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setAdjustModalUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-[#F2ECFF] text-[#6C3FC5] font-bold hover:bg-purple-100"
                            title="Adjust time credits"
                          >
                            Adjust Cr
                          </button>
                          {u.role_id !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleToggleSuspend(u.id, isSuspended)}
                              className={`px-2.5 py-1 rounded-lg font-bold ${
                                isSuspended ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: PLANS & PRICING */}
      {activeTab === 'PLANS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-[#452080]">Configurable Subscription Plans (LKR)</h3>
              <p className="text-xs text-gray-500">Configure Sri Lankan Rupee pricing and features</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#6C3FC5] bg-[#F2ECFF] px-2 py-0.5 rounded">
                    {p.category}
                  </span>
                  <h4 className="font-display font-bold text-lg text-gray-900 mt-2">{p.name}</h4>
                  <div className="font-black text-2xl text-[#452080] my-2">
                    {p.price_lkr === 0 ? 'Free' : `LKR ${p.price_lkr.toLocaleString()}`}
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 mb-4">
                    {p.features?.map((f: string, i: number) => (
                      <li key={i}>&bull; {f}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setEditPlan(p);
                    setNewPlanPrice(p.price_lkr);
                  }}
                  className="w-full py-2 bg-gray-100 hover:bg-[#F2ECFF] hover:text-[#6C3FC5] rounded-xl text-xs font-bold transition-colors"
                >
                  Edit Plan Price
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: TRANSACTIONS LEDGER */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-lg text-[#452080]">Full Platform Transaction Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7FB] text-gray-500 text-[10px] uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 px-4 font-mono font-bold">{t.reference_no}</td>
                    <td className="py-3 px-4">{t.from_name || 'System'}</td>
                    <td className="py-3 px-4">{t.to_name || 'System'}</td>
                    <td className="py-3 px-4 font-black text-[#6C3FC5]">{t.amount_credits} Cr</td>
                    <td className="py-3 px-4">{t.transaction_type}</td>
                    <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{t.description}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: AUDIT TRAIL LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-lg text-[#452080]">Security Audit Trail</h3>
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#6C3FC5]">{l.action}</span> by {l.admin_name}
                  <p className="text-[11px] text-gray-600 mt-0.5">{l.details}</p>
                </div>
                <span className="text-[10px] text-gray-400">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-display font-bold text-lg text-rose-800">Reject Application</h4>
            <p className="text-xs text-gray-600">
              Provide a clear reason for rejecting the registration of <strong>{rejectModalUser.full_name}</strong>. An email notification will be sent.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (e.g. Incomplete credentials or non-verifiable phone number)..."
                className="w-full p-3 bg-gray-50 border rounded-xl text-xs"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRejectModalUser(null)} className="px-4 py-2 border rounded-xl text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Adjustment Modal */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-display font-bold text-lg text-[#452080]">Adjust Member Time Credits</h4>
            <p className="text-xs text-gray-600">
              Credit bonus or dispute correction for <strong>{adjustModalUser.full_name}</strong>.
            </p>
            <form onSubmit={handleAdjustWallet} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Credit Adjustment Amount (positive to add, negative to deduct)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseFloat(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-bold text-[#6C3FC5]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setAdjustModalUser(null)} className="px-4 py-2 border rounded-xl text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#6C3FC5] text-white rounded-xl text-xs font-bold">
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Price Modal */}
      {editPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-display font-bold text-lg text-[#452080]">Update Plan Price: {editPlan.name}</h4>
            <form onSubmit={handleUpdatePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Price in LKR per Month</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(parseFloat(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditPlan(null)} className="px-4 py-2 border rounded-xl text-xs">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#6C3FC5] text-white rounded-xl text-xs font-bold">
                  Save Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
