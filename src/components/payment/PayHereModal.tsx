import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { api } from '../../services/api.ts';
import { SubscriptionPlan } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface PayHereModalProps {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayHereModal: React.FC<PayHereModalProps> = ({ plan, onClose, onSuccess }) => {
  const { user, refreshProfile } = useAuth();
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('789');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);

  if (!plan) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Initialize with PayHere gateway
      const initData = await api.initiatePayment({ planId: plan.id });

      // 2. Process & verify test payment in sandbox mode
      const result = await api.processPayment({
        orderId: initData.orderId,
        planId: plan.id,
        amountLkr: plan.price_lkr,
        paymentMethod: 'VISA_DEBIT_SL'
      });

      setInvoice(result);
      await refreshProfile();
      setTimeout(() => {
        onSuccess();
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#EAE7F6] overflow-hidden my-8 flex flex-col">
        {/* Header with PayHere Sri Lanka branding */}
        <div className="bg-gradient-to-r from-[#452080] via-[#5A32AA] to-[#6C3FC5] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PayHere Sandbox (Sri Lanka)</span>
            </span>
            <span className="text-xs text-purple-200 font-bold">LKR Currency</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white">Complete Secure Payment</h3>
          <p className="text-xs text-purple-100/90 mt-1">Upgrade to {plan.name}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {invoice ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-display font-bold text-xl text-emerald-950">Payment Successful!</h4>
              <p className="text-xs text-emerald-700">
                Your payment of <strong>LKR {invoice.amountLkr.toLocaleString()}</strong> has been verified and your subscription to <strong>{invoice.planName}</strong> is active!
              </p>

              {/* Official Invoice Slip */}
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                    <FileText className="w-4 h-4 text-[#6C3FC5]" />
                    <span>Official Invoice #{invoice.invoiceNumber}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">PAID</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <div>Ref: {invoice.transactionRef}</div>
                  <div className="text-right">Gateway: PayHere SL</div>
                  <div>Customer: {user?.fullName}</div>
                  <div className="text-right">Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-[#6C3FC5] text-white text-xs font-bold hover:bg-[#5A32AA]"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              {/* Order summary box */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-gray-900">{plan.name}</h4>
                  <p className="text-[11px] text-gray-500">Duration: {plan.duration_days} Days</p>
                </div>
                <div className="text-right">
                  <span className="font-display font-extrabold text-xl text-[#452080]">
                    LKR {plan.price_lkr.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-gray-400">Total Charged</p>
                </div>
              </div>

              {/* Test Card Inputs */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Card Number (PayHere Sandbox)</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800 text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">CVV / CVC</label>
                  <input
                    type="password"
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] text-gray-800 text-center font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 text-[11px] text-[#452080] leading-relaxed">
                <strong>PayHere Security:</strong> 256-bit SSL encrypted. Simulated test payment will generate a real verified invoice in SQLite and upgrade your membership immediately.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold shadow-md shadow-[#6C3FC5]/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? 'Processing via PayHere...' : `Pay LKR ${plan.price_lkr.toLocaleString()}`}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
