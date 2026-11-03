import { execute, queryAll, queryOne, transaction } from '../db/index.ts';
import { emailService } from './email.service.ts';

export class HelpRequestService {
  async createRequest(requesterId: string, data: {
    title: string;
    category: string;
    skillId?: string;
    skillName: string;
    description: string;
    preferredDate: string;
    preferredTime: string;
    durationHours?: number;
    creditsOffered?: number;
    locationName: string;
    latitude?: number;
    longitude?: number;
    additionalNotes?: string;
  }) {
    // Check requester wallet
    const duration = data.durationHours || 1.0;
    const credits = data.creditsOffered || duration;

    const wallet = queryOne<any>('SELECT available_credits FROM time_wallets WHERE user_id = ?', [requesterId]);
    if (!wallet || wallet.available_credits < credits) {
      throw new Error(`You need at least ${credits} time credits to post this request. Current balance: ${wallet?.available_credits ?? 0}`);
    }

    const requestId = 'REQ_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    execute(
      `INSERT INTO help_requests (id, requester_id, title, category, skill_id, skill_name, description, preferred_date, preferred_time, duration_hours, credits_offered, location_name, latitude, longitude, additional_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
      [
        requestId,
        requesterId,
        data.title.trim(),
        data.category || 'General',
        data.skillId || null,
        data.skillName.trim(),
        data.description.trim(),
        data.preferredDate,
        data.preferredTime,
        duration,
        credits,
        data.locationName.trim(),
        data.latitude || null,
        data.longitude || null,
        data.additionalNotes || null
      ]
    );

    return this.getRequestById(requestId);
  }

  async getRequestById(requestId: string) {
    const req = queryOne<any>(
      `SELECT r.*,
              u.email as requester_email,
              p.full_name as requester_name, p.profile_photo_url as requester_photo,
              p.city as requester_city, p.district as requester_district, p.rating_avg as requester_rating
       FROM help_requests r
       JOIN users u ON r.requester_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       WHERE r.id = ?`,
      [requestId]
    );

    if (!req) return null;

    // Attach responses
    const responses = queryAll<any>(
      `SELECT resp.*,
              hu.email as helper_email,
              hp.full_name as helper_name, hp.profile_photo_url as helper_photo,
              hp.city as helper_city, hp.rating_avg as helper_rating
       FROM help_responses resp
       JOIN users hu ON resp.helper_id = hu.id
       JOIN user_profiles hp ON hu.id = hp.user_id
       WHERE resp.request_id = ?
       ORDER BY resp.created_at ASC`,
      [requestId]
    );

    return {
      ...req,
      responses
    };
  }

  async listRequests(filters?: { status?: string; category?: string; requesterId?: string; search?: string }) {
    let sql = `
      SELECT r.*,
              p.full_name as requester_name, p.profile_photo_url as requester_photo,
              p.city as requester_city, p.district as requester_district, p.rating_avg as requester_rating,
              (SELECT COUNT(*) FROM help_responses WHERE request_id = r.id) as response_count
       FROM help_requests r
       JOIN users u ON r.requester_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.requesterId) {
      sql += ' AND r.requester_id = ?';
      params.push(filters.requesterId);
    } else if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND r.status = ?';
      params.push(filters.status);
    }

    if (filters?.category && filters.category !== 'ALL') {
      sql += ' AND r.category = ?';
      params.push(filters.category);
    }

    if (filters?.search) {
      sql += ' AND (r.title LIKE ? OR r.skill_name LIKE ? OR r.description LIKE ? OR r.location_name LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY r.created_at DESC';
    return queryAll<any>(sql, params);
  }

  async submitOffer(requestId: string, helperId: string, data: { proposedDate?: string; proposedTime?: string; message: string }) {
    const req = queryOne<any>(
      `SELECT r.*, u.email as req_email, p.full_name as req_name FROM help_requests r JOIN users u ON r.requester_id = u.id JOIN user_profiles p ON u.id = p.user_id WHERE r.id = ?`,
      [requestId]
    );

    if (!req) throw new Error('Help request not found.');
    if (req.requester_id === helperId) {
      throw new Error('You cannot respond to your own help request.');
    }
    if (req.status !== 'OPEN' && req.status !== 'PENDING_RESPONSE') {
      throw new Error(`This help request is currently ${req.status.toLowerCase()} and cannot accept new offers.`);
    }

    const helper = queryOne<any>(
      `SELECT u.email, p.full_name, p.city FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?`,
      [helperId]
    );

    const offerId = 'RESP_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    transaction(() => {
      execute(
        `INSERT INTO help_responses (id, request_id, helper_id, proposed_date, proposed_time, message, status)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          offerId,
          requestId,
          helperId,
          data.proposedDate || req.preferred_date,
          data.proposedTime || req.preferred_time,
          data.message.trim()
        ]
      );

      execute(
        `UPDATE help_requests SET status = 'PENDING_RESPONSE', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [requestId]
      );

      // In-app notification for requester
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'New Help Offer Received', ?, 'HELP_REQUEST', ?)`,
        [
          'NOTIF_' + Date.now(),
          req.requester_id,
          `${helper?.full_name || 'A community member'} offered to help with "${req.title}".`,
          `/requests/${requestId}`
        ]
      );
    });

    // Send email to requester
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    emailService.sendNewHelpRequestEmail(
      req.req_email,
      req.req_name,
      {
        requesterName: helper?.full_name || 'Community Helper',
        service: req.skill_name,
        description: data.message,
        location: req.location_name,
        dateTime: `${data.proposedDate || req.preferred_date} at ${data.proposedTime || req.preferred_time}`,
        link: `${appUrl}/requests/${requestId}`
      }
    ).catch(err => console.error(err));

    return { success: true, offerId, message: 'Your offer has been submitted to the requester.' };
  }

  async acceptOffer(requestId: string, offerId: string, requesterId: string) {
    const req = queryOne<any>('SELECT * FROM help_requests WHERE id = ? AND requester_id = ?', [requestId, requesterId]);
    if (!req) throw new Error('Help request not found or unauthorized.');

    const offer = queryOne<any>(
      `SELECT resp.*, u.email as helper_email, p.full_name as helper_name
       FROM help_responses resp
       JOIN users u ON resp.helper_id = u.id
       JOIN user_profiles p ON u.id = p.user_id
       WHERE resp.id = ? AND resp.request_id = ?`,
      [offerId, requestId]
    );
    if (!offer) throw new Error('Offer not found.');

    const requester = queryOne<any>('SELECT full_name FROM user_profiles WHERE user_id = ?', [requesterId]);

    const bookingCode = 'BK-' + Math.floor(100000 + Math.random() * 900000);
    const bookingId = 'BK_' + Date.now();

    transaction(() => {
      // 1. Mark offer accepted and others rejected
      execute(`UPDATE help_responses SET status = 'ACCEPTED' WHERE id = ?`, [offerId]);
      execute(`UPDATE help_responses SET status = 'REJECTED' WHERE request_id = ? AND id != ?`, [requestId, offerId]);

      // 2. Mark request accepted
      execute(`UPDATE help_requests SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [requestId]);

      // 3. Automatically create Booking record
      execute(
        `INSERT INTO bookings (id, booking_code, request_id, requester_id, helper_id, skill_name, service_date, service_time, duration_hours, credit_amount, location_name, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
        [
          bookingId,
          bookingCode,
          requestId,
          requesterId,
          offer.helper_id,
          req.skill_name,
          offer.proposed_date || req.preferred_date,
          offer.proposed_time || req.preferred_time,
          req.duration_hours,
          req.credits_offered,
          req.location_name
        ]
      );

      // 4. Create booking history log
      execute(
        `INSERT INTO booking_history (id, booking_id, action, actor_id, notes)
         VALUES (?, ?, 'CREATED_FROM_REQUEST', ?, 'Booking auto-created upon request offer acceptance')`,
        ['BH_' + Date.now(), bookingId, requesterId]
      );

      // 5. Notify helper in-app
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'Offer Accepted! Booking Created', ?, 'BOOKING', ?)`,
        [
          'NOTIF_' + Date.now(),
          offer.helper_id,
          `Your offer for "${req.title}" was accepted! Booking #${bookingCode} is confirmed.`,
          `/bookings/${bookingId}`
        ]
      );
    });

    // Send email to helper
    emailService.sendBookingConfirmationEmail(
      offer.helper_email,
      offer.helper_name,
      {
        partnerName: requester?.full_name || 'Requester',
        skill: req.skill_name,
        date: offer.proposed_date || req.preferred_date,
        time: offer.proposed_time || req.preferred_time,
        location: req.location_name,
        bookingCode
      }
    ).catch(err => console.error(err));

    return {
      success: true,
      bookingId,
      bookingCode,
      message: 'Offer accepted and booking confirmed!'
    };
  }

  async cancelRequest(requestId: string, requesterId: string) {
    const req = queryOne<any>('SELECT * FROM help_requests WHERE id = ? AND requester_id = ?', [requestId, requesterId]);
    if (!req) throw new Error('Help request not found or unauthorized.');
    if (['COMPLETED', 'CANCELLED'].includes(req.status)) {
      throw new Error(`Request is already ${req.status.toLowerCase()}.`);
    }

    execute(`UPDATE help_requests SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [requestId]);
    return { success: true, message: 'Help request cancelled.' };
  }
}

export const helpRequestService = new HelpRequestService();
