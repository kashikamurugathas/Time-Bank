import { execute, queryAll, queryOne, transaction } from '../db/index.ts';
import { walletService } from './wallet.service.ts';
import { emailService } from './email.service.ts';

export class BookingService {
  async createDirectBooking(requesterId: string, data: {
    helperId: string;
    skillName: string;
    serviceDate: string;
    serviceTime: string;
    durationHours?: number;
    creditAmount?: number;
    locationName: string;
  }) {
    if (requesterId === data.helperId) {
      throw new Error('You cannot create a booking with yourself.');
    }

    const duration = data.durationHours || 1.0;
    const credits = data.creditAmount || duration;

    // Check requester wallet
    const wallet = queryOne<any>('SELECT available_credits FROM time_wallets WHERE user_id = ?', [requesterId]);
    if (!wallet || wallet.available_credits < credits) {
      throw new Error(`Insufficient time credits. You have ${wallet?.available_credits ?? 0} credits, but this booking requires ${credits} credits.`);
    }

    // Duplicate booking prevention: check if helper or requester already booked at this exact date & time
    const conflict = queryOne(
      `SELECT id FROM bookings
       WHERE (requester_id = ? OR helper_id = ?)
         AND service_date = ?
         AND service_time = ?
         AND status IN ('CONFIRMED', 'IN_PROGRESS')`,
      [data.helperId, data.helperId, data.serviceDate, data.serviceTime]
    );
    if (conflict) {
      throw new Error('The helper already has a confirmed booking for this date and time slot. Please choose another time.');
    }

    const bookingId = 'BK_' + Date.now();
    const bookingCode = 'BK-' + Math.floor(100000 + Math.random() * 900000);

    transaction(() => {
      execute(
        `INSERT INTO bookings (id, booking_code, requester_id, helper_id, skill_name, service_date, service_time, duration_hours, credit_amount, location_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
        [
          bookingId,
          bookingCode,
          requesterId,
          data.helperId,
          data.skillName,
          data.serviceDate,
          data.serviceTime,
          duration,
          credits,
          data.locationName
        ]
      );

      execute(
        `INSERT INTO booking_history (id, booking_id, action, actor_id, notes)
         VALUES (?, ?, 'CREATED', ?, 'Direct booking scheduled')`,
        ['BH_' + Date.now(), bookingId, requesterId]
      );

      // In-app notifications
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'New Booking Confirmed', ?, 'BOOKING', ?)`,
        [
          'NOTIF_' + Date.now(),
          data.helperId,
          `You have a confirmed service session for "${data.skillName}" on ${data.serviceDate} at ${data.serviceTime}.`,
          `/bookings/${bookingId}`
        ]
      );
    });

    const helper = queryOne<any>('SELECT u.email, p.full_name FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?', [data.helperId]);
    const requester = queryOne<any>('SELECT full_name FROM user_profiles WHERE user_id = ?', [requesterId]);

    if (helper) {
      emailService.sendBookingConfirmationEmail(
        helper.email,
        helper.full_name,
        {
          partnerName: requester?.full_name || 'Member',
          skill: data.skillName,
          date: data.serviceDate,
          time: data.serviceTime,
          location: data.locationName,
          bookingCode
        }
      ).catch(err => console.error(err));
    }

    return this.getBookingById(bookingId);
  }

