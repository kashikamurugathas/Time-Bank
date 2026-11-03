import bcrypt from 'bcryptjs';
import { db, queryOne, execute, transaction } from './index.ts';

export async function seedDatabase() {
  transaction(() => {
    // 1. Roles
    const roles = [
      { id: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full system control and admin governance' },
      { id: 'ADMIN', name: 'Administrator', description: 'Platform management and moderation' },
      { id: 'MEMBER', name: 'Member', description: 'Individual community time exchange member' },
      { id: 'COMMUNITY_LEADER', name: 'Community Leader', description: 'Manager of local community chapter' },
      { id: 'ORG_MANAGER', name: 'Organization Manager', description: 'Coordinator of volunteer organization' },
    ];

    for (const r of roles) {
      execute(
        `INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)`,
        [r.id, r.name, r.description]
      );
    }

    // 2. Predefined Skills Catalog
    const skills = [
      { id: 'SKILL_COMP_TEACH', name: 'Computer Teaching', category: 'Education', description: 'Teaching basic computer literacy, office software, and internet navigation' },
      { id: 'SKILL_WEB_DEV', name: 'Web Development', category: 'Technology', description: 'Building modern responsive websites and web applications' },
      { id: 'SKILL_GRAPHIC_DESIGN', name: 'Graphic Design', category: 'Creative', description: 'Creating posters, logos, social media graphics, and digital artwork' },
      { id: 'SKILL_COOKING', name: 'Cooking & Baking', category: 'Culinary', description: 'Home cooking, baking techniques, meal preparation, and healthy diets' },
      { id: 'SKILL_GARDENING', name: 'Gardening & Agriculture', category: 'Home & Garden', description: 'Organic vegetable gardening, soil preparation, composting, and plant care' },
      { id: 'SKILL_LANG_TEACH', name: 'Language Teaching', category: 'Education', description: 'English, Tamil, and Sinhala conversational skills and grammar' },
      { id: 'SKILL_MATH_TEACH', name: 'Mathematics Teaching', category: 'Education', description: 'Primary and secondary school mathematics instruction and problem solving' },
      { id: 'SKILL_PHOTO', name: 'Photography & Videography', category: 'Creative', description: 'Event photography, portrait lighting, and video editing' },
      { id: 'SKILL_ELEC_REPAIR', name: 'Electrical Repair', category: 'Trades & Maintenance', description: 'Household wiring diagnostics, light fixture repairs, and appliance troubleshooting' },
      { id: 'SKILL_PLUMBING', name: 'Plumbing', category: 'Trades & Maintenance', description: 'Pipe fitting, leak repairs, tap replacements, and water system maintenance' },
      { id: 'SKILL_PHONE_REPAIR', name: 'Mobile Phone Repair', category: 'Technology', description: 'Screen replacement, battery diagnosis, and software troubleshooting' },
      { id: 'SKILL_SEWING', name: 'Sewing & Tailoring', category: 'Crafts', description: 'Garment alteration, pattern making, stitching, and clothing repair' },
      { id: 'SKILL_FIRST_AID', name: 'First Aid & CPR', category: 'Health', description: 'Emergency basic life support, wound care, and health safety procedures' },
      { id: 'SKILL_ELDERLY_CARE', name: 'Elderly Care & Companionship', category: 'Caregiving', description: 'Assisting senior community members with daily tasks, reading, and companionship' },
      { id: 'SKILL_CARPENTRY', name: 'Carpentry & Woodwork', category: 'Trades & Maintenance', description: 'Furniture restoration, shelving construction, and wooden repairs' },
      { id: 'SKILL_MUSIC', name: 'Music & Instrument Lessons', category: 'Creative', description: 'Acoustic guitar, keyboard, and vocal basics' },
    ];

    for (const s of skills) {
      execute(
        `INSERT OR IGNORE INTO skills (id, name, category, description) VALUES (?, ?, ?, ?)`,
        [s.id, s.name, s.category, s.description]
      );
    }

    // 3. Subscription Plans
    const plans = [
      {
        id: 'PLAN_COMMUNITY_FREE',
        name: 'Basic Community',
        category: 'COMMUNITY',
        price_lkr: 0,
        duration_days: 30,
        features_json: JSON.stringify([
          'Community registration',
          'Basic member management',
          'Basic service exchange',
          'Basic reports'
        ])
      },
      {
        id: 'PLAN_COMMUNITY_PLUS',
        name: 'Community Plus',
        category: 'COMMUNITY',
        price_lkr: 3000,
        duration_days: 30,
        features_json: JSON.stringify([
          'Advanced community dashboard',
          'Member analytics & insights',
          'Detailed activity reports',
          'Priority support'
        ])
      },
      {
        id: 'PLAN_ORG_STANDARD',
        name: 'Organization Standard',
        category: 'ORGANIZATION',
        price_lkr: 7500,
        duration_days: 30,
        features_json: JSON.stringify([
          'Organization dashboard',
          'Multiple community management',
          'Member management',
          'Volunteer hour tracking',
          'Monthly reports'
        ])
      },
      {
        id: 'PLAN_ORG_PREMIUM',
        name: 'Organization Premium',
        category: 'ORGANIZATION',
        price_lkr: 15000,
        duration_days: 30,
        features_json: JSON.stringify([
          'All Standard features',
          'Advanced analytics',
          'Custom organization branding',
          'Multiple administrators',
          'Exportable reports',
          'Priority support'
        ])
      },
      {
        id: 'PLAN_INDIVIDUAL_PREMIUM',
        name: 'Premium Membership',
        category: 'PREMIUM_INDIVIDUAL',
        price_lkr: 500,
        duration_days: 30,
        features_json: JSON.stringify([
          'Enhanced verified profile badge',
          'Advanced skill portfolio & media showcases',
          'Detailed learning journey history',
          'Advanced activity reports',
          'Additional profile customization',
          'Priority support',
          'Advanced service discovery filters'
        ])
      }
    ];

    for (const p of plans) {
      execute(
        `INSERT OR REPLACE INTO subscription_plans (id, name, category, price_lkr, duration_days, features_json) VALUES (?, ?, ?, ?, ?, ?)`,
        [p.id, p.name, p.category, p.price_lkr, p.duration_days, p.features_json]
      );
    }

    // 4. Seed Super Administrator
    // Email: kashikamurugathas@gmail.com
    // Initial password: kashi123
    const adminEmail = 'kashikamurugathas@gmail.com';
    const existingAdmin = queryOne('SELECT id FROM users WHERE email = ?', [adminEmail]);

    if (!existingAdmin) {
      const adminId = 'USR_SUPER_ADMIN_001';
      const passwordHash = bcrypt.hashSync('kashi123', 10);

      execute(
        `INSERT INTO users (id, email, password_hash, account_type, role_id, status, requires_password_change)
         VALUES (?, ?, ?, 'INDIVIDUAL', 'SUPER_ADMIN', 'APPROVED', 1)`,
        [adminId, adminEmail, passwordHash]
      );

      execute(
        `INSERT INTO user_profiles (user_id, full_name, phone_number, bio, country, district, city, profile_photo_url, membership_tier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PREMIUM')`,
        [
          adminId,
          'Kashika Murugathas',
          '+94 77 123 4567',
          'Super Administrator & Platform Governance Lead for Time Bank Community Platform.',
          'Sri Lanka',
          'Jaffna',
          'Nallur',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
        ]
      );

      execute(
        `INSERT INTO user_locations (user_id, latitude, longitude, formatted_address, city, district)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [adminId, 9.6749, 80.0292, 'Point Pedro Road, Nallur, Jaffna', 'Nallur', 'Jaffna']
      );

      execute(
        `INSERT INTO time_wallets (user_id, available_credits, earned_credits, spent_credits)
         VALUES (?, 100.0, 0.0, 0.0)`,
        [adminId]
      );

      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, ?, ?, 'SYSTEM', ?)`,
        ['NOTIF_ADMIN_INIT', adminId, 'Welcome Super Admin', 'Platform successfully initialized. Please change your initial password for security.', '/admin/settings']
      );
    }

    // 5. Seed Real Demo Approved Members with Geocoordinates for instant testing & location recommendations
    const demoUsers = [
      {
        id: 'USR_AVI_002',
        email: 'avi.sharma@example.com',
        pass: 'AviPass123!',
        name: 'Avi Sharma',
        phone: '+94 77 234 5678',
        type: 'INDIVIDUAL',
        city: 'Nallur',
        district: 'Jaffna',
        lat: 9.6765,
        lon: 80.0310,
        bio: 'Passionate computer science educator and software engineer. Love helping beginners unlock digital skills!',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        skills: [
          { skillId: 'SKILL_COMP_TEACH', level: 'EXPERT', desc: 'Patient coaching on laptops, operating systems, internet, email, and Microsoft 365.' },
          { skillId: 'SKILL_WEB_DEV', level: 'ADVANCED', desc: 'HTML/CSS/JS and modern websites for local small businesses.' }
        ],
        credits: 8.0,
        rating: 4.95,
        ratingCount: 14,
        servicesCount: 12
      },
      {
        id: 'USR_SELVI_003',
        email: 'selvi.t@example.com',
        pass: 'SelviPass123!',
        name: 'Selvi Thiyagarajah',
        phone: '+94 71 889 4432',
        type: 'INDIVIDUAL',
        city: 'Chundikuli',
        district: 'Jaffna',
        lat: 9.6640,
        lon: 80.0245,
        bio: 'Home gardener and baker. Dedicated to organic urban agriculture, seed sharing, and traditional culinary skills.',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        skills: [
          { skillId: 'SKILL_GARDENING', level: 'EXPERT', desc: 'Composting, raised beds, pest management with neem, drip irrigation setup.' },
          { skillId: 'SKILL_COOKING', level: 'ADVANCED', desc: 'Traditional healthy Jaffna curries, roti, and sourdough baking.' }
        ],
        credits: 12.0,
        rating: 5.0,
        ratingCount: 19,
        servicesCount: 16
      },
      {
        id: 'USR_DINESH_004',
        email: 'dinesh.f@example.com',
        pass: 'DineshPass123!',
        name: 'Dinesh Fernando',
        phone: '+94 77 456 7890',
        type: 'COMMUNITY',
        city: 'Kollupitiya',
        district: 'Colombo',
        lat: 6.9034,
        lon: 79.8542,
        bio: 'Certified electronics technician. Specializing in phone battery replacements, display repair, and household electrics.',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        skills: [
          { skillId: 'SKILL_PHONE_REPAIR', level: 'EXPERT', desc: 'Diagnostics, battery swapping, camera fix, water damage evaluation.' },
          { skillId: 'SKILL_ELEC_REPAIR', level: 'INTERMEDIATE', desc: 'Household switches, surge protection, ceiling fan motor inspection.' }
        ],
        credits: 5.0,
        rating: 4.85,
        ratingCount: 8,
        servicesCount: 7
      },
      {
        id: 'USR_NIROSHA_005',
        email: 'nirosha.p@example.com',
        pass: 'NiroshaPass123!',
        name: 'Nirosha Perera',
        phone: '+94 72 334 1122',
        type: 'ORGANIZATION',
        city: 'Kandy',
        district: 'Kandy',
        lat: 7.2906,
        lon: 80.6337,
        bio: 'Retired high school teacher offering spoken English, grammar coaching, and fundamental mathematics.',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        skills: [
          { skillId: 'SKILL_LANG_TEACH', level: 'EXPERT', desc: 'Interactive conversational English, grammar clarity, IELTS preparation.' },
          { skillId: 'SKILL_MATH_TEACH', level: 'ADVANCED', desc: 'Secondary school algebra, geometry, and exam confidence.' }
        ],
        credits: 14.0,
        rating: 4.98,
        ratingCount: 22,
        servicesCount: 20
      }
    ];

    for (const u of demoUsers) {
      const exists = queryOne('SELECT id FROM users WHERE email = ?', [u.email]);
      if (!exists) {
        const passHash = bcrypt.hashSync(u.pass, 10);
        execute(
          `INSERT INTO users (id, email, password_hash, account_type, role_id, status, requires_password_change)
           VALUES (?, ?, ?, ?, 'MEMBER', 'APPROVED', 0)`,
          [u.id, u.email, passHash, u.type]
        );

        execute(
          `INSERT INTO user_profiles (user_id, full_name, phone_number, bio, country, district, city, profile_photo_url, rating_avg, rating_count, completed_services_count)
           VALUES (?, ?, ?, ?, 'Sri Lanka', ?, ?, ?, ?, ?, ?)`,
          [u.id, u.name, u.phone, u.bio, u.district, u.city, u.photo, u.rating, u.ratingCount, u.servicesCount]
        );

        execute(
          `INSERT INTO user_locations (user_id, latitude, longitude, formatted_address, city, district)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [u.id, u.lat, u.lon, `${u.city}, ${u.district}, Sri Lanka`, u.city, u.district]
        );

        execute(
          `INSERT INTO time_wallets (user_id, available_credits, earned_credits, spent_credits)
           VALUES (?, ?, ?, 0.0)`,
          [u.id, u.credits, u.credits]
        );

        for (const sk of u.skills) {
          execute(
            `INSERT INTO user_skills (id, user_id, skill_id, experience_level, description, hourly_rate_credits, availability_status, is_verified)
             VALUES (?, ?, ?, ?, ?, 1.0, 'AVAILABLE', 1)`,
            [`USK_${u.id}_${sk.skillId}`, u.id, sk.skillId, sk.level, sk.desc]
          );
        }
      }
    }

    // 6. Seed a pending registration so admin can test the approval workflow immediately
    const pendingEmail = 'ranjan.pending@example.com';
    const existsPending = queryOne('SELECT id FROM users WHERE email = ?', [pendingEmail]);
    if (!existsPending) {
      const pId = 'USR_PENDING_006';
      const passHash = bcrypt.hashSync('RanjanPass123!', 10);
      execute(
        `INSERT INTO users (id, email, password_hash, account_type, role_id, status, requires_password_change)
         VALUES (?, ?, ?, 'INDIVIDUAL', 'MEMBER', 'PENDING', 0)`,
        [pId, pendingEmail, passHash]
      );

      execute(
        `INSERT INTO user_profiles (user_id, full_name, phone_number, bio, country, district, city, profile_photo_url)
         VALUES (?, 'Ranjan Ratnakumar', '+94 77 990 0112', 'Automobile and plumbing enthusiast wanting to exchange skills with neighbours.', 'Sri Lanka', 'Jaffna', 'Kopay', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80')`,
        [pId]
      );

      execute(
        `INSERT INTO user_locations (user_id, latitude, longitude, formatted_address, city, district)
         VALUES (?, 9.6912, 80.0520, 'Kopay South, Jaffna', 'Kopay', 'Jaffna')`,
        [pId]
      );

      execute(
        `INSERT INTO time_wallets (user_id, available_credits) VALUES (?, 3.0)`,
        [pId]
      );

      // In-app notification for admin
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, 'USR_SUPER_ADMIN_001', 'New Registration Pending Approval', 'Ranjan Ratnakumar registered as an Individual Member in Jaffna. Review and approve their account.', 'REGISTRATION', '/admin/approvals')`,
        ['NOTIF_PENDING_RANJAN']
      );
    }

    // 7. Seed Sample Communities & Organizations
    const commExists = queryOne('SELECT id FROM communities WHERE id = ?', ['COMM_JAFFNA_GREEN']);
    if (!commExists) {
      execute(
        `INSERT INTO communities (id, name, description, leader_id, district, city, plan_tier)
         VALUES ('COMM_JAFFNA_GREEN', 'Jaffna Green Innovators', 'Neighborhood collective focused on permaculture, seed saving, and rooftop vegetable gardens.', 'USR_SELVI_003', 'Jaffna', 'Chundikuli', 'PLUS')`
      );
      execute(
        `INSERT INTO community_members (id, community_id, user_id, role)
         VALUES ('CM_1', 'COMM_JAFFNA_GREEN', 'USR_SELVI_003', 'LEADER'),
                ('CM_2', 'COMM_JAFFNA_GREEN', 'USR_AVI_002', 'MEMBER')`
      );
    }

    const orgExists = queryOne('SELECT id FROM organizations WHERE id = ?', ['ORG_NORTH_YOUTH']);
    if (!orgExists) {
      execute(
        `INSERT INTO organizations (id, name, description, owner_id, registration_no, plan_tier)
         VALUES ('ORG_NORTH_YOUTH', 'Northern Skills & Youth Foundation', 'Community non-profit empowering regional youth through practical vocational skills and mentoring.', 'USR_NIROSHA_005', 'GA/NP/2021/884', 'PREMIUM')`
      );
      execute(
        `INSERT INTO organization_members (id, organization_id, user_id, role, hours_contributed)
         VALUES ('OM_1', 'ORG_NORTH_YOUTH', 'USR_NIROSHA_005', 'ADMIN', 45.0),
                ('OM_2', 'ORG_NORTH_YOUTH', 'USR_AVI_002', 'VOLUNTEER', 18.0)`
      );
    }

    // 8. Seed sample learning records for "My Learning Journey"
    const learningExists = queryOne('SELECT id FROM learning_records WHERE id = ?', ['LR_001']);
    if (!learningExists) {
      execute(
        `INSERT INTO learning_records (id, user_id, skill_name, category, status, progress_percentage, description, learning_institution, completion_date, is_verified_by_admin)
         VALUES ('LR_001', 'USR_AVI_002', 'Mobile App Development (React Native)', 'Technology', 'NEWLY_ACQUIRED', 100, 'Completed full mobile development curriculum and built community prototype', 'University of Jaffna Open Learning', '2026-09-15', 1)`,
        []
      );
      execute(
        `INSERT INTO learning_records (id, user_id, skill_name, category, status, progress_percentage, description, learning_institution, is_verified_by_admin)
         VALUES ('LR_002', 'USR_AVI_002', 'Solar Panel Maintenance', 'Trades & Maintenance', 'CURRENTLY_LEARNING', 65, 'Studying inverter wiring, battery bank management, and solar panel cleaning', 'Jaffna Vocational Training Center', 0)`,
        []
      );
    }

    // 9. Seed sample Help Request (so near helpers and requests are visible right away)
    const reqExists = queryOne('SELECT id FROM help_requests WHERE id = ?', ['REQ_001']);
    if (!reqExists) {
      execute(
        `INSERT INTO help_requests (id, requester_id, title, category, skill_id, skill_name, description, preferred_date, preferred_time, duration_hours, credits_offered, location_name, latitude, longitude, status)
         VALUES ('REQ_001', 'USR_SELVI_003', 'Need help setting up community garden computer and digital logs', 'Education', 'SKILL_COMP_TEACH', 'Computer Teaching', 'Looking for someone to help configure spreadsheet records and teach our community members how to input weekly harvest stats.', '2026-11-10', '10:00 AM', 2.0, 2.0, 'Nallur Community Hall, Jaffna', 9.6749, 80.0292, 'OPEN')`
      );
    }
  });

  console.log('Time Bank database seeded successfully with Admin & sample data.');
}
