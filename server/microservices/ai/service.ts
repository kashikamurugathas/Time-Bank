import { GoogleGenAI } from '@google/genai';
import { aiDb } from './db.ts';
import { createLogger } from '../common/logger.ts';
import { skillService } from '../skills/service.ts';
import { helpRequestService } from '../requests/service.ts';
import { locationRecommendationService } from '../location/service.ts';
import { walletDb } from '../wallet/db.ts';

const logger = createLogger('ai-agent-service');

export class AiAgentService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.ai = new GoogleGenAI({ apiKey });
        logger.info('Gemini AI SDK initialized successfully');
      } catch (err: any) {
        logger.warn(`Could not initialize Gemini AI: ${err.message}`);
      }
    }
  }

  async getConversationHistory(conversationId: string) {
    return aiDb.queryAll<any>(
      'SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );
  }

  async processMessage(
    userId: string | null,
    conversationId: string | null,
    userPrompt: string,
    userLocation?: { lat: number; lng: number }
  ) {
    let convId = conversationId;
    if (!convId) {
      convId = `AICONV_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      aiDb.execute(
        'INSERT INTO ai_conversations (id, user_id, title) VALUES (?, ?, ?)',
        [convId, userId || null, userPrompt.substring(0, 40) + '...']
      );
    }

    // Save user message
    aiDb.execute(
      `INSERT INTO ai_messages (id, conversation_id, sender, content)
       VALUES (?, ?, 'user', ?)`,
      [`AIM_${Date.now()}_U`, convId, userPrompt]
    );

    // Live Inter-Service Data Retrieval for Grounding
    let skillsList: any[] = [];
    let openRequests: any[] = [];
    let nearbyHelpers: any[] = [];
    let userBalance: number | null = null;

    try {
      skillsList = await skillService.getAllCatalogSkills();
      openRequests = await helpRequestService.listRequests({ status: 'OPEN' });
      if (userLocation?.lat && userLocation?.lng) {
        nearbyHelpers = await locationRecommendationService.getNearbyHelpers({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          maxRadiusKm: 50,
        });
      }
      if (userId) {
        const wallet = walletDb.queryOne<any>('SELECT available_credits FROM wallets WHERE user_id = ?', [userId]);
        if (wallet) userBalance = wallet.available_credits;
      }
    } catch (err: any) {
      logger.warn(`Could not fetch grounding data: ${err.message}`);
    }

    let assistantResponse = '';

    if (this.ai) {
      try {
        const systemInstruction = `
You are the official Time Bank Assistant for the Time Bank - Community Time Exchange Platform.
Tagline: "Your Time Has Value. Share It. Earn It. Grow Together."

Rules and Core Principles:
1. 1 Hour = 1 Time Credit. All human time and skills have equal value.
2. Time credits cannot be bought or sold for cash; they are earned by helping others.
3. Every new account is verified and approved by administrators for community safety.
4. Privacy: Exact home addresses are NEVER revealed; only approximate distances in km are shared.
5. Dual Confirmation: Credits only transfer when both requester and helper confirm completion.

Current Live Platform Context:
- Active Catalog Skills: ${skillsList.slice(0, 15).map(s => `${s.name} (${s.category})`).join(', ')}
- Open Help Requests: ${openRequests.slice(0, 5).map(r => `"${r.title}" for ${r.skill_name} in ${r.location_name} offering ${r.credits_offered} credit(s)`).join('; ') || 'None currently'}
- Nearby Helpers found: ${nearbyHelpers.length} helpers within 50km
${userBalance !== null ? `- Current user available time credits: ${userBalance} hours` : ''}

Respond courteously, warmly, clearly, and concisely to help members exchange skills, create requests, or learn about Time Banking.
`;

        const history = await this.getConversationHistory(convId);
        const contents = history.map(h => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        }));

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        assistantResponse = response.text || 'I am ready to help you explore Time Bank skills and requests!';
      } catch (err: any) {
        logger.error(`Gemini call error: ${err.message}`);
        assistantResponse = this.generateFallbackResponse(userPrompt, skillsList, openRequests, nearbyHelpers, userBalance);
      }
    } else {
      assistantResponse = this.generateFallbackResponse(userPrompt, skillsList, openRequests, nearbyHelpers, userBalance);
    }

    // Save assistant message
    aiDb.execute(
      `INSERT INTO ai_messages (id, conversation_id, sender, content)
       VALUES (?, ?, 'assistant', ?)`,
      [`AIM_${Date.now()}_A`, convId, assistantResponse]
    );

    return {
      conversationId: convId,
      reply: assistantResponse,
      timestamp: new Date().toISOString(),
    };
  }

  private generateFallbackResponse(
    prompt: string,
    skills: any[],
    requests: any[],
    helpers: any[],
    userBalance: number | null
  ): string {
    const p = prompt.toLowerCase();
    if (p.includes('credit') || p.includes('balance') || p.includes('wallet')) {
      return `In Time Bank, 1 hour of any service equals 1 Time Credit. ${userBalance !== null ? `You currently have ${userBalance} available time credits in your wallet.` : 'Every new member receives 3 welcome credits upon registration.'} Credits are strictly non-monetary and are exchanged through mutual support.`;
    }
    if (p.includes('skill') || p.includes('teach') || p.includes('learn')) {
      const topSkills = skills.slice(0, 6).map(s => s.name).join(', ');
      return `Our community offers a rich variety of skills including: ${topSkills}. You can explore them in the "Explore Skills" section or offer your own knowledge on your profile.`;
    }
    if (p.includes('request') || p.includes('help')) {
      return `There are currently ${requests.length} open community help requests! You can post a new request anytime by clicking "Request Help" on your dashboard.`;
    }
    if (p.includes('nearby') || p.includes('location') || p.includes('jaffna') || p.includes('colombo')) {
      return `We connect you with helpers close to your neighborhood! Your exact address remains private, and distance is calculated safely using coordinates.`;
    }
    return `Hello! I am your Time Bank assistant. How can I help you today? You can ask me about how time credits work, available community skills, finding nearby helpers, or posting help requests!`;
  }
}

export const aiAgentService = new AiAgentService();
