import { skillsDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';

const logger = createLogger('skill-management-service');

export class SkillService {
  constructor() {
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    eventBus.subscribe('user.registered', (data: any) => {
      try {
        if (data.skills && Array.isArray(data.skills)) {
          data.skills.forEach((s: any) => {
            let skillId = s.skillId;
            if (!skillId) {
              const catalogMatch = skillsDb.queryOne<any>(
                'SELECT id FROM skills_catalog WHERE LOWER(name) = ?',
                [s.skillName.toLowerCase().trim()]
              );
              if (catalogMatch) {
                skillId = catalogMatch.id;
              } else {
                skillId = `SKL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                skillsDb.execute(
                  'INSERT INTO skills_catalog (id, name, category, description) VALUES (?, ?, ?, ?)',
                  [skillId, s.skillName.trim(), 'General Services', 'Registered by user']
                );
              }
            }

            const usId = `USK_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            skillsDb.execute(
              `INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, experience_level, description)
               VALUES (?, ?, ?, ?, ?)`,
              [usId, data.userId, skillId, s.level || 'INTERMEDIATE', s.description || '']
            );
          });
          logger.info(`Registered initial skills for user ${data.userId}`);
        }
      } catch (err: any) {
        logger.error(`Error processing skills for user.registered: ${err.message}`);
      }
    });
  }

  async getAllCatalogSkills(category?: string) {
    let sql = 'SELECT * FROM skills_catalog WHERE is_active = 1';
    const params: any[] = [];
    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY name ASC';
    return skillsDb.queryAll(sql, params);
  }

  async getCategories() {
    const rows = skillsDb.queryAll<{ category: string }>(
      'SELECT DISTINCT category FROM skills_catalog WHERE is_active = 1 ORDER BY category ASC'
    );
    return rows.map(r => r.category);
  }

  async createCatalogSkill(name: string, category: string, description?: string) {
    const existing = skillsDb.queryOne('SELECT id FROM skills_catalog WHERE LOWER(name) = ?', [name.toLowerCase().trim()]);
    if (existing) {
      throw new Error('A skill with this name already exists in the catalog.');
    }
    const id = `SKL_${Date.now()}`;
    skillsDb.execute(
      'INSERT INTO skills_catalog (id, name, category, description) VALUES (?, ?, ?, ?)',
      [id, name.trim(), category.trim(), description || null]
    );
    return { id, name: name.trim(), category: category.trim(), description };
  }

  async getUserSkills(userId: string) {
    return skillsDb.queryAll(
      `SELECT us.*, s.name as skill_name, s.category
       FROM user_skills us
       JOIN skills_catalog s ON us.skill_id = s.id
       WHERE us.user_id = ?
       ORDER BY us.created_at DESC`,
      [userId]
    );
  }

  async addUserSkill(userId: string, data: {
    skillId?: string;
    skillName?: string;
    category?: string;
    experienceLevel: string;
    description?: string;
    hourlyRateCredits?: number;
    availabilityStatus?: string;
    preferredLocations?: string;
    qualificationProofUrl?: string;
    workSamples?: string[];
  }) {
    let skillId = data.skillId;
    if (!skillId && data.skillName) {
      const existing = skillsDb.queryOne<any>('SELECT id FROM skills_catalog WHERE LOWER(name) = ?', [data.skillName.toLowerCase().trim()]);
      if (existing) {
        skillId = existing.id;
      } else {
        skillId = `SKL_${Date.now()}`;
        skillsDb.execute(
          'INSERT INTO skills_catalog (id, name, category, description) VALUES (?, ?, ?, ?)',
          [skillId, data.skillName.trim(), data.category || 'General Services', 'Added by member']
        );
      }
    }

    if (!skillId) {
      throw new Error('Skill identification is required.');
    }

    const id = `USK_${Date.now()}`;
    skillsDb.execute(
      `INSERT INTO user_skills (id, user_id, skill_id, experience_level, description, hourly_rate_credits, availability_status, preferred_locations, qualification_proof_url, work_samples)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        skillId,
        data.experienceLevel || 'INTERMEDIATE',
        data.description || null,
        data.hourlyRateCredits || 1.0,
        data.availabilityStatus || 'AVAILABLE',
        data.preferredLocations || null,
        data.qualificationProofUrl || null,
        data.workSamples ? JSON.stringify(data.workSamples) : null
      ]
    );

    eventBus.publish('skill.added', { userId, skillId });
    return this.getUserSkills(userId);
  }

  async updateUserSkill(userId: string, userSkillId: string, data: any) {
    skillsDb.execute(
      `UPDATE user_skills
       SET experience_level = COALESCE(?, experience_level),
           description = COALESCE(?, description),
           hourly_rate_credits = COALESCE(?, hourly_rate_credits),
           availability_status = COALESCE(?, availability_status),
           preferred_locations = COALESCE(?, preferred_locations),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [data.experienceLevel, data.description, data.hourlyRateCredits, data.availabilityStatus, data.preferredLocations, userSkillId, userId]
    );
    return this.getUserSkills(userId);
  }

  async deleteUserSkill(userId: string, userSkillId: string) {
    skillsDb.execute('DELETE FROM user_skills WHERE id = ? AND user_id = ?', [userSkillId, userId]);
    return { success: true, message: 'Skill removed from profile.' };
  }

  // Learning Journey
  async getLearningRecords(userId: string) {
    return skillsDb.queryAll(
      'SELECT * FROM learning_records WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  }

  async addLearningRecord(userId: string, data: any) {
    const id = `LRN_${Date.now()}`;
    skillsDb.execute(
      `INSERT INTO learning_records (id, user_id, skill_name, category, status, progress_percentage, description, learning_institution, completion_date, certificate_url, project_image_url, work_samples)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.skillName,
        data.category || 'General',
        data.status || 'CURRENTLY_LEARNING',
        data.progressPercentage || 0,
        data.description || null,
        data.learningInstitution || null,
        data.completionDate || null,
        data.certificateUrl || null,
        data.projectImageUrl || null,
        data.workSamples ? JSON.stringify(data.workSamples) : null
      ]
    );
    return this.getLearningRecords(userId);
  }

  async updateLearningRecord(userId: string, id: string, data: any) {
    skillsDb.execute(
      `UPDATE learning_records
       SET progress_percentage = COALESCE(?, progress_percentage),
           status = COALESCE(?, status),
           description = COALESCE(?, description),
           certificate_url = COALESCE(?, certificate_url),
           completion_date = COALESCE(?, completion_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [data.progressPercentage, data.status, data.description, data.certificateUrl, data.completionDate, id, userId]
    );
    return this.getLearningRecords(userId);
  }

  async deleteLearningRecord(userId: string, id: string) {
    skillsDb.execute('DELETE FROM learning_records WHERE id = ? AND user_id = ?', [id, userId]);
    return { success: true };
  }

  async verifyCertificate(adminId: string, learningRecordId: string, approve: boolean) {
    skillsDb.execute(
      `UPDATE learning_records
       SET is_verified_by_admin = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [approve ? 1 : 0, approve ? 'VERIFIED' : 'NEWLY_ACQUIRED', learningRecordId]
    );
    return { success: true, message: approve ? 'Certificate verified and badge awarded!' : 'Verification rejected.' };
  }
}

export const skillService = new SkillService();
