import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { chunkMessages } from '../utils/chunks';
import { formatMessages } from '../utils/formatters';
import { COMMUNITY_SERVERS } from '../constants/communities';
import { getServerAndChannelNames } from '../utils/communityHelpers';
import { getOutputPath } from '../utils/fileHelpers';
import { 
  TaskAnalysis, 
  RewardGuidelines,
  IdentifiedTask 
} from '../types/task';
import { ChatMessage } from '../types/chat';

export class TaskRewardService {
  private model: ChatOpenAI;
  private rewardGuidelines: RewardGuidelines;
  private availableBadges: string[];

  constructor(rewardGuidelines: RewardGuidelines, availableBadges: string[]) {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.2,
      maxTokens: 4000,  // Increased for consolidation
    });
    this.rewardGuidelines = rewardGuidelines;
    this.availableBadges = availableBadges;
  }

  async analyzeTasks(
    messages: ChatMessage[], 
    users: Record<string, any>,
    existingTasks: IdentifiedTask[] = []
  ): Promise<TaskAnalysis> {
    const chunks = chunkMessages(messages, 300);
    const analyses: TaskAnalysis[] = [];
    
    // Get date range for context
    const dates = messages.map(m => new Date(m.created_at));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    console.log(`Analyzing ${messages.length} messages for tasks...`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    for (const chunk of chunks) {
      const transcript = formatMessages(chunk, users);
      
      // Get channel names from our constants
      const messagesWithChannels = chunk.map(msg => {
        const serverData = COMMUNITY_SERVERS[msg.server_id];
        const channelName = serverData?.channels[msg.channel_id];
        
        return {
          message: msg.content,
          timestamp: msg.created_at,
          channelName: channelName || msg.channel_name || msg.channel_id
        };
      });

      // Update the prompt to use rewardGuidelines directly
      const prompt = `Analyze this Discord chat segment and identify potential tasks and contributions that could help the community.

For each task, specify:
1. Required role:
   - team: Internal team member with special access
   - builder: Experienced developer
   - ambassador: Community leader/moderator
   - member: General community member
2. Required skills (e.g., "TypeScript", "DevOps", "Discord API")
3. Access level needed:
   - internal: Requires internal system access
   - trusted: Requires verified trust level
   - public: Open to all members
4. Experience level:
   - beginner: Basic programming knowledge
   - intermediate: Solid development experience
   - advanced: Expert in relevant technologies

Community Context:

Existing Tasks:
${JSON.stringify(existingTasks, null, 2)}

Focus on:
1. Identifying concrete tasks or needs mentioned by community members
2. Recognizing valuable contributions that deserve rewards
3. Finding evidence of task requests or community needs
4. Suggesting appropriate rewards based on:
   - Task complexity and impact
   - Time/effort required
   - Value to the community
   - Alignment with community rules
Respond in this JSON format:
{
  "identified_tasks": [
    {
      "description": "Task description",
      "type": "Feature|Documentation|Support|Infrastructure",
      "evidence": [
        {
          "message": "Message quote",
          "timestamp": "ISO timestamp",
          "channelName": "channel name"
        }
      ],
      "requirements": {
        "role": "team|builder|ambassador|member",
        "skills": ["required skill 1", "required skill 2"],
        "access_level": "internal|trusted|public",
        "experience_level": "beginner|intermediate|advanced"
      },
      "suggested_reward": {
        "points": 100,
        "badges": ["badge_name"],
        "monetary_value": 50,
        "reasoning": "Why this reward level is appropriate"
      }
    }
  ],
  "contributions": [
    {
      "contributor": "username",
      "description": "What they contributed",
      "impact": "Impact on community",
      "suggested_reward": {
        "points": 50,
        "badges": ["helper"],
        "reasoning": "Why this reward is suggested"
      }
    }
  ]
}

Reward Guidelines:
- Points: Scale from ${this.rewardGuidelines.min_points} to ${this.rewardGuidelines.max_points}
- Badges: Use from available list: ${this.availableBadges.join(', ')}
${this.rewardGuidelines.monetary_thresholds ? 
  `- Monetary rewards: $${this.rewardGuidelines.monetary_thresholds.min_value} to $${this.rewardGuidelines.monetary_thresholds.max_value}` : 
  '- No monetary rewards available'}

Chat transcript with channel names:
${messagesWithChannels.map(m => `[${m.timestamp}] #${m.channelName}: ${m.message}`).join('\n')}`;

      const response = await this.model.invoke([new HumanMessage(prompt)]);
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      const analysis = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
      analyses.push(analysis);
    }

    // If we have multiple chunks, consolidate them
    if (chunks.length > 1) {
      return await this.consolidateTaskAnalyses(analyses);
    }

    return analyses[0];
  }

  private async consolidateTaskAnalyses(analyses: TaskAnalysis[]): Promise<TaskAnalysis> {
    const analysesJson = JSON.stringify(analyses, null, 2);
    
    const prompt = `You are analyzing multiple chunks of community task analyses and need to consolidate them into a single coherent summary.
    
Review these separate analysis chunks and create a unified summary that:
1. Combines similar tasks and removes duplicates
2. Merges evidence from related tasks
3. Consolidates contribution records for the same contributors
4. Ensures reward suggestions are consistent across similar tasks
5. Maintains the most detailed requirements and evidence

Previous analyses:
${analysesJson}

Respond in the same JSON format as the input chunks, but provide a consolidated view that:
- Combines similar tasks with merged evidence
- Aggregates contributions from the same users
- Maintains consistent reward levels for similar work
- Preserves all relevant evidence and context`;

    const response = await this.model.invoke([new HumanMessage(prompt)]);
    
    try {
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      
      return JSON.parse(content.replace(/```json\n?|```/g, '').trim());
    } catch (e) {
      console.error("Failed to consolidate task analyses:", e);
      // Return merged tasks using simple method as fallback
      return this.mergeTasks(analyses);
    }
  }

  private mergeTasks(analyses: TaskAnalysis[]): TaskAnalysis {
    const taskMap = new Map();
    const contributionMap = new Map();

    for (const analysis of analyses) {
      // Merge tasks
      analysis.identified_tasks?.forEach(task => {
        const key = `${task.description}:${task.type}`;
        if (!taskMap.has(key)) {
          taskMap.set(key, task);
        }
      });

      // Merge contributions
      analysis.contributions?.forEach(contribution => {
        const key = `${contribution.contributor}:${contribution.description}`;
        if (!contributionMap.has(key)) {
          contributionMap.set(key, contribution);
        }
      });
    }

    return {
      identified_tasks: Array.from(taskMap.values()),
      contributions: Array.from(contributionMap.values())
    };
  }

  formatToMarkdown(analysis: TaskAnalysis, serverNameOrId: string, channelIds?: string[]): { markdown: string, filename: string } {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const today = formatDate(new Date());
    
    // Try to get server name from constants, fallback to ID if not found
    const serverData = COMMUNITY_SERVERS[serverNameOrId];
    const serverName = serverData?.name || serverNameOrId;
    
    let channelNames: string[] | undefined;
    if (channelIds) {
      channelNames = channelIds.map(channelId => {
        const channelName = serverData?.channels[channelId];
        return channelName || channelId;
      });
    }
    
    const channelSuffix = channelNames?.length 
      ? `-${channelNames.map(name => name.toLowerCase().replace(/\s+/g, '-')).join('-')}` 
      : '';
    
    const filename = `tasks${channelSuffix}-${today}.md`;
    const outputPath = getOutputPath('tasks', serverName, filename);
    
    let markdown = `# Community Tasks and Contributions\n`;
    if (channelNames?.length) {
      markdown += `## Channels: ${channelNames.join(', ')}\n`;
    }
    markdown += '\n';

    // Add null check for identified_tasks
    if (analysis?.identified_tasks?.length) {
      markdown += '## Identified Tasks\n\n';
      analysis.identified_tasks.forEach(task => {
        markdown += `### ${task.type}: ${task.description}\n`;
        markdown += '#### Requirements:\n';
        markdown += `- Role: ${task.requirements.role}\n`;
        markdown += `- Skills: ${task.requirements.skills.join(', ')}\n`;
        markdown += `- Access Level: ${task.requirements.access_level}\n`;
        markdown += `- Experience: ${task.requirements.experience_level}\n\n`;
        markdown += '#### Evidence:\n';
        task.evidence.forEach(evidence => {
          markdown += `> [${evidence.timestamp}] #${evidence.channelName}: ${evidence.message}\n`;
        });
        markdown += '\n#### Suggested Reward:\n';
        markdown += `- Points: ${task.suggested_reward.points}\n`;
        if (task.suggested_reward.badges?.length) {
          markdown += `- Badges: ${task.suggested_reward.badges.join(', ')}\n`;
        }
        if (task.suggested_reward.monetary_value) {
          markdown += `- Monetary Value: $${task.suggested_reward.monetary_value}\n`;
        }
        markdown += `- Reasoning: ${task.suggested_reward.reasoning}\n\n`;
      });
    } else {
      markdown += '## No Tasks Identified\n\n';
    }

    // Add null check for contributions
    if (analysis?.contributions?.length) {
      markdown += '## Notable Contributions\n\n';
      analysis.contributions.forEach(contribution => {
        markdown += `### Contribution by ${contribution.contributor}\n`;
        markdown += `- Description: ${contribution.description}\n`;
        markdown += `- Impact: ${contribution.impact}\n`;
        markdown += '#### Suggested Reward:\n';
        markdown += `- Points: ${contribution.suggested_reward.points}\n`;
        if (contribution.suggested_reward.badges?.length) {
          markdown += `- Badges: ${contribution.suggested_reward.badges.join(', ')}\n`;
        }
        markdown += `- Reasoning: ${contribution.suggested_reward.reasoning}\n\n`;
      });
    }

    return { markdown, filename: outputPath };
  }
} 
//TODO questions that never got answered