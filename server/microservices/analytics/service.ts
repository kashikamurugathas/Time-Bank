import { analyticsDb } from './db.ts';
import { usersDb } from '../users/db.ts';
import { walletDb } from '../wallet/db.ts';
import { bookingsDb } from '../bookings/db.ts';
import { skillsDb } from '../skills/db.ts';
import { createLogger } from '../common/logger.ts';

const logger = createLogger('analytics-reporting-service');

export class AnalyticsService {
  async getCommunityImpactSummary() {
    const totalUsers = usersDb.queryOne<any>('SELECT COUNT(*) as count FROM user_accounts WHERE status = ?', ['APPROVED'])?.count || 0;
    const totalSkills = skillsDb.queryOne<any>('SELECT COUNT(*) as count FROM user_skills')?.count || 0;
    const completedBookings = bookingsDb.queryOne<any>('SELECT COUNT(*) as count FROM bookings WHERE status = ?', ['COMPLETED'])?.count || 0;
    const totalHours = walletDb.queryOne<any>('SELECT SUM(amount_credits) as sum FROM time_transactions WHERE transaction_type IN (?, ?)', ['TRANSFER', 'EARNED'])?.sum || 0;
    const totalCommunities = analyticsDb.queryOne<any>('SELECT COUNT(*) as count FROM communities')?.count || 0;
    const totalOrgs = analyticsDb.queryOne<any>('SELECT COUNT(*) as count FROM organizations')?.count || 0;

    return {
      totalActiveMembers: totalUsers,
      totalSkillsShared: totalSkills,
      completedExchangeSessions: completedBookings,
      totalHoursExchanged: Math.round(totalHours * 10) / 10,
      activeCommunitiesCount: totalCommunities,
      partnerOrganizationsCount: totalOrgs,
      sdgImpact: {
        reducedInequalities: 'Equitable time-for-time exchange rate without monetary discrimination',
        sustainableCommunities: 'Stronger local neighborhood resilience and mutual aid networks',
        qualityEducation: 'Peer-to-peer tutoring, vocational learning, and verified skill sharing',
        decentWork: 'Dignified voluntary contribution recognized through verifiable time credits',
      },
    };
  }

  async getAdminPlatformReport() {
    const impact = await this.getCommunityImpactSummary();
    const pendingUsers = usersDb.queryOne<any>('SELECT COUNT(*) as count FROM user_accounts WHERE status = ?', ['PENDING'])?.count || 0;
    const suspendedUsers = usersDb.queryOne<any>('SELECT COUNT(*) as count FROM user_accounts WHERE status = ?', ['SUSPENDED'])?.count || 0;
    const totalBookings = bookingsDb.queryOne<any>('SELECT COUNT(*) as count FROM bookings')?.count || 0;
    const activeRequests = bookingsDb.queryOne<any>('SELECT COUNT(*) as count FROM bookings WHERE status = ?', ['CONFIRMED'])?.count || 0;

    return {
      summary: impact,
      adminKpis: {
        pendingApprovals: pendingUsers,
        suspendedMembers: suspendedUsers,
        totalBookingsLogged: totalBookings,
        activeScheduledSessions: activeRequests,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getCommunityDetails(id: string) {
    const comm = analyticsDb.queryOne<any>('SELECT * FROM communities WHERE id = ?', [id]);
    if (!comm) return null;

    const leader = usersDb.queryOne<any>('SELECT full_name, profile_photo_url FROM user_profiles WHERE user_id = ?', [comm.leader_id]);
    const members = analyticsDb.queryAll<any>('SELECT * FROM community_members WHERE community_id = ?', [id]);

    return {
      ...comm,
      leader: {
        id: comm.leader_id,
        fullName: leader?.full_name || 'Leader',
        profilePhotoUrl: leader?.profile_photo_url || null,
      },
      memberCount: members.length,
    };
  }

  async getOrganizationDetails(id: string) {
    const org = analyticsDb.queryOne<any>('SELECT * FROM organizations WHERE id = ?', [id]);
    if (!org) return null;

    const owner = usersDb.queryOne<any>('SELECT full_name, profile_photo_url FROM user_profiles WHERE user_id = ?', [org.owner_id]);
    const members = analyticsDb.queryAll<any>('SELECT * FROM organization_members WHERE organization_id = ?', [id]);

    return {
      ...org,
      owner: {
        id: org.owner_id,
        fullName: owner?.full_name || 'Coordinator',
        profilePhotoUrl: owner?.profile_photo_url || null,
      },
      memberCount: members.length,
    };
  }
}

export const analyticsService = new AnalyticsService();
