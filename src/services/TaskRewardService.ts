import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ChatMessage, TaskAnalysis, CommunityRules } from '../models/types';
import { chunkMessages } from '../utils/chunks';
import { formatMessages } from '../utils/formatters';

export class TaskRewardService {
  private model: ChatOpenAI;
  private communityRules: CommunityRules;

  constructor(communityRules: CommunityRules) {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.2,
      maxTokens: 2000,
    });
    this.communityRules = communityRules;
  }

  async analyzeTasks(
    messages: ChatMessage[], 
    users: Record<string, any>,
    existingTasks: any[]
  ): Promise<TaskAnalysis> {
    const chunks = chunkMessages(messages, 100);  // Increased chunk size for better context
    const analyses: TaskAnalysis[] = [];
    
    // Get date range for context
    const dates = messages.map(m => new Date(m.created_at));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    console.log(`Analyzing ${messages.length} messages for tasks...`);
    console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} messages)`);
      const transcript = formatMessages(chunks[i], users);
      const analysis = await this.analyzeChunk(transcript, existingTasks);
      analyses.push(analysis);
    }

    return this.mergeTasks(analyses);
  }

  private async analyzeChunk(transcript: string, existingTasks: any[]): Promise<TaskAnalysis> {
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
${JSON.stringify(this.communityRules, null, 2)}

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
      "evidence": ["Message quotes showing need/request"],
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
- Points: Scale from ${this.communityRules.reward_guidelines.min_points} to ${this.communityRules.reward_guidelines.max_points}
- Badges: Use from available list: ${this.communityRules.existing_badges.join(', ')}
${this.communityRules.reward_guidelines.monetary_thresholds ? 
  `- Monetary rewards: $${this.communityRules.reward_guidelines.monetary_thresholds.min_value} to $${this.communityRules.reward_guidelines.monetary_thresholds.max_value}` : 
  '- No monetary rewards available'}

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
      return JSON.parse(content) as TaskAnalysis;
    } catch (e) {
      console.error("Failed to parse analysis response:", e);
      return {
        identified_tasks: [],
        contributions: []
      };
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

  formatToMarkdown(analysis: TaskAnalysis, serverId: string, channelId?: string): { markdown: string, filename: string } {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const today = formatDate(new Date());
    const filename = `tasks-${serverId}${channelId ? `-${channelId}` : ''}-${today}.md`;
    
    let markdown = `# Community Tasks and Contributions\n`;
    markdown += `## Server: ${serverId}${channelId ? `\n## Channel: ${channelId}` : ''}\n\n`;

    // Tasks Section
    markdown += '## Identified Tasks\n\n';
    analysis.identified_tasks.forEach(task => {
      markdown += `### ${task.type}: ${task.description}\n`;
      markdown += '#### Requirements:\n';
      markdown += `- Role: ${task.requirements.role}\n`;
      markdown += `- Skills: ${task.requirements.skills.join(', ')}\n`;
      markdown += `- Access Level: ${task.requirements.access_level}\n`;
      markdown += `- Experience: ${task.requirements.experience_level}\n\n`;
      markdown += '#### Evidence:\n';
      task.evidence.forEach(quote => {
        markdown += `> ${quote}\n`;
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

    // Contributions Section
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

    return { markdown, filename };
  }
} 