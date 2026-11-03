import { execute, queryAll, queryOne, transaction } from '../db/index.ts';

export class SkillManagementService {
  async getAllCatalogSkills(category?: string) {
    let sql = 'SELECT * FROM skills WHERE is_active = 1';
    const params: any[] = [];
    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY category ASC, name ASC';
    return queryAll<any>(sql, params);
  }

  async getCategories() {
    return queryAll<{ category: string; count: number }>(
      `SELECT category, COUNT(*) as count FROM skills WHERE is_active = 1 GROUP BY category ORDER BY count DESC`
    );
  }

  async createCatalogSkill(name: string, category: string, description?: string) {
    const existing = queryOne('SELECT id FROM skills WHERE name = ? COLLATE NOCASE', [name.trim()]);
    if (existing) throw new Error('A skill with this name already exists in the catalog.');

    const skillId = 'SKILL_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    execute(
      `INSERT INTO skills (id, name, category, description) VALUES (?, ?, ?, ?)`,
      [skillId, name.trim(), category.trim(), description || null]
    );
    return queryOne('SELECT * FROM skills WHERE id = ?', [skillId]);
  }

  async addUserSkill(userId: string, data: {
    skillId?: string;
    skillName?: string;
    category?: string;
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    description?: string;
    hourlyRateCredits?: number;
    availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
    preferredLocations?: string;
    workSamples?: string;
    qualificationProofUrl?: string;
  }) {
    let finalSkillId = data.skillId;

    if (!finalSkillId && data.skillName) {
      const match = queryOne<any>('SELECT id FROM skills WHERE name = ? COLLATE NOCASE', [data.skillName.trim()]);
      if (match) {
        finalSkillId = match.id;
      } else {
        finalSkillId = 'SKILL_' + Date.now();
        execute(
          `INSERT INTO skills (id, name, category, description) VALUES (?, ?, ?, ?)`,
          [finalSkillId, data.skillName.trim(), data.category || 'General Skills', data.description || '']
        );
      }
    }

    if (!finalSkillId) {
      throw new Error('Skill selection or name is required.');
    }

    const existingUserSkill = queryOne(
      'SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ?',
      [userId, finalSkillId]
    );
    if (existingUserSkill) {
      throw new Error('You have already added this skill to your profile. Please edit it instead.');
    }

    const id = 'USK_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    execute(
      `INSERT INTO user_skills (id, user_id, skill_id, experience_level, description, hourly_rate_credits, availability_status, preferred_locations, work_samples, qualification_proof_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        finalSkillId,
        data.experienceLevel || 'INTERMEDIATE',
        data.description || null,
        data.hourlyRateCredits || 1.0,
        data.availabilityStatus || 'AVAILABLE',
        data.preferredLocations || null,
        data.workSamples || null,
        data.qualificationProofUrl || null
      ]
    );

    return queryOne(
      `SELECT us.*, s.name as skill_name, s.category FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.id = ?`,
      [id]
    );
  }

  async updateUserSkill(userId: string, userSkillId: string, data: {
    experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    description?: string;
    hourlyRateCredits?: number;
    availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
    preferredLocations?: string;
    workSamples?: string;
  }) {
    const existing = queryOne('SELECT id FROM user_skills WHERE id = ? AND user_id = ?', [userSkillId, userId]);
    if (!existing) throw new Error('Skill record not found or unauthorized.');

    execute(
      `UPDATE user_skills
       SET experience_level = COALESCE(?, experience_level),
           description = COALESCE(?, description),
           hourly_rate_credits = COALESCE(?, hourly_rate_credits),
           availability_status = COALESCE(?, availability_status),
           preferred_locations = COALESCE(?, preferred_locations),
           work_samples = COALESCE(?, work_samples),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        data.experienceLevel || null,
        data.description || null,
        data.hourlyRateCredits || null,
        data.availabilityStatus || null,
        data.preferredLocations || null,
        data.workSamples || null,
        userSkillId,
        userId
      ]
    );

    return queryOne(
      `SELECT us.*, s.name as skill_name, s.category FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.id = ?`,
      [userSkillId]
    );
  }

  async deleteUserSkill(userId: string, userSkillId: string) {
    execute('DELETE FROM user_skills WHERE id = ? AND user_id = ?', [userSkillId, userId]);
    return { success: true };
  }

  // --- MY LEARNING JOURNEY ---
  async addLearningRecord(userId: string, data: {
    skillName: string;
    category: string;
    status: 'CURRENTLY_LEARNING' | 'NEWLY_ACQUIRED' | 'VERIFIED';
    progressPercentage?: number;
    description?: string;
    learningInstitution?: string;
    completionDate?: string;
    certificateUrl?: string;
    projectImageUrl?: string;
    workSamples?: string;
  }) {
    if (!data.skillName.trim()) throw new Error('Skill name is required.');

    const id = 'LR_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    transaction(() => {
      execute(
        `INSERT INTO learning_records (id, user_id, skill_name, category, status, progress_percentage, description, learning_institution, completion_date, certificate_url, project_image_url, work_samples)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          data.skillName.trim(),
          data.category || 'General',
          data.status,
          data.progressPercentage || (data.status === 'NEWLY_ACQUIRED' ? 100 : 25),
          data.description || null,
          data.learningInstitution || null,
          data.completionDate || null,
          data.certificateUrl || null,
          data.projectImageUrl || null,
          data.workSamples || null
        ]
      );

      // If user uploaded a certificate, also record in skill_certificates
      if (data.certificateUrl) {
        execute(
          `INSERT INTO skill_certificates (id, learning_record_id, user_id, title, issuer, issue_date, certificate_data)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            'CERT_' + Date.now(),
            id,
            userId,
            `${data.skillName} Certificate of Achievement`,
            data.learningInstitution || 'Online / Practical Training',
            data.completionDate || new Date().toISOString().split('T')[0],
            data.certificateUrl
          ]
        );
      }
    });

    return queryOne('SELECT * FROM learning_records WHERE id = ?', [id]);
  }

  async updateLearningRecord(userId: string, recordId: string, data: any) {
    const existing = queryOne('SELECT id FROM learning_records WHERE id = ? AND user_id = ?', [recordId, userId]);
    if (!existing) throw new Error('Learning record not found.');

    execute(
      `UPDATE learning_records
       SET skill_name = COALESCE(?, skill_name),
           category = COALESCE(?, category),
           status = COALESCE(?, status),
           progress_percentage = COALESCE(?, progress_percentage),
           description = COALESCE(?, description),
           learning_institution = COALESCE(?, learning_institution),
           completion_date = COALESCE(?, completion_date),
           certificate_url = COALESCE(?, certificate_url),
           project_image_url = COALESCE(?, project_image_url),
           work_samples = COALESCE(?, work_samples),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        data.skillName || null,
        data.category || null,
        data.status || null,
        data.progressPercentage ?? null,
        data.description || null,
        data.learningInstitution || null,
        data.completionDate || null,
        data.certificateUrl || null,
        data.projectImageUrl || null,
        data.workSamples || null,
        recordId,
        userId
      ]
    );

    return queryOne('SELECT * FROM learning_records WHERE id = ?', [recordId]);
  }

  async deleteLearningRecord(userId: string, recordId: string) {
    execute('DELETE FROM learning_records WHERE id = ? AND user_id = ?', [recordId, userId]);
    return { success: true };
  }

  async verifyCertificate(adminId: string, learningRecordId: string, approve: boolean) {
    transaction(() => {
      execute(
        `UPDATE learning_records
         SET is_verified_by_admin = ?,
             status = CASE WHEN ? = 1 THEN 'VERIFIED' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [approve ? 1 : 0, approve ? 1 : 0, learningRecordId]
      );

      execute(
        `UPDATE skill_certificates
         SET verified_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
             verified_by_admin_id = ?
         WHERE learning_record_id = ?`,
        [approve ? 1 : 0, adminId, learningRecordId]
      );
    });

    return { success: true, verified: approve };
  }
}

export const skillService = new SkillManagementService();
