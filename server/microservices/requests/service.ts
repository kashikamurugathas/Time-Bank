import { requestsDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { usersDb } from '../users/db.ts';

const logger = createLogger('help-request-service');

export class HelpRequestService {
  async listRequests(filters?: { status?: string; category?: string; requesterId?: string; search?: string }) {
    let sql = `SELECT * FROM help_requests WHERE 1=1`;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'ALL') {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters?.category && filters.category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.requesterId) {
      sql += ' AND requester_id = ?';
      params.push(filters.requesterId);
    }
    if (filters?.search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR skill_name LIKE ? OR location_name LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY created_at DESC';
    const rows = requestsDb.queryAll<any>(sql, params);

    return rows.map(r => {
      const profile = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, rating_avg FROM user_profiles WHERE user_id = ?', [r.requester_id]);
      const responsesCount = requestsDb.queryOne<any>('SELECT COUNT(*) as count FROM help_responses WHERE request_id = ?', [r.id])?.count || 0;
      return {
        ...r,
        requesterName: profile?.full_name || 'Member',
        requesterPhoto: profile?.profile_photo_url || null,
        requesterRating: profile?.rating_avg || 5.0,
        responsesCount,
      };
    });
  }

  async getRequestById(id: string) {
    const req = requestsDb.queryOne<any>('SELECT * FROM help_requests WHERE id = ?', [id]);
    if (!req) return null;

    const profile = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, rating_avg, rating_count, city, district FROM user_profiles WHERE user_id = ?', [req.requester_id]);
    const responses = requestsDb.queryAll<any>('SELECT * FROM help_responses WHERE request_id = ? ORDER BY created_at DESC', [id]);

    const enrichedResponses = responses.map(rs => {
      const helperProf = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, rating_avg, city, district FROM user_profiles WHERE user_id = ?', [rs.helper_id]);
      return {
        ...rs,
        helperName: helperProf?.full_name || 'Helper',
        helperPhoto: helperProf?.profile_photo_url || null,
        helperRating: helperProf?.rating_avg || 5.0,
        helperLocation: `${helperProf?.city || ''}, ${helperProf?.district || ''}`,
      };
    });

    return {
      ...req,
      requesterName: profile?.full_name || 'Member',
      requesterPhoto: profile?.profile_photo_url || null,
      requesterRating: profile?.rating_avg || 5.0,
      responses: enrichedResponses,
    };
  }

  async createRequest(requesterId: string, data: {
    title: string;
    category: string;
    skillId?: string;
    skillName: string;
    description: string;
    preferredDate: string;
    preferredTime: string;
    durationHours: number;
    creditsOffered: number;
    locationName: string;
    latitude?: number;
    longitude?: number;
    additionalNotes?: string;
  }) {
    if (!data.title || !data.skillName || !data.preferredDate) {
      throw new Error('Title, skill, and preferred date are mandatory.');
    }

    const id = `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    requestsDb.execute(
      `INSERT INTO help_requests (id, requester_id, title, category, skill_id, skill_name, description, preferred_date, preferred_time, duration_hours, credits_offered, location_name, latitude, longitude, additional_notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
      [
        id,
        requesterId,
        data.title,
        data.category || 'General',
        data.skillId || null,
        data.skillName,
        data.description,
        data.preferredDate,
        data.preferredTime,
        data.durationHours || 1.0,
        data.creditsOffered || 1.0,
        data.locationName,
        data.latitude || null,
        data.longitude || null,
        data.additionalNotes || null,
      ]
    );

    eventBus.publish('request.created', {
      requestId: id,
      requesterId,
      title: data.title,
      skillName: data.skillName,
      category: data.category,
      creditsOffered: data.creditsOffered || 1.0,
    });

    return this.getRequestById(id);
  }

  async submitOffer(requestId: string, helperId: string, data: { proposedDate?: string; proposedTime?: string; message: string }) {
    const req = requestsDb.queryOne<any>('SELECT * FROM help_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('Help request not found.');
    if (req.requester_id === helperId) throw new Error('You cannot offer help on your own request.');
    if (req.status !== 'OPEN' && req.status !== 'PENDING_RESPONSE') throw new Error('This help request is no longer accepting offers.');

    const offerId = `OFFER_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    requestsDb.execute(
      `INSERT INTO help_responses (id, request_id, helper_id, proposed_date, proposed_time, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [offerId, requestId, helperId, data.proposedDate || req.preferred_date, data.proposedTime || req.preferred_time, data.message]
    );

    requestsDb.execute("UPDATE help_requests SET status = 'PENDING_RESPONSE', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [requestId]);

    eventBus.publish('request.offer_submitted', {
      requestId,
      offerId,
      requesterId: req.requester_id,
      helperId,
      requestTitle: req.title,
    });

    return { offerId, message: 'Your offer has been submitted to the requester.' };
  }

  async acceptOffer(requestId: string, offerId: string, requesterId: string) {
    const req = requestsDb.queryOne<any>('SELECT * FROM help_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('Help request not found.');
    if (req.requester_id !== requesterId) throw new Error('Only the requester can accept an offer.');

    const offer = requestsDb.queryOne<any>('SELECT * FROM help_responses WHERE id = ? AND request_id = ?', [offerId, requestId]);
    if (!offer) throw new Error('Offer not found.');

    requestsDb.execute("UPDATE help_requests SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [requestId]);
    requestsDb.execute("UPDATE help_responses SET status = 'ACCEPTED' WHERE id = ?", [offerId]);
    requestsDb.execute("UPDATE help_responses SET status = 'REJECTED' WHERE request_id = ? AND id != ?", [requestId, offerId]);

    // Publish event so Booking Service automatically creates the confirmed booking
    eventBus.publish('request.offer_accepted', {
      requestId,
      offerId,
      requesterId,
      helperId: offer.helper_id,
      skillName: req.skill_name,
      serviceDate: offer.proposed_date || req.preferred_date,
      serviceTime: offer.proposed_time || req.preferred_time,
      durationHours: req.duration_hours,
      creditAmount: req.credits_offered,
      locationName: req.location_name,
    });

    return { success: true, message: 'Offer accepted! A confirmed booking has been created.' };
  }

  async cancelRequest(requestId: string, requesterId: string) {
    const req = requestsDb.queryOne<any>('SELECT * FROM help_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('Help request not found.');
    if (req.requester_id !== requesterId) throw new Error('Only the creator can cancel this request.');

    requestsDb.execute("UPDATE help_requests SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [requestId]);
    return { success: true, message: 'Request cancelled.' };
  }
}

export const helpRequestService = new HelpRequestService();
