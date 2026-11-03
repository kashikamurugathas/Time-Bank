import React, { useState } from 'react';
import { X, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';

interface ReviewModalProps {
  bookingId: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ bookingId, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!bookingId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createReview({ bookingId, rating, comment });
      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#EAE7F6] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C3FC5] to-[#452080] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-200">Member Feedback</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white">Rate Your Experience</h3>
          <p className="text-xs text-purple-100/90 mt-1">Help build community trust and celebrate great service</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Thank you! Your review has been recorded.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Picker */}
            <div className="text-center py-2">
              <span className="text-xs font-bold text-gray-500 block mb-2">Select Star Rating</span>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(rating)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform transform hover:scale-125"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-[#6C3FC5] mt-1 block">
                {rating === 5 ? 'Exceptional Service (5/5)' :
                 rating === 4 ? 'Very Good (4/5)' :
                 rating === 3 ? 'Good (3/5)' :
                 rating === 2 ? 'Fair (2/5)' : 'Needs Improvement (1/5)'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Your Written Review</label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on punctuality, knowledge, friendliness, and communication..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#6C3FC5] focus:bg-white text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 rounded-xl bg-[#6C3FC5] hover:bg-[#5A32AA] text-white text-xs font-bold transition-all shadow-md shadow-[#6C3FC5]/20 disabled:opacity-50"
            >
              <span>{loading ? 'Submitting Review...' : 'Submit Member Review'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
