import { queryAll } from '../db/index.ts';

// Haversine formula calculation in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((R * c).toFixed(1));
}

export interface RecommendationParams {
  latitude: number;
  longitude: number;
  skillId?: string;
  category?: string;
  searchKeyword?: string;
  maxRadiusKm?: number;
  excludeUserId?: string;
}

export class LocationRecommendationService {
  async getNearbyHelpers(params: RecommendationParams) {
    const {
      latitude,
      longitude,
      skillId,
      category,
      searchKeyword,
      maxRadiusKm = 50,
      excludeUserId
    } = params;

    // Fetch all approved and available members who have locations and skills
    let sql = `
      SELECT u.id as user_id, u.email, u.account_type,
             p.full_name, p.bio, p.country, p.district, p.city, p.profile_photo_url,
             p.membership_tier, p.rating_avg, p.rating_count, p.completed_services_count,
             p.address_privacy,
             l.latitude as helper_lat, l.longitude as helper_lng,
             us.id as user_skill_id, us.experience_level, us.description as skill_description,
             us.hourly_rate_credits, us.availability_status,
             s.id as skill_id, s.name as skill_name, s.category as skill_category
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      JOIN user_locations l ON u.id = l.user_id
      JOIN user_skills us ON u.id = us.user_id
      JOIN skills s ON us.skill_id = s.id
      WHERE u.status = 'APPROVED'
        AND us.availability_status = 'AVAILABLE'
    `;

    const queryParams: any[] = [];

    if (excludeUserId) {
      sql += ' AND u.id != ?';
      queryParams.push(excludeUserId);
    }

    if (skillId && skillId !== 'ALL') {
      sql += ' AND (s.id = ? OR s.name LIKE ?)';
      queryParams.push(skillId, `%${skillId}%`);
    }

    if (category && category !== 'ALL') {
      sql += ' AND s.category = ?';
      queryParams.push(category);
    }

    if (searchKeyword) {
      sql += ' AND (s.name LIKE ? OR us.description LIKE ? OR p.full_name LIKE ? OR p.city LIKE ?)';
      const term = `%${searchKeyword}%`;
      queryParams.push(term, term, term, term);
    }

    const rows = queryAll<any>(sql, queryParams);

    // Calculate distance using Haversine formula and aggregate by user
    const helpersMap = new Map<string, any>();

    for (const row of rows) {
      const distanceKm = calculateDistanceKm(
        latitude,
        longitude,
        row.helper_lat,
        row.helper_lng
      );

      // Filter by max radius if set (0 or > 1000 means unlimited)
      if (maxRadiusKm > 0 && distanceKm > maxRadiusKm) {
        continue;
      }

      if (!helpersMap.has(row.user_id)) {
        helpersMap.set(row.user_id, {
          userId: row.user_id,
          fullName: row.full_name,
          accountType: row.account_type,
          bio: row.bio,
          country: row.country,
          district: row.district,
          city: row.city,
          profilePhotoUrl: row.profile_photo_url,
          membershipTier: row.membership_tier,
          ratingAvg: row.rating_avg,
          ratingCount: row.rating_count,
          completedServicesCount: row.completed_services_count,
          distanceKm: distanceKm,
          // Privacy protection: NEVER expose exact helper coordinates to requester
          approximateDistanceDisplay: distanceKm < 1 ? 'Under 1 km away' : `${distanceKm} km away`,
          skills: []
        });
      }

      const helper = helpersMap.get(row.user_id);
      helper.skills.push({
        userSkillId: row.user_skill_id,
        skillId: row.skill_id,
        skillName: row.skill_name,
        category: row.skill_category,
        experienceLevel: row.experience_level,
        description: row.skill_description,
        hourlyRateCredits: row.hourly_rate_credits
      });
    }

    // Sort matching members by distance (nearest first)
    const sortedHelpers = Array.from(helpersMap.values()).sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      totalFound: sortedHelpers.length,
      currentRadiusKm: maxRadiusKm,
      helpers: sortedHelpers,
      suggestion: sortedHelpers.length === 0
        ? `No helpers found within ${maxRadiusKm} km. Try expanding your search radius to 50 km or 100 km.`
        : null
    };
  }
}

export const locationRecommendationService = new LocationRecommendationService();
