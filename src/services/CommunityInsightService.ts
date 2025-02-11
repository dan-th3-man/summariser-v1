import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ChatMessage, CommunityInsight, InsightChunk } from '../models/types';
import { chunkMessages } from '../utils/chunks';
import { formatMessages } from '../utils/formatters';
import { SupabaseService } from './SupabaseService';
import { getServerAndChannelNames } from '../utils/communityHelpers';
import { getOutputPath } from '../utils/fileHelpers';
import { COMMUNITY_SERVERS } from '../constants/communities';

export class CommunityInsightService {
  private model: ChatOpenAI;
  private supabase: SupabaseService;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.2,
      maxTokens: 2000,  // Increased for larger chunks
    });
    this.supabase = new SupabaseService();
  }

  async generateInsights(messages: ChatMessage[], users: Record<string, any>): Promise<CommunityInsight> {
    const chunks = chunkMessages(messages, 200);
    const insights: InsightChunk[] = [];
    
    /* Commenting out reactions logic for now
    // Get reactions for all messages
    const messageIds = messages.map(m => m.id);
    const reactions = await this.supabase.getMessageReactions(messageIds);
    
    // Sort messages by reaction count
    const topReactedMessages = messages
      .filter(m => reactions[m.id]?.length > 0)
      .sort((a, b) => (reactions[b.id]?.length || 0) - (reactions[a.id]?.length || 0))
      .slice(0, 5)
      .map(m => ({
        messageContent: typeof m.content === 'object' ? (m.content as any).text : m.content,
        reactions: this.groupReactions(reactions[m.id]),
        url: reactions[m.id][0]?.url || ''
      }));
    */

    // Get date range from messages
    const dates = messages.map(m => new Date(m.created_at));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    console.log(`Analyzing ${messages.length} messages in ${chunks.length} chunks...`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} messages)`);
      const chunkDates = chunks[i].map(m => new Date(m.created_at));
      const chunkStart = new Date(Math.min(...chunkDates.map(d => d.getTime())));
      const chunkEnd = new Date(Math.max(...chunkDates.map(d => d.getTime())));
      
      const transcript = formatMessages(chunks[i], users);
      const insight = await this.analyzeChunk(transcript);
      insight.dateRange = {
        start: chunkStart,
        end: chunkEnd
      };
      insights.push(insight);
    }

    // Add top reactions to each chunk
    // insights.forEach(chunk => {
    //   chunk.top_reactions = topReactedMessages;
    // });

    return {
      insights,
      dateRange: {
        start: startDate,
        end: endDate
      }
      // topReactedMessages: [] // Commented out for now
    };
  }

  private async analyzeChunk(transcript: string): Promise<InsightChunk> {
    const prompt = `Analyze this Discord chat segment and provide a high-level summary of community discussions.

Focus on:
1. Key technical discussions and decisions
2. Important questions and their answers
3. Notable community interactions
4. Emerging topics or trends

Respond in this JSON format:
{
  "summary": "High-level overview of key discussions",
  "key_topics": [
    {
      "name": "Topic name",
      "description": "Brief description",
      "participants": ["username1", "username2"],
      "key_points": ["Point 1", "Point 2"]
    }
  ],
  "notable_interactions": [
    {
      "type": "Question|Discussion|Announcement",
      "description": "Brief description",
      "participants": ["username1", "username2"],
      "impact": "Potential impact on community"
    }
  ],
  "emerging_trends": [
    "Trend description 1",
    "Trend description 2"
  ]
}

Chat transcript:
${transcript}`;

    const response = await this.model.invoke([
      new HumanMessage(prompt)
    ]);

    try {
      let content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content) as InsightChunk;
    } catch (e) {
      console.error("Failed to parse analysis response:", e);
      return {
        dateRange: {
          start: new Date(),
          end: new Date()
        },
        summary: "Failed to analyze this segment",
        key_topics: [],
        notable_interactions: [],
        emerging_trends: []
      } as InsightChunk;
    }
  }

  formatToMarkdown(insight: CommunityInsight, serverId: string, channelIds?: string[]): { markdown: string, filename: string } {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const { serverName, channelNames } = getServerAndChannelNames(serverId, channelIds);
    
    const channelSuffix = channelNames?.length 
      ? `-${channelNames.map(name => name.toLowerCase().replace(/\s+/g, '-')).join('-')}` 
      : '';
    
    const filename = `insights${channelSuffix}-${formatDate(insight.dateRange.start)}-to-${formatDate(insight.dateRange.end)}.md`;
    const outputPath = getOutputPath('insights', serverName, filename);
    
    let markdown = `# Community Insights\n`;
    markdown += `## Server: ${serverName}\n`;
    if (channelNames?.length) {
      markdown += `## Channels: ${channelNames.join(', ')}\n`;
    }
    markdown += `## Date Range: ${formatDate(insight.dateRange.start)} to ${formatDate(insight.dateRange.end)}\n\n`;

    // Add Top Reactions section at the start
    markdown += '## Most Reacted Messages\n\n';
    insight.insights.forEach(chunk => {
      if (chunk.top_reactions?.length) {
        chunk.top_reactions.forEach((msg, index) => {
          markdown += `### ${index + 1}. Message\n`;
          markdown += `> ${msg.messageContent}\n\n`;
          markdown += '**Reactions:**\n';
          msg.reactions.forEach(r => {
            markdown += `- ${r.emoji}: ${r.count}\n`;
          });
          markdown += `\n[View in Discord](${msg.url})\n\n`;
        });
      }
    });
    markdown += '---\n\n';

    // Format each chunk as a separate section
    insight.insights.forEach((chunk, index) => {
      markdown += `## Analysis ${index + 1} (${formatDate(chunk.dateRange.start)} to ${formatDate(chunk.dateRange.end)})\n\n`;
      
      markdown += '### Summary\n';
      markdown += chunk.summary + '\n\n';

      markdown += '### Key Topics Discussed\n\n';
      chunk.key_topics.forEach(topic => {
        markdown += `#### ${topic.name}\n`;
        markdown += `- Description: ${topic.description}\n`;
        markdown += `- Participants: ${topic.participants.join(', ')}\n`;
        markdown += '- Key Points:\n';
        topic.key_points.forEach(point => {
          markdown += `  - ${point}\n`;
        });
        markdown += '\n';
      });

      markdown += '### Notable Interactions\n\n';
      chunk.notable_interactions.forEach(interaction => {
        markdown += `#### ${interaction.type}\n`;
        markdown += `- Description: ${interaction.description}\n`;
        markdown += `- Participants: ${interaction.participants.join(', ')}\n`;
        markdown += `- Impact: ${interaction.impact}\n\n`;
      });

      markdown += '### Emerging Trends\n\n';
      chunk.emerging_trends.forEach(trend => {
        markdown += `- ${trend}\n`;
      });

      markdown += '\n---\n\n';
    });

    return { markdown, filename: outputPath };
  }

  private groupReactions(reactions: any[]): Array<{ emoji: string, count: number }> {
    const counts = reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([emoji, count]) => ({
      emoji,
      count: count as number
    }));
  }
} 