import { GoogleGenAI } from '@google/genai';
import { execute, queryAll, queryOne } from '../db/index.ts';
import { calculateDistanceKm } from './location-recommendation.service.ts';

export class AiAgentService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.initGemini();
  }

  private initGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error('Error initializing Gemini SDK:', err);
      }
    }
  }

  // Fetch real approved member and skills context from SQLite
  private getRealDatabaseContext(userLat?: number, userLng?: number) {
    const approvedMembers = queryAll<any>(`
      SELECT u.id, u.email, p.full_name, p.city, p.district, p.rating_avg, p.rating_count,
             p.completed_services_count, l.latitude, l.longitude
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN user_locations l ON u.id = l.user_id
      WHERE u.status = 'APPROVED'
      LIMIT 25
    `);

    const membersWithSkills = approvedMembers.map(m => {
      const skills = queryAll<any>(`
        SELECT s.name as skill_name, s.category, us.experience_level, us.hourly_rate_credits, us.availability_status
        FROM user_skills us
        JOIN skills s ON us.skill_id = s.id
        WHERE us.user_id = ? AND us.availability_status = 'AVAILABLE'
      `, [m.id]);

      let distanceStr = 'Unknown location';
      if (userLat && userLng && m.latitude && m.longitude) {
        const d = calculateDistanceKm(userLat, userLng, m.latitude, m.longitude);
        distanceStr = `Approx. ${d} km away`;
      }

      return {
        id: m.id,
        name: m.full_name,
        city: m.city,
        district: m.district,
        distance: distanceStr,
        rating: `${m.rating_avg}/5 (${m.rating_count} reviews, ${m.completed_services_count} services completed)`,
        skills: skills.map(s => `${s.skill_name} (${s.experience_level}, ${s.hourly_rate_credits} credit/hr)`)
      };
    });

    const activeSkills = queryAll<any>(`SELECT name, category, description FROM skills WHERE is_active = 1`);
    const activeRequests = queryAll<any>(`SELECT title, skill_name, duration_hours, location_name, preferred_date FROM help_requests WHERE status = 'OPEN' LIMIT 5`);

    return {
      members: membersWithSkills,
      skillsCatalog: activeSkills,
      openRequests: activeRequests
    };
  }

  async processMessage(userId: string | null, conversationId: string | null, userPrompt: string, userLocation?: { lat: number; lng: number; city?: string }) {
    // 1. Resolve or create AI conversation
    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = 'AICONV_' + Date.now();
      execute(
        `INSERT INTO ai_conversations (id, user_id, title) VALUES (?, ?, ?)`,
        [activeConvId, userId || null, userPrompt.substring(0, 40) + '...']
      );
    }

    // Save user message
    execute(
      `INSERT INTO ai_messages (id, conversation_id, sender, content) VALUES (?, ?, 'user', ?)`,
      ['AIM_' + Date.now(), activeConvId, userPrompt]
    );

    // 2. Fetch real database facts
    const dbContext = this.getRealDatabaseContext(userLocation?.lat, userLocation?.lng);

    // Fetch previous 4 messages for conversational context
    const history = queryAll<any>(
      `SELECT sender, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 6`,
      [activeConvId]
    ).reverse();

    const systemInstruction = `
You are the official Time Bank AI Assistant for "Time Bank – Community Time Exchange Platform".
Tagline: "Your Time Has Value. Share It. Earn It. Grow Together."

Core rules of Time Bank:
- 1 hour of service exchanged = 1 Time Credit earned. Money is never exchanged for community help!
- Members can learn, teach, assist, or request skills.
- Available account types: Individual Member, Community, Organization.
- Every newly registered account requires mandatory administrator approval before logging in.
- Both parties must confirm completion of a session before credits are transferred.
- You have access to the REAL approved member database below. NEVER invent or hallucinate users, skills, or reviews.

REAL APPROVED MEMBERS CURRENTLY IN DATABASE:
${JSON.stringify(dbContext.members, null, 2)}

ACTIVE SKILLS IN CATALOG:
${dbContext.skillsCatalog.map(s => `- ${s.name} (${s.category})`).join('\n')}

RECENT OPEN HELP REQUESTS:
${dbContext.openRequests.map(r => `- "${r.title}" for ${r.skill_name} at ${r.location_name}`).join('\n')}

USER LOCATION:
${userLocation?.city ? `${userLocation.city} (Lat: ${userLocation.lat}, Lng: ${userLocation.lng})` : 'Location not specified by user'}

CRITICAL SAFETY & ROLE RULES:
1. Always recommend the REAL matching approved members from the database above who offer the requested skill, and mention their approximate distance, rating, and city.
2. If the user wants to learn a skill, give a step-by-step roadmap, practical project ideas, and mention which real community member can teach it.
3. If the user wants to request help, guide them on what title, duration in hours (credits), and skills to specify.
4. You CANNOT approve accounts, transfer credits, or perform payments directly. Direct the user to the appropriate page (/dashboard, /requests/create, /nearby, /learning-journey, /wallet).
5. Be warm, community-minded, encouraging, clear, and professional.
`;

    let assistantResponseText = '';

    // Re-check api key dynamically if injected
    if (!this.ai && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      this.initGemini();
    }

    if (this.ai) {
      try {
        const conversationContents = history.map(h => ({
          role: h.sender === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }));

        // Call Gemini 3.8 Flash model
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: conversationContents.length > 0 ? conversationContents : [{ role: 'user', parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction
          }
        });

        assistantResponseText = response.text || "I'm here to help you connect with community helpers and exchange time credits!";
      } catch (err: any) {
        console.error('Gemini API call failed, using intelligent local engine:', err.message);
        assistantResponseText = this.fallbackLocalAssistant(userPrompt, dbContext, userLocation);
      }
    } else {
      assistantResponseText = this.fallbackLocalAssistant(userPrompt, dbContext, userLocation);
    }

    // Save assistant message
    const botMsgId = 'AIM_' + (Date.now() + 1);
    execute(
      `INSERT INTO ai_messages (id, conversation_id, sender, content) VALUES (?, ?, 'assistant', ?)`,
      [botMsgId, activeConvId, assistantResponseText]
    );

    return {
      conversationId: activeConvId,
      reply: assistantResponseText
    };
  }

  // Resilient fallback assistant using the real SQLite database facts
  private fallbackLocalAssistant(prompt: string, dbContext: any, userLocation?: any): string {
    const p = prompt.toLowerCase();

    // Check for skill matching in real database
    const matchedMember = dbContext.members.find((m: any) =>
      m.skills.some((s: string) => p.includes(s.toLowerCase().split(' ')[0]) || p.includes('computer') || p.includes('garden') || p.includes('teach'))
    );

    if (p.includes('computer') || p.includes('laptop') || p.includes('coding') || p.includes('web')) {
      const compHelpers = dbContext.members.filter((m: any) =>
        m.skills.some((s: string) => s.toLowerCase().includes('computer') || s.toLowerCase().includes('web'))
      );
      if (compHelpers.length > 0) {
        const h = compHelpers[0];
        return `I found verified community members who teach computer skills!\n\n**${h.name}** in ${h.city} (${h.distance})\n- Rating: ${h.rating}\n- Skills: ${h.skills.join(', ')}\n\nIn Time Bank, 1 hour of computer coaching earns 1 Time Credit. You can create a Help Request directly from the **Help Requests** menu to connect with ${h.name.split(' ')[0]}!`;
      }
    }

    if (p.includes('garden') || p.includes('plant') || p.includes('cook') || p.includes('bake')) {
      const greenHelpers = dbContext.members.filter((m: any) =>
        m.skills.some((s: string) => s.toLowerCase().includes('garden') || s.toLowerCase().includes('cook'))
      );
      if (greenHelpers.length > 0) {
        const h = greenHelpers[0];
        return `Here is a highly rated community member matching your interest:\n\n**${h.name}** in ${h.city} (${h.distance})\n- Rating: ${h.rating}\n- Skills: ${h.skills.join(', ')}\n\nYou can request a practical session or exchange knowledge in urban agriculture and cooking!`;
      }
    }

    if (p.includes('how does') || p.includes('credit') || p.includes('how it works') || p.includes('rule')) {
      return `Welcome to **Time Bank**! Here is how our time exchange works:\n\n1. **1 Hour = 1 Time Credit**: Regardless of the skill, everyone's hour is valued equally.\n2. **Offer Help**: Teach, fix, assist, or care for a neighbor to earn credits.\n3. **Receive Help**: Spend your earned credits to get assistance with gardening, computer skills, languages, repairs, and more.\n4. **Mutual Confirmation**: Once both members confirm session completion, credits are automatically transferred.\n5. **No Money Exchanged**: It is 100% community empowerment and reciprocity!`;
    }

    if (p.includes('learn') || p.includes('journey')) {
      return `Starting your **Learning Journey** is one of the best parts of Time Bank!\n\n- Visit **My Learning Journey** on your dashboard.\n- Track skills you are currently learning or newly acquired.\n- Upload practical work samples or certificates to earn a **Verified Skill** badge from administrators.\n- Share your progress with the community!`;
    }

    return `Hello! I'm your **Time Bank AI Assistant**. I can help you discover verified local helpers in Jaffna, Colombo, and across Sri Lanka, formulate help requests, track your learning journey, or explain how time credits work. How can I support your community exchange today?`;
  }

  async getConversationHistory(conversationId: string) {
    return queryAll<any>(
      `SELECT id, sender, content, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );
  }
}

export const aiAgentService = new AiAgentService();
