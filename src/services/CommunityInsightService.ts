import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ChatMessage, CommunityInsight, InsightChunk } from '../models/types';
import { chunkMessages } from '../utils/chunks';
import { formatMessages } from '../utils/formatters';

export class CommunityInsightService {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.2,
      maxTokens: 2000,  // Increased for larger chunks
    });
  }

  async generateInsights(messages: ChatMessage[], users: Record<string, any>): Promise<CommunityInsight> {
    const chunks = chunkMessages(messages, 100);  // Increased to 100 messages per chunk
    const insights: InsightChunk[] = [];
    
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

    return {
      insights,
      dateRange: {
        start: startDate,
        end: endDate
      }
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

  formatToMarkdown(insight: CommunityInsight, serverId: string, channelId?: string): { markdown: string, filename: string } {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const filename = `insights-${serverId}${channelId ? `-${channelId}` : ''}-${formatDate(insight.dateRange.start)}-to-${formatDate(insight.dateRange.end)}.md`;
    
    let markdown = `# Community Insights\n`;
    markdown += `## Server: ${serverId}${channelId ? `\n## Channel: ${channelId}` : ''}\n`;
    markdown += `## Date Range: ${formatDate(insight.dateRange.start)} to ${formatDate(insight.dateRange.end)}\n\n`;

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

    return { markdown, filename };
  }
} 