  async getBookingById(bookingId: string) {
    const b = queryOne<any>(
      `SELECT b.*,
              ru.email as requester_email, rp.full_name as requester_name, rp.profile_photo_url as requester_photo, rp.phone_number as requester_phone,
              hu.email as helper_email, hp.full_name as helper_name, hp.profile_photo_url as helper_photo, hp.phone_number as helper_phone,
              rev.id as review_id, rev.rating as review_rating, rev.comment as review_comment
       FROM bookings b
       JOIN users ru ON b.requester_id = ru.id
       JOIN user_profiles rp ON ru.id = rp.user_id
       JOIN users hu ON b.helper_id = hu.id
       JOIN user_profiles hp ON hu.id = hp.user_id
       LEFT JOIN reviews rev ON b.id = rev.booking_id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!b) return null;

    const history = queryAll<any>(
      `SELECT bh.*, p.full_name as actor_name
       FROM booking_history bh
       JOIN users u ON bh.actor_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       WHERE bh.booking_id = ?
       ORDER BY bh.created_at ASC`,
      [bookingId]
    );

    return { ...b, history };
  }

  async getUserBookings(userId: string, roleFilter?: 'ALL' | 'AS_REQUESTER' | 'AS_HELPER') {
    let sql = `
      SELECT b.*,
              rp.full_name as requester_name, rp.profile_photo_url as requester_photo,
              hp.full_name as helper_name, hp.profile_photo_url as helper_photo
       FROM bookings b
       JOIN user_profiles rp ON b.requester_id = rp.user_id
       JOIN user_profiles hp ON b.helper_id = hp.user_id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (roleFilter === 'AS_REQUESTER') {
      sql += ' AND b.requester_id = ?';
      params.push(userId);
    } else if (roleFilter === 'AS_HELPER') {
      sql += ' AND b.helper_id = ?';
      params.push(userId);
    } else {
      sql += ' AND (b.requester_id = ? OR b.helper_id = ?)';
      params.push(userId, userId);
    }

    sql += ' ORDER BY b.service_date DESC, b.service_time DESC';
    return queryAll<any>(sql, params);
  }

  // Mutual confirmation of completion
  async confirmCompletion(bookingId: string, actorId: string) {
    const booking = queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');

    const isRequester = booking.requester_id === actorId;
    const isHelper = booking.helper_id === actorId;

    if (!isRequester && !isHelper) {
      throw new Error('Unauthorized: You are not a participant in this booking.');
    }

    if (booking.status === 'COMPLETED') {
      return { success: true, message: 'This booking has already been completed and credits transferred.' };
    }

    let reqConfirmed = booking.requester_confirmed_completion;
    let helpConfirmed = booking.helper_confirmed_completion;

    if (isRequester) reqConfirmed = 1;
    if (isHelper) helpConfirmed = 1;

    let newlyCompleted = false;

    transaction(() => {
      execute(
        `UPDATE bookings
         SET requester_confirmed_completion = ?,
             helper_confirmed_completion = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [reqConfirmed, helpConfirmed, bookingId]
      );

      execute(
        `INSERT INTO booking_history (id, booking_id, action, actor_id, notes)
         VALUES (?, ?, 'CONFIRM_COMPLETION', ?, ?)`,
        [
          'BH_' + Date.now(),
          bookingId,
          actorId,
          `${isRequester ? 'Requester' : 'Helper'} confirmed session completion`
        ]
      );

      // BOTH PARTIES CONFIRMED -> Execute time credit transfer!
      if (reqConfirmed === 1 && helpConfirmed === 1) {
        newlyCompleted = true;
        execute(`UPDATE bookings SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [bookingId]);

        // Transfer credits from requester to helper
        walletService.transferCredits(
          booking.requester_id,
          booking.helper_id,
          booking.credit_amount,
          booking.id,
          `Time exchange completion for ${booking.skill_name} (#${booking.booking_code})`
        );

        // Increment completed services count
        execute(
          `UPDATE user_profiles SET completed_services_count = completed_services_count + 1 WHERE user_id IN (?, ?)`,
          [booking.requester_id, booking.helper_id]
        );

        // Notifications
        execute(
          `INSERT INTO notifications (id, user_id, title, content, type, link_url)
           VALUES (?, ?, 'Service Completed & Credits Transferred', ?, 'CREDIT', ?)`,
          [
            'NOTIF_' + Date.now() + '_H',
            booking.helper_id,
            `Session #${booking.booking_code} completed! ${booking.credit_amount} time credit(s) have been credited to your wallet.`,
            `/wallet`
          ]
        );

        execute(
          `INSERT INTO notifications (id, user_id, title, content, type, link_url)
           VALUES (?, ?, 'Service Completed', ?, 'BOOKING', ?)`,
          [
            'NOTIF_' + Date.now() + '_R',
            booking.requester_id,
            `Session #${booking.booking_code} completed. Please leave a review for your helper!`,
            `/bookings/${bookingId}`
          ]
        );
      }
    });

    if (newlyCompleted) {
      // Send completion emails
      const helper = queryOne<any>('SELECT u.email, p.full_name FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?', [booking.helper_id]);
      const helperWallet = queryOne<any>('SELECT available_credits FROM time_wallets WHERE user_id = ?', [booking.helper_id]);

      if (helper && helperWallet) {
        emailService.sendServiceCompletionEmail(
          helper.email,
          helper.full_name,
          booking.credit_amount,
          helperWallet.available_credits
        ).catch(err => console.error(err));
      }
    }

    return {
      success: true,
      requesterConfirmed: Boolean(reqConfirmed),
      helperConfirmed: Boolean(helpConfirmed),
      completed: newlyCompleted,
      message: newlyCompleted
        ? 'Both members have confirmed! Time credits have been transferred.'
        : 'Your completion confirmation was recorded. Waiting for your exchange partner to confirm.'
    };
  }

