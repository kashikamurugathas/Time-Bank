import React, { useState, useEffect } from 'react';
import { Clock, Send, ShieldCheck, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, History, X } from 'lucide-react';
import { api } from '../../services/api.ts';
import { TimeTransaction } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const WalletView: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState(1.0);
  const [description, setDescription] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const data = await api.getWallet();
      setWallet(data);
      // Also fetch members list for easy transfer recipient selection
      const helpersData = await api.getNearbyHelpers({ lat: 9.6749, lng: 80.0292, radius: 1000 });
      setUsersList(helpersData.helpers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);

    if (amount > (wallet?.availableCredits ?? 0)) {
      setTransferError('You do not have enough time credits for this transfer.');
      return;
    }

    setTransferLoading(true);
    try {
      const res = await api.transferCredits({ toUserId, amount, description });
      setTransferSuccess(`Successfully transferred ${amount} credits! Reference: ${res.referenceNo}`);
      await fetchWallet();
      await refreshProfile();
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(null);
        setDescription('');
      }, 2000);
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed.');
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#6C3FC5] via-[#5A32AA] to-[#452080] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-purple-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Double-Entry SQLite Transaction Ledger</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl">Time Credit Digital Wallet</h2>
            <p className="text-xs text-purple-100/90 max-w-lg leading-relaxed">
              Main Principle: <strong>1 Hour of Community Service = 1 Time Credit</strong>. Credits are earned by helping others and spent when receiving assistance. Not convertible to cash.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center shrink-0 space-y-3">
            <span className="text-xs font-bold text-purple-200 uppercase tracking-wider block">Available Balance</span>
            <div className="font-display font-black text-4xl text-white">
              {(wallet?.availableCredits ?? user?.availableCredits ?? 0).toFixed(1)}{' '}
              <span className="text-xl text-purple-200 font-semibold">Credits</span>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#452080] font-bold text-xs hover:bg-purple-50 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transfer Credits</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Earned Credits</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-emerald-600">
            +{(wallet?.earnedCredits ?? 0).toFixed(1)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">From teaching, repairs &amp; community help</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spent Credits</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-rose-600">
            -{(wallet?.spentCredits ?? 0).toFixed(1)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">For receiving services from members</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Completion</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-3xl text-amber-600">
            {(wallet?.pendingCredits ?? 0).toFixed(1)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Held until mutual confirmation</p>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAE7F6] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#6C3FC5]" />
            <h3 className="font-display font-bold text-lg text-[#452080]">Transaction History Ledger</h3>
          </div>
          <span className="text-xs text-gray-400">Showing last 50 transactions</span>
        </div>

        {wallet?.transactions?.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No transactions yet. Complete your first community exchange to see ledger entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7FB] text-gray-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Reference</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wallet?.transactions?.map((t: TimeTransaction) => {
                  const isIncoming = t.to_user_id === user?.id;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-700">{t.reference_no}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F2ECFF] text-[#6C3FC5]">
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {isIncoming ? (t.from_name || 'System Bonus') : (t.to_name || 'Member')}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{t.description}</td>
                      <td className={`py-3 px-4 text-right font-black ${isIncoming ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isIncoming ? `+${t.amount_credits.toFixed(1)}` : `-${t.amount_credits.toFixed(1)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Credits Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#EAE7F6] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
              <button
                onClick={() => setShowTransferModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-xl text-white">Transfer Time Credits</h3>
              <p className="text-xs text-purple-100/90 mt-1">Directly thank or pay a member for services</p>
            </div>

            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {transferSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Recipient Member</label>
                <select
                  required
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5]"
                >
                  <option value="">-- Choose Approved Member --</option>
                  {usersList.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName} ({u.city}, {u.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Credits Amount (Hours)</label>
                <input
                  type="number"
                  min="0.5"
                  max={(wallet?.availableCredits ?? 0).toString()}
                  step="0.5"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5]"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Available balance: {(wallet?.availableCredits ?? 0).toFixed(1)} Credits
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Exchange Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Thanks for 1 hour of computer coaching"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading || !toUserId}
                  className="px-5 py-2 bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {transferLoading ? 'Transferring...' : 'Send Credits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
