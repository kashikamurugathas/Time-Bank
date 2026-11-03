import { queryAll, queryOne } from '../db/index.ts';

export class AnalyticsReportingService {
  async getCommunityImpactSummary() {
    const membersCount = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE status = 'APPROVED'`)?.count || 0;
    const completedServices = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM bookings WHERE status = 'COMPLETED'`)?.count || 0;
    const totalHours = queryOne<{ sum: number }>(`SELECT SUM(duration_hours) as sum FROM bookings WHERE status = 'COMPLETED'`)?.sum || 0;
    const totalCreditsCirculated = queryOne<{ sum: number }>(`SELECT SUM(amount_credits) as sum FROM time_transactions WHERE transaction_type = 'TRANSFER'`)?.sum || 0;

    const skillsBreakdown = queryAll<any>(`
      SELECT s.category, COUNT(us.id) as count
      FROM skills s
      JOIN user_skills us ON s.id = us.skill_id
      GROUP BY s.category
      ORDER BY count DESC
      LIMIT 8
    `);

    const districtsDistribution = queryAll<any>(`
      SELECT l.district, COUNT(u.id) as count
      FROM users u
      JOIN user_locations l ON u.id = l.user_id
      WHERE u.status = 'APPROVED'
      GROUP BY l.district
      ORDER BY count DESC
      LIMIT 8
    `);

    return {
      totalApprovedMembers: membersCount,
      completedExchanges: completedServices,
      totalHoursExchanged: totalHours,
      totalCreditsCirculated: totalCreditsCirculated,
      skillsBreakdown,
      districtsDistribution
    };
  }

  async getAdminPlatformReport() {
    const totalUsers = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users`)?.count || 0;
    const pendingUsers = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE status = 'PENDING'`)?.count || 0;
    const approvedUsers = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE status = 'APPROVED'`)?.count || 0;
    const rejectedUsers = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE status = 'REJECTED'`)?.count || 0;
    const suspendedUsers = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE status = 'SUSPENDED'`)?.count || 0;

    const totalRevenue = queryOne<{ sum: number }>(`SELECT SUM(amount_lkr) as sum FROM payments WHERE status = 'SUCCESS'`)?.sum || 0;
    const activeSubscriptions = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'ACTIVE'`)?.count || 0;
    const openDisputes = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM disputes WHERE status = 'OPEN'`)?.count || 0;
    const totalHelpRequests = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM help_requests`)?.count || 0;
    const totalBookings = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM bookings`)?.count || 0;

    const recentActivity = queryAll<any>(`
      SELECT 'BOOKING' as type, b.skill_name as detail, b.created_at, p.full_name as user_name
      FROM bookings b
      JOIN user_profiles p ON b.requester_id = p.user_id
      UNION ALL
      SELECT 'REGISTRATION' as type, u.account_type as detail, u.created_at, p.full_name as user_name
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return {
      users: {
        total: totalUsers,
        pending: pendingUsers,
        approved: approvedUsers,
        rejected: rejectedUsers,
        suspended: suspendedUsers
      },
      financials: {
        totalRevenueLkr: totalRevenue,
        activeSubscriptions
      },
      operations: {
        totalHelpRequests,
        totalBookings,
        openDisputes
      },
      recentActivity
    };
  }

  async getCommunityDetails(communityId: string) {
    const comm = queryOne<any>(`
      SELECT c.*, p.full_name as leader_name, p.profile_photo_url as leader_photo
      FROM communities c
      JOIN users u ON c.leader_id = u.id
      JOIN user_profiles p ON u.id = p.user_id
      WHERE c.id = ?
    `, [communityId]);

    if (!comm) return null;

    const members = queryAll<any>(`
      SELECT cm.role, cm.joined_at, u.id as user_id, u.email, p.full_name, p.city, p.profile_photo_url, p.rating_avg
      FROM community_members cm
      JOIN users u ON cm.user_id = u.id
      JOIN user_profiles p ON u.id = p.user_id
      WHERE cm.community_id = ?
    `, [communityId]);

    return { ...comm, members };
  }

  async getOrganizationDetails(orgId: string) {
    const org = queryOne<any>(`
      SELECT o.*, p.full_name as owner_name, p.profile_photo_url as owner_photo
      FROM organizations o
      JOIN users u ON o.owner_id = u.id
      JOIN user_profiles p ON u.id = p.user_id
      WHERE o.id = ?
    `, [orgId]);

    if (!org) return null;

    const members = queryAll<any>(`
      SELECT om.role, om.hours_contributed, om.joined_at, u.id as user_id, u.email, p.full_name, p.profile_photo_url
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      JOIN user_profiles p ON u.id = p.user_id
      WHERE om.organization_id = ?
    `, [orgId]);

    return { ...org, members };
  }
}

export const analyticsService = new AnalyticsReportingService();
