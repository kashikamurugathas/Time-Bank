import { bookingsDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { usersDb } from '../users/db.ts';

const logger = createLogger('booking-scheduling-service');

export class BookingService {
  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    // When a help request offer is accepted, create the booking
    eventBus.subscribe('request.offer_accepted', (data: any) => {
      try {
        const bookingCode = `TB-${Math.floor(100000 + Math.random() * 900000)}`;
        const bookingId = `BKG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        bookingsDb.execute(
          `INSERT INTO bookings (id, booking_code, request_id, requester_id, helper_id, skill_name, service_date, service_time, duration_hours, credit_amount, location_name, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
          [
            bookingId,
            bookingCode,
            data.requestId || null,
            data.requesterId,
            data.helperId,
            data.skillName,
            data.serviceDate,
            data.serviceTime,
            data.durationHours || 1.0,
            data.creditAmount || 1.0,
            data.locationName || 'To Be Arranged',
          ]
        );

        this.addHistory(bookingId, 'BOOKING_CREATED', data.requesterId, 'Booking confirmed from accepted help request offer');

        eventBus.publish('booking.created', {
          bookingId,
          bookingCode,
          requesterId: data.requesterId,
          helperId: data.helperId,
          skillName: data.skillName,
          serviceDate: data.serviceDate,
          serviceTime: data.serviceTime,
          creditAmount: data.creditAmount || 1.0,
        });

        logger.info(`Booking created via offer acceptance: ${bookingCode} (${bookingId})`);
      } catch (err: any) {
        logger.error(`Error handling request.offer_accepted in Booking Service: ${err.message}`);
      }
    });
  }

  private addHistory(bookingId: string, action: string, actorId: string, notes?: string) {
    bookingsDb.execute(
      `INSERT INTO booking_history (id, booking_id, action, actor_id, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [`BH_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, bookingId, action, actorId, notes || null]
    );
  }

  async getUserBookings(userId: string, roleFilter?: 'requester' | 'helper') {
    let sql = `SELECT * FROM bookings WHERE `;
    const params: any[] = [];

    if (roleFilter === 'requester') {
      sql += `requester_id = ?`;
      params.push(userId);
    } else if (roleFilter === 'helper') {
      sql += `helper_id = ?`;
      params.push(userId);
    } else {
      sql += `(requester_id = ? OR helper_id = ?)`;
      params.push(userId, userId);
    }

    sql += ` ORDER BY service_date DESC, service_time DESC`;
    const rows = bookingsDb.queryAll<any>(sql, params);

    return rows.map(b => {
      const isRequester = b.requester_id === userId;
      const otherUserId = isRequester ? b.helper_id : b.requester_id;
      const otherProfile = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, phone_number, rating_avg, city, district FROM user_profiles WHERE user_id = ?', [otherUserId]);

      return {
        ...b,
        userRole: isRequester ? 'REQUESTER' : 'HELPER',
        otherUser: {
          id: otherUserId,
          fullName: otherProfile?.full_name || 'Community Member',
          profilePhotoUrl: otherProfile?.profile_photo_url || null,
          phoneNumber: otherProfile?.phone_number || '',
          ratingAvg: otherProfile?.rating_avg || 5.0,
          location: `${otherProfile?.city || ''}, ${otherProfile?.district || ''}`,
        },
      };
    });
  }

  async getBookingById(id: string) {
    const booking = bookingsDb.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) return null;

    const requesterProfile = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, phone_number, rating_avg FROM user_profiles WHERE user_id = ?', [booking.requester_id]);
    const helperProfile = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, phone_number, rating_avg FROM user_profiles WHERE user_id = ?', [booking.helper_id]);
    const history = bookingsDb.queryAll<any>('SELECT * FROM booking_history WHERE booking_id = ? ORDER BY created_at ASC', [id]);

    return {
      ...booking,
      requester: {
        id: booking.requester_id,
        fullName: requesterProfile?.full_name || 'Requester',
        profilePhotoUrl: requesterProfile?.profile_photo_url || null,
        phoneNumber: requesterProfile?.phone_number || '',
        ratingAvg: requesterProfile?.rating_avg || 5.0,
      },
      helper: {
        id: booking.helper_id,
        fullName: helperProfile?.full_name || 'Helper',
        profilePhotoUrl: helperProfile?.profile_photo_url || null,
        phoneNumber: helperProfile?.phone_number || '',
        ratingAvg: helperProfile?.rating_avg || 5.0,
      },
      history,
    };
  }

  async createDirectBooking(requesterId: string, data: {
    helperId: string;
    skillName: string;
    serviceDate: string;
    serviceTime: string;
    durationHours: number;
    creditAmount: number;
    locationName: string;
    notes?: string;
  }) {
    if (requesterId === data.helperId) {
      throw new Error('You cannot book a service with yourself.');
    }

    const bookingCode = `TB-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = `BKG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    bookingsDb.execute(
      `INSERT INTO bookings (id, booking_code, requester_id, helper_id, skill_name, service_date, service_time, duration_hours, credit_amount, location_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [
        id,
        bookingCode,
        requesterId,
        data.helperId,
        data.skillName,
        data.serviceDate,
        data.serviceTime,
        data.durationHours || 1.0,
        data.creditAmount || 1.0,
        data.locationName || 'Agreed Location',
      ]
    );

    this.addHistory(id, 'DIRECT_BOOKING_CREATED', requesterId, data.notes || 'Direct booking created');

    eventBus.publish('booking.created', {
      bookingId: id,
      bookingCode,
      requesterId,
      helperId: data.helperId,
      skillName: data.skillName,
      serviceDate: data.serviceDate,
      serviceTime: data.serviceTime,
      creditAmount: data.creditAmount || 1.0,
    });

    return this.getBookingById(id);
  }

  async confirmCompletion(bookingId: string, userId: string) {
    const booking = bookingsDb.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');
    if (booking.status === 'COMPLETED') {
      return { success: true, message: 'This booking has already been completed.' };
    }

    let isRequester = booking.requester_id === userId;
    let isHelper = booking.helper_id === userId;

    if (!isRequester && !isHelper) {
      throw new Error('You are not authorized to confirm this booking.');
    }

    let reqConfirmed = booking.requester_confirmed_completion;
    let helpConfirmed = booking.helper_confirmed_completion;

    if (isRequester) reqConfirmed = 1;
    if (isHelper) helpConfirmed = 1;

    const bothConfirmed = reqConfirmed === 1 && helpConfirmed === 1;

    if (bothConfirmed) {
      bookingsDb.execute(
        `UPDATE bookings
         SET requester_confirmed_completion = 1, helper_confirmed_completion = 1, status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [bookingId]
      );
      this.addHistory(bookingId, 'COMPLETED', userId, 'Both parties confirmed completion. Time credits transferred.');

      // Update completed count in User Profiles
      usersDb.execute('UPDATE user_profiles SET completed_services_count = completed_services_count + 1 WHERE user_id IN (?, ?)', [booking.requester_id, booking.helper_id]);

      // Publish event for Wallet Service to transfer time credits!
      eventBus.publish('booking.completed', {
        bookingId,
        bookingCode: booking.booking_code,
        requesterId: booking.requester_id,
        helperId: booking.helper_id,
        amountCredits: booking.credit_amount,
        skillName: booking.skill_name,
      });

      return {
        success: true,
        isFullyCompleted: true,
        message: `Service marked as complete! ${booking.credit_amount} Time Credit(s) transferred from requester to helper.`,
      };
    } else {
      bookingsDb.execute(
        `UPDATE bookings
         SET requester_confirmed_completion = ?, helper_confirmed_completion = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [reqConfirmed, helpConfirmed, bookingId]
      );
      this.addHistory(bookingId, 'CONFIRMATION_SUBMITTED', userId, `Completion confirmed by ${isRequester ? 'requester' : 'helper'}. Waiting for other party.`);

      return {
        success: true,
        isFullyCompleted: false,
        message: 'Your completion confirmation has been logged. Credits will transfer once the other member confirms.',
      };
    }
  }

  async rescheduleBooking(bookingId: string, userId: string, newDate: string, newTime: string, reason?: string) {
    const booking = bookingsDb.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');

    bookingsDb.execute(
      `UPDATE bookings
       SET status = 'RESCHEDULE_REQUESTED',
           reschedule_proposed_date = ?,
           reschedule_proposed_time = ?,
           reschedule_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newDate, newTime, reason || null, bookingId]
    );

    this.addHistory(bookingId, 'RESCHEDULE_REQUESTED', userId, `Proposed: ${newDate} at ${newTime}. Reason: ${reason || 'Not specified'}`);

    eventBus.publish('booking.reschedule_requested', {
      bookingId,
      requestedBy: userId,
      targetUserId: userId === booking.requester_id ? booking.helper_id : booking.requester_id,
      newDate,
      newTime,
    });

    return { success: true, message: 'Reschedule request sent to the other party.' };
  }

  async acceptReschedule(bookingId: string, userId: string) {
    const booking = bookingsDb.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');
    if (!booking.reschedule_proposed_date) throw new Error('No pending reschedule proposal found.');

    bookingsDb.execute(
      `UPDATE bookings
       SET service_date = reschedule_proposed_date,
           service_time = reschedule_proposed_time,
           status = 'CONFIRMED',
           reschedule_proposed_date = NULL,
           reschedule_proposed_time = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [bookingId]
    );

    this.addHistory(bookingId, 'RESCHEDULE_ACCEPTED', userId, 'New schedule confirmed');
    return { success: true, message: 'New date and time confirmed!' };
  }

  async cancelBooking(bookingId: string, userId: string, reason: string) {
    const booking = bookingsDb.queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');

    bookingsDb.execute(
      `UPDATE bookings SET status = 'CANCELLED', cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [reason || 'Cancelled by member', bookingId]
    );

    this.addHistory(bookingId, 'CANCELLED', userId, `Reason: ${reason}`);

    eventBus.publish('booking.cancelled', {
      bookingId,
      cancelledBy: userId,
      requesterId: booking.requester_id,
      helperId: booking.helper_id,
      reason,
    });

    return { success: true, message: 'Booking has been cancelled.' };
  }
}

export const bookingService = new BookingService();
