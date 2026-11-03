import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckCircle, AlertCircle, RefreshCw, Star, ShieldCheck } from 'lucide-react';
import { Booking } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface BookingDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
  onUpdated: () => void;
  onOpenReview?: (bookingId: string) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  onUpdated,
  onOpenReview
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reschedule state
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Cancel state
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!booking) return null;

  const isRequester = user?.id === booking.requester_id;
  const isHelper = user?.id === booking.helper_id;
  const partnerName = isRequester ? booking.helper_name : booking.requester_name;
  const partnerPhoto = isRequester ? booking.helper_photo : booking.requester_photo;
  const partnerRole = isRequester ? 'Service Provider / Helper' : 'Requester / Learner';

  const userConfirmed = isRequester ? booking.requester_confirmed_completion : booking.helper_confirmed_completion;
  const partnerConfirmed = isRequester ? booking.helper_confirmed_completion : booking.requester_confirmed_completion;

  const handleConfirmCompletion = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.confirmCompletion(booking.id);
      setSuccessMsg(res.message);
      onUpdated();
      if (res.completed && onOpenReview) {
        setTimeout(() => {
          onClose();
          onOpenReview(booking.id);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm completion.');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.rescheduleBooking(booking.id, { newDate, newTime, reason: rescheduleReason });
      setSuccessMsg('Reschedule request sent to your exchange partner.');
      setShowReschedule(false);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to submit reschedule request.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReschedule = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.acceptReschedule(booking.id);
      setSuccessMsg('Reschedule accepted and booking updated.');
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to accept reschedule.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.cancelBooking(booking.id, cancelReason);
      setSuccessMsg('Booking cancelled.');
      setShowCancel(false);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#EAE7F6] overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20">
              Booking #{booking.booking_code}
            </span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
              booking.status === 'COMPLETED' ? 'bg-emerald-400 text-emerald-950' :
              booking.status === 'CONFIRMED' ? 'bg-purple-200 text-[#452080]' :
              'bg-amber-300 text-amber-950'
            }`}>
              {booking.status}
            </span>
          </div>
          <h3 className="font-display font-bold text-xl text-white">{booking.skill_name}</h3>
          <p className="text-xs text-purple-100/90 mt-0.5">Time Bank Exchange Session</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Partner info */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <img
              src={partnerPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'}
              alt={partnerName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#6C3FC5]/20 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium">{partnerRole}</p>
              <h4 className="font-display font-bold text-sm text-gray-900 truncate">{partnerName}</h4>
              <p className="text-[11px] text-gray-500">{isRequester ? 'Providing the service' : 'Receiving the service'}</p>
            </div>
          </div>

          {/* Booking Schedule Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F7F7FB] border border-[#EAE7F6]">
              <span className="text-[10px] text-gray-400 font-bold block mb-1">DATE &amp; TIME</span>
              <div className="font-bold text-gray-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6C3FC5]" />
                <span>{booking.service_date}</span>
              </div>
              <div className="text-gray-600 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{booking.service_time}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F7F7FB] border border-[#EAE7F6]">
              <span className="text-[10px] text-gray-400 font-bold block mb-1">TIME CREDITS</span>
              <div className="font-extrabold text-[#6C3FC5] text-base">
                {booking.credit_amount.toFixed(1)} Credits
              </div>
              <div className="text-[11px] text-gray-500">
                Duration: {booking.duration_hours} Hour(s)
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-3 rounded-xl bg-[#F7F7FB] border border-[#EAE7F6] text-xs">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">EXCHANGE VENUE</span>
            <div className="font-semibold text-gray-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#6C3FC5] shrink-0" />
              <span>{booking.location_name}</span>
            </div>
          </div>

          {/* Reschedule banner if pending */}
          {booking.status === 'RESCHEDULE_REQUESTED' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold">Reschedule Proposed:</div>
              <p>Proposed to: <strong>{booking.reschedule_proposed_date}</strong> at <strong>{booking.reschedule_proposed_time}</strong></p>
              {booking.reschedule_reason && <p className="italic text-gray-600">&ldquo;{booking.reschedule_reason}&rdquo;</p>}
              <button
                onClick={handleAcceptReschedule}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
              >
                Accept New Schedule
              </button>
            </div>
          )}

          {/* Mutual Completion Status */}
          <div className="p-4 rounded-2xl bg-[#F2ECFF] border border-[#6C3FC5]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#452080]">Mutual Completion Confirmation</span>
              <ShieldCheck className="w-4 h-4 text-[#6C3FC5]" />
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              Both parties must confirm completion for the time credits to transfer automatically.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2.5 rounded-xl border text-center ${
                booking.requester_confirmed_completion ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'
              }`}>
                <div className="font-bold">{isRequester ? 'You (Requester)' : 'Requester'}</div>
                <div className="text-[10px] font-semibold mt-0.5">
                  {booking.requester_confirmed_completion ? '✓ Confirmed' : 'Pending'}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border text-center ${
                booking.helper_confirmed_completion ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'
              }`}>
                <div className="font-bold">{isHelper ? 'You (Helper)' : 'Helper'}</div>
                <div className="text-[10px] font-semibold mt-0.5">
                  {booking.helper_confirmed_completion ? '✓ Confirmed' : 'Pending'}
                </div>
              </div>
            </div>

            {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
              <button
                onClick={handleConfirmCompletion}
                disabled={Boolean(userConfirmed) || loading}
                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all ${
                  userConfirmed
                    ? 'bg-emerald-100 text-emerald-800 cursor-default'
                    : 'bg-[#6C3FC5] hover:bg-[#5A32AA] text-white shadow-md shadow-[#6C3FC5]/20'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{userConfirmed ? 'You Have Confirmed Completion' : 'Confirm Session Completed'}</span>
              </button>
            )}

            {booking.status === 'COMPLETED' && (
              <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center text-xs text-emerald-900 font-bold">
                ✓ Exchange Completed &amp; Time Credits Transferred!
              </div>
            )}
          </div>

          {/* Reschedule or Cancel Actions */}
          {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <button
                type="button"
                onClick={() => setShowReschedule(!showReschedule)}
                className="text-[#6C3FC5] font-bold hover:underline"
              >
                Request Reschedule
              </button>
              <button
                type="button"
                onClick={() => setShowCancel(!showCancel)}
                className="text-rose-600 font-bold hover:underline"
              >
                Cancel Booking
              </button>
            </div>
          )}

          {/* Reschedule sub-form */}
          {showReschedule && (
            <form onSubmit={handleRescheduleSubmit} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
              <div className="font-bold text-gray-800">Propose New Schedule</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder="e.g. 2:00 PM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg"
                />
              </div>
              <input
                type="text"
                placeholder="Reason for reschedule"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-[#6C3FC5] text-white rounded-lg font-bold">
                  Send Reschedule
                </button>
                <button type="button" onClick={() => setShowReschedule(false)} className="px-3 py-2 border rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Cancel sub-form */}
          {showCancel && (
            <form onSubmit={handleCancelBooking} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 text-xs">
              <div className="font-bold text-rose-900">Are you sure you want to cancel?</div>
              <input
                type="text"
                required
                placeholder="Reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold">
                  Confirm Cancellation
                </button>
                <button type="button" onClick={() => setShowCancel(false)} className="px-3 py-2 border border-rose-200 rounded-lg">
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
