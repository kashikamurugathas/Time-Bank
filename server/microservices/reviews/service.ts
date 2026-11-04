import { reviewsDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { bookingsDb } from '../bookings/db.ts';
import { usersDb } from '../users/db.ts';

const logger = createLogger('review-rating-service');

export class ReviewService {
  async createReview(reviewerId: string, bookingId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5 stars.');
    }

    const booking = bookingsDb.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== 'COMPLETED') throw new Error('Reviews can only be submitted after service completion.');

    const isRequester = booking.requester_id === reviewerId;
    const isHelper = booking.helper_id === reviewerId;
    if (!isRequester && !isHelper) {
      throw new Error('You were not a participant in this booking.');
    }

    const reviewedUserId = isRequester ? booking.helper_id : booking.requester_id;

    // Check duplicate
    const existing = reviewsDb.queryOne('SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?', [bookingId, reviewerId]);
    if (existing) {
      throw new Error('You have already submitted a review for this booking.');
    }

    const reviewId = `REV_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    reviewsDb.execute(
      `INSERT INTO reviews (id, booking_id, reviewer_id, reviewed_user_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reviewId, bookingId, reviewerId, reviewedUserId, Math.round(rating), comment || null]
    );

    // Calculate updated ratings
    const stats = reviewsDb.queryOne<any>(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE reviewed_user_id = ?',
      [reviewedUserId]
    );

    const avg = Math.round((stats.avg_rating || 5.0) * 10) / 10;
    const count = stats.count || 0;

    // Update in User DB
    usersDb.execute(
      'UPDATE user_profiles SET rating_avg = ?, rating_count = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [avg, count, reviewedUserId]
    );

    eventBus.publish('review.created', {
      reviewId,
      bookingId,
      reviewerId,
      reviewedUserId,
      rating: Math.round(rating),
      comment,
      newAverage: avg,
    });

    logger.info(`Review created: ${rating} stars by ${reviewerId} for ${reviewedUserId}`);

    return {
      id: reviewId,
      bookingId,
      reviewerId,
      reviewedUserId,
      rating: Math.round(rating),
      comment,
      message: 'Thank you! Your review and rating have been posted.',
    };
  }

  async getUserReviews(userId: string) {
    const reviews = reviewsDb.queryAll<any>(
      `SELECT * FROM reviews WHERE reviewed_user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    return reviews.map(r => {
      const reviewerProfile = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, city FROM user_profiles WHERE user_id = ?', [r.reviewer_id]);
      const booking = bookingsDb.queryOne<any>('SELECT skill_name, service_date FROM bookings WHERE id = ?', [r.booking_id]);
      return {
        ...r,
        reviewerName: reviewerProfile?.full_name || 'Community Member',
        reviewerPhoto: reviewerProfile?.profile_photo_url || null,
        skillName: booking?.skill_name || 'Exchanged Service',
        serviceDate: booking?.service_date || r.created_at,
      };
    });
  }
}

export const reviewService = new ReviewService();