  async rescheduleBooking(bookingId: string, actorId: string, newDate: string, newTime: string, reason?: string) {
    const booking = queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');
    if (booking.requester_id !== actorId && booking.helper_id !== actorId) {
      throw new Error('Unauthorized.');
    }

    const partnerId = booking.requester_id === actorId ? booking.helper_id : booking.requester_id;

    transaction(() => {
      execute(
        `UPDATE bookings
         SET status = 'RESCHEDULE_REQUESTED',
             reschedule_proposed_date = ?,
             reschedule_proposed_time = ?,
             reschedule_reason = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [newDate, newTime, reason || null, bookingId]
      );

      execute(
        `INSERT INTO booking_history (id, booking_id, action, actor_id, notes)
         VALUES (?, ?, 'RESCHEDULE_PROPOSED', ?, ?)`,
        ['BH_' + Date.now(), bookingId, actorId, `Reschedule proposed to ${newDate} at ${newTime}. Reason: ${reason || 'None'}`]
      );

      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'Booking Reschedule Requested', ?, 'BOOKING', ?)`,
        [
          'NOTIF_' + Date.now(),
          partnerId,
          `A reschedule to ${newDate} at ${newTime} was requested for booking #${booking.booking_code}.`,
          `/bookings/${bookingId}`
        ]
      );
    });

    return { success: true, message: 'Reschedule request submitted.' };
  }

  async acceptReschedule(bookingId: string, actorId: string) {
    const booking = queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');
    if (!booking.reschedule_proposed_date) throw new Error('No pending reschedule request.');

    transaction(() => {
      execute(
        `UPDATE bookings
         SET service_date = reschedule_proposed_date,
             service_time = reschedule_proposed_time,
             status = 'CONFIRMED',
             reschedule_proposed_date = NULL,
             reschedule_proposed_time = NULL,
             reschedule_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [bookingId]
      );

      execute(
        `INSERT INTO booking_history (id, booking_id, action, actor_id, notes)
         VALUES (?, ?, 'RESCHEDULE_ACCEPTED', ?, 'Reschedule confirmed')`,
        ['BH_' + Date.now(), bookingId, actorId]
      );
    });

    return { success: true, message: 'Reschedule accepted and booking updated.' };
  }

  async cancelBooking(bookingId: string, actorId: string, reason: string) {
    const booking = queryOne<any>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) throw new Error('Booking not found.');
    if (booking.status === 'COMPLETED') throw new Error('Cannot cancel a completed booking.');

    const partnerId = booking.requester_id === actorId ? booking.helper_id : booking.requester_id;

    transaction(() => {
      execute(
        `UPDATE bookings
         SET status = 'CANCELLED',
             cancellation_reason = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [reason || 'Cancelled by participant', bookingId]
      );

      execute(
        `INSERT INTO booking_history (id, booking_id, action, actor_id, notes)
         VALUES (?, ?, 'CANCELLED', ?, ?)`,
        ['BH_' + Date.now(), bookingId, actorId, `Booking cancelled: ${reason}`]
      );

      execute(
        `INSERT INTO notifications (id, user_id, title, content, type)
         VALUES (?, ?, 'Booking Cancelled', ?, 'BOOKING')`,
        ['NOTIF_' + Date.now(), partnerId, `Booking #${booking.booking_code} was cancelled: ${reason}`]
      );
    });

    return { success: true, message: 'Booking has been cancelled.' };
  }
}

export const bookingService = new BookingService();
