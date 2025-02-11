import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ChatMessage, ChatAnalysis } from '../types/chat';
import { chunkMessages } from '../utils/chunks';
import { formatMessages } from '../utils/formatters';
import { SupabaseService } from './SupabaseService';

export class AnalyzerService {
  private model: ChatOpenAI;
  private supabaseService: SupabaseService;

  constructor() {
    // Initialize OpenAI chat model with specific parameters
    this.model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.2,
      maxTokens: 3000,
    });
    this.supabaseService = new SupabaseService();
  }

  async analyzeChannelMessages(
    startDate: Date,
    endDate: Date,
    discordServerId: string,
    roomId: string
  ): Promise<ChatAnalysis> {
    // Get messages for the specified channel
    const messages = await this.supabaseService.getMessagesByDateRange(
      startDate,
      endDate,
      discordServerId,
      roomId
    );

    // Get user details for all users in the messages
    const userIds = [...new Set(messages.map(msg => msg.user_id))];
    const users = await this.supabaseService.getUserDetails(userIds);

    // Analyze the messages
    return this.analyzeChat(messages, users);
  }

  async analyzeChat(messages: ChatMessage[], users: Record<string, any>): Promise<ChatAnalysis> {
    const chunks = chunkMessages(messages, 20); // Reduced chunk size to 20 messages
    const analyses: ChatAnalysis[] = [];
    
    console.log(`Processing ${messages.length} messages in ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} messages)...`);
      
      const transcript = formatMessages(chunk, users);
      const analysis = await this.analyzeChunk(transcript);
      analyses.push(analysis);
      
      // Log progress
      console.log(`Completed chunk ${i + 1}/${chunks.length}`);
      if (analysis.help_interactions.length > 0) {
        console.log(`Found ${analysis.help_interactions.length} help interactions in this chunk`);
      }
    }

    console.log('Merging analyses...');
    return this.mergeAnalyses(analyses);
  }

  private async analyzeChunk(transcript: string): Promise<ChatAnalysis> {
    const prompt = this.formatPrompt(transcript);
    const response = await this.model.invoke([
      new HumanMessage(prompt)
    ]);

    try {
      let content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      // Clean up the response
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Validate the structure before returning
      const parsed = JSON.parse(content);
      if (!parsed.summary || !Array.isArray(parsed.faq) || 
          !Array.isArray(parsed.help_interactions) || 
          !Array.isArray(parsed.action_items)) {
        throw new Error('Invalid response structure');
      }
      
      return parsed as ChatAnalysis;
    } catch (e) {
      console.error("Failed to parse analysis response:", e);
      console.error("Raw response:", response.content);
      
      // Return a valid but empty analysis instead of throwing
      return {
        summary: "Failed to analyze this segment",
        faq: [],
        help_interactions: [],
        action_items: []
      };
    }
  }

  private formatPrompt(transcript: string): string {
    return `Analyze this Discord chat segment and provide a structured analysis. Focus on technical discussions, decisions, and action items.

Rules:
1. Keep summaries concise and technical
2. Only include genuine questions in FAQ
3. Include any interactions where someone helped answer a question or provided assistance
4. Action items should be concrete, not general discussion
5. Award points for help interactions based on these criteria:
   - Direct problem solving/debugging: 50-100 points
   - Detailed technical explanations: 30-80 points
   - Quick answers to questions: 10-30 points
   - Promises to help later: 5-10 points
   Higher points for:
   - Complexity of the problem solved
   - Time/effort invested
   - Completeness of solution
   - Educational value of the explanation

Respond in this JSON format:
{
  "summary": "Technical summary focusing on key decisions and outcomes",
  "faq": [
    {
      "question": "Specific question asked",
      "asker": "Username"
    }
  ],
  "help_interactions": [
    {
      "helper": "Username who answered/helped",
      "recipient": "Username who asked/needed help",
      "task": "What they needed help with",
      "assistance": "The answer or help provided",
      "suggested_points": 50,
      "reason": "Brief explanation of points awarded"
    }
  ],
  "action_items": [
    {
      "description": "Specific actionable task",
      "mentioned_by": "Username",
      "type": "Technical Tasks | Documentation | Feature Request"
    }
  ]
}

Chat transcript:
${transcript}`;
  }

  private mergeAnalyses(analyses: ChatAnalysis[]): ChatAnalysis {
    // Combine summaries with better formatting
    const summaries = analyses.map(a => a.summary.trim()).filter(Boolean);
    const combinedSummary = summaries
      .join('\n\n')
      .replace(/\\n/g, '\n')  // Replace escaped newlines
      .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newlines
      .replace(/\s+\n/g, '\n')  // Remove spaces before newlines
      .replace(/\n\s+/g, '\n')  // Remove spaces after newlines
      .trim();
    
    // Use Maps to track unique items
    const faqMap = new Map();
    const helpMap = new Map();
    const actionMap = new Map();

    for (const analysis of analyses) {
      // Add unique FAQ items
      analysis.faq?.forEach(q => {
        const key = `${q.question}:${q.asker}`;
        if (!faqMap.has(key)) {
          faqMap.set(key, q);
        }
      });

      // Add unique help interactions with simpler criteria
      analysis.help_interactions?.forEach(h => {
        const key = `${h.helper}:${h.recipient}`; // Simplified key to allow multiple helps
        if (!helpMap.has(key)) {
          helpMap.set(key, h);
        }
      });

      // Add unique action items
      analysis.action_items?.forEach(a => {
        const key = `${a.description}:${a.mentioned_by}`;
        if (!actionMap.has(key)) {
          actionMap.set(key, a);
        }
      });
    }

    return {
      summary: combinedSummary,
      faq: Array.from(faqMap.values()).slice(0, 20),
      help_interactions: Array.from(helpMap.values()).slice(0, 10),
      action_items: Array.from(actionMap.values()).slice(0, 20)
    };
  }
} 