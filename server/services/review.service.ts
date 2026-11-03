import { execute, queryAll, queryOne, transaction } from '../db/index.ts';

export class ReviewRatingService {
  async createReview(reviewerId: string, bookingId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5.');
    }

    const booking = queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== 'COMPLETED') {
      throw new Error('Reviews can only be submitted for completed service sessions.');
    }

    const isRequester = booking.requester_id === reviewerId;
    const isHelper = booking.helper_id === reviewerId;

    if (!isRequester && !isHelper) {
      throw new Error('Unauthorized: You were not a participant in this booking.');
    }

    const reviewedUserId = isRequester ? booking.helper_id : booking.requester_id;

    // Prevent duplicate review for the same booking
    const existing = queryOne('SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?', [bookingId, reviewerId]);
    if (existing) {
      throw new Error('You have already submitted a review for this booking.');
    }

    const reviewId = 'REV_' + Date.now();

    transaction(() => {
      execute(
        `INSERT INTO reviews (id, booking_id, reviewer_id, reviewed_user_id, rating, comment)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [reviewId, bookingId, reviewerId, reviewedUserId, Math.round(rating), comment?.trim() || null]
      );

      // Re-calculate target user rating_avg and rating_count
      const stats = queryOne<{ avgRating: number; count: number }>(
        `SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE reviewed_user_id = ?`,
        [reviewedUserId]
      );

      const newAvg = stats?.avgRating ? parseFloat(stats.avgRating.toFixed(2)) : 5.0;
      const newCount = stats?.count || 1;

      execute(
        `UPDATE user_profiles SET rating_avg = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        [newAvg, newCount, reviewedUserId]
      );

      // In-app notification for reviewed user
      const reviewer = queryOne<any>('SELECT full_name FROM user_profiles WHERE user_id = ?', [reviewerId]);
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'New Review Received', ?, 'SYSTEM', ?)`,
        [
          'NOTIF_' + Date.now(),
          reviewedUserId,
          `${reviewer?.full_name || 'A community member'} left you a ${rating}-star review: "${comment ? comment.substring(0, 50) : 'Great exchange!'}"`,
          `/profile`
        ]
      );
    });

    return queryOne('SELECT * FROM reviews WHERE id = ?', [reviewId]);
  }

  async getUserReviews(userId: string) {
    return queryAll<any>(
      `SELECT r.*, p.full_name as reviewer_name, p.profile_photo_url as reviewer_photo, b.skill_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       JOIN bookings b ON r.booking_id = b.id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );
  }
}

export const reviewService = new ReviewRatingService();
