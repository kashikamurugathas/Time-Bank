import { locationDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { usersDb } from '../users/db.ts';
import { skillsDb } from '../skills/db.ts';

const logger = createLogger('location-recommendation-service');

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class LocationRecommendationService {
  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    eventBus.subscribe('user.registered', (data: any) => {
      try {
        if (data.currentLocation) {
          this.updateUserLocation(
            data.userId,
            data.currentLocation.lat,
            data.currentLocation.lng,
            data.currentLocation.address,
            data.city,
            data.district
          );
        } else if (data.city || data.district) {
          // Default to Jaffna or Colombo coordinates if city provided
          const isColombo = data.city?.toLowerCase().includes('colombo') || data.district?.toLowerCase().includes('colombo');
          const lat = isColombo ? 6.9271 : 9.6615;
          const lng = isColombo ? 79.8612 : 80.0255;
          this.updateUserLocation(data.userId, lat, lng, `${data.city || 'Jaffna'}, ${data.district || 'Sri Lanka'}`, data.city, data.district);
        }
      } catch (err: any) {
        logger.error(`Error saving user location on user.registered: ${err.message}`);
      }
    });
  }

  updateUserLocation(userId: string, lat: number, lng: number, address?: string, city?: string, district?: string) {
    locationDb.execute(
      `INSERT OR REPLACE INTO user_locations (user_id, latitude, longitude, formatted_address, city, district, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, lat, lng, address || null, city || null, district || null]
    );
    logger.info(`Location updated for user ${userId} (${lat}, ${lng})`);
  }

  async getNearbyHelpers(params: {
    latitude: number;
    longitude: number;
    maxRadiusKm?: number;
    skillId?: string;
    category?: string;
    searchKeyword?: string;
    excludeUserId?: string;
  }) {
    const maxRadius = params.maxRadiusKm || 50;

    // Get all approved users with locations from location.db
    const locations = locationDb.queryAll<any>(
      `SELECT * FROM user_locations WHERE is_current_location = 1`
    );

    const candidates: any[] = [];

    for (const loc of locations) {
      if (params.excludeUserId && loc.user_id === params.excludeUserId) continue;

      const distKm = calculateDistanceKm(params.latitude, params.longitude, loc.latitude, loc.longitude);
      if (distKm > maxRadius) continue;

      // Check User Service DB for account status & profile
      const account = usersDb.queryOne<any>('SELECT status, account_type FROM user_accounts WHERE id = ?', [loc.user_id]);
      if (!account || account.status !== 'APPROVED') continue;

      const profile = usersDb.queryOne<any>('SELECT * FROM user_profiles WHERE user_id = ?', [loc.user_id]);
      if (!profile) continue;

      // Check skills from Skill Service DB
      let skills = skillsDb.queryAll<any>(
        `SELECT us.*, s.name as skill_name, s.category
         FROM user_skills us
         JOIN skills_catalog s ON us.skill_id = s.id
         WHERE us.user_id = ? AND us.availability_status = 'AVAILABLE'`,
        [loc.user_id]
      );

      if (params.skillId) {
        skills = skills.filter(s => s.skill_id === params.skillId);
      }
      if (params.category && params.category !== 'ALL') {
        skills = skills.filter(s => s.category.toLowerCase() === params.category!.toLowerCase());
      }
      if (params.searchKeyword && params.searchKeyword.trim()) {
        const kw = params.searchKeyword.toLowerCase().trim();
        const matchesSkill = skills.some(s => s.skill_name.toLowerCase().includes(kw) || (s.description && s.description.toLowerCase().includes(kw)));
        const matchesProfile = profile.full_name.toLowerCase().includes(kw) || (profile.bio && profile.bio.toLowerCase().includes(kw));
        if (!matchesSkill && !matchesProfile) continue;
      }

      if (skills.length === 0) continue;

      candidates.push({
        userId: loc.user_id,
        fullName: profile.full_name,
        profilePhotoUrl: profile.profile_photo_url,
        ratingAvg: profile.rating_avg || 5.0,
        ratingCount: profile.rating_count || 0,
        completedServicesCount: profile.completed_services_count || 0,
        membershipTier: profile.membership_tier,
        distanceKm: distKm,
        approximateLocation: `${loc.city || profile.city || 'Nearby'}, ${loc.district || profile.district || 'Sri Lanka'} (~${distKm} km away)`,
        skills: skills.map(s => ({
          skillId: s.skill_id,
          name: s.skill_name,
          category: s.category,
          level: s.experience_level,
          hourlyRateCredits: s.hourly_rate_credits,
          isVerified: Boolean(s.is_verified)
        })),
      });
    }

    // Sort by proximity, then rating
    candidates.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return b.ratingAvg - a.ratingAvg;
    });

    return candidates;
  }
}

export const locationRecommendationService = new LocationRecommendationService();
