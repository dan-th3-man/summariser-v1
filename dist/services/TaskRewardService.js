"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRewardService = void 0;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const chunks_1 = require("../utils/chunks");
const formatters_1 = require("../utils/formatters");
const communities_1 = require("../constants/communities");
const communityHelpers_1 = require("../utils/communityHelpers");
const fileHelpers_1 = require("../utils/fileHelpers");
class TaskRewardService {
    constructor(communityRules) {
        this.model = new openai_1.ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0.2,
            maxTokens: 2000,
        });
        this.communityRules = communityRules;
    }
    async analyzeTasks(messages, users, existingTasks = []) {
        const chunks = (0, chunks_1.chunkMessages)(messages, 50);
        const analyses = [];
        // Get date range for context
        const dates = messages.map(m => new Date(m.created_at));
        const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
        console.log(`Analyzing ${messages.length} messages for tasks...`);
        console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        for (const chunk of chunks) {
            const transcript = (0, formatters_1.formatMessages)(chunk, users);
            // Get channel names from our constants
            const messagesWithChannels = chunk.map(msg => {
                const user = users.find((u) => u.id === msg.user_id);
                const username = user?.username || user?.display_name || 'unknown';
                const serverData = communities_1.COMMUNITY_SERVERS[msg.server_id];
                const channelName = serverData?.channels[msg.channel_id];
                return {
                    message: msg.content,
                    timestamp: msg.created_at,
                    username: username,
                    channelName: channelName || msg.channel_name || msg.channel_id
                };
            });
            // Update the prompt to emphasize using exact channel names and usernames
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
4. Suggesting appropriate rewards based on community rules

Chat transcript with channel names and usernames:
${messagesWithChannels.map(m => `[${m.timestamp}] #${m.channelName} @${m.username}: ${m.message}`).join('\n')}

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
      "contributor": "@username",
      "description": "What they contributed",
      "impact": "Impact on community",
      "suggested_reward": {
        "points": 50,
        "badges": ["helper"],
        "reasoning": "Why this reward is suggested"
      }
    }
  ]
}`;
            const response = await this.model.call([new messages_1.HumanMessage(prompt)]);
            const content = typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
            try {
                // Clean the content before parsing
                const cleanContent = content
                    .replace(/```json\n?|```/g, '') // Remove code blocks
                    .trim(); // Remove whitespace
                const analysis = JSON.parse(cleanContent);
                analyses.push(analysis);
            }
            catch (error) {
                console.error('JSON Parse Error:', error);
                console.error('Failed to parse content:', content);
                throw error;
            }
        }
        return this.mergeTasks(analyses);
    }
    mergeTasks(analyses) {
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
    formatToMarkdown(analysis, serverId, channelIds) {
        const formatDate = (date) => date.toISOString().split('T')[0];
        const today = formatDate(new Date());
        const { serverName, channelNames } = (0, communityHelpers_1.getServerAndChannelNames)(serverId, channelIds);
        const channelSuffix = channelNames?.length
            ? `-${channelNames.map(name => name.toLowerCase().replace(/\s+/g, '-')).join('-')}`
            : '';
        const filename = `tasks${channelSuffix}-${today}.md`;
        const outputPath = (0, fileHelpers_1.getOutputPath)('tasks', serverName, filename);
        let markdown = `# Community Tasks and Contributions\n`;
        markdown += `## Server: ${serverName}\n`;
        if (channelNames?.length) {
            markdown += `## Channels: ${channelNames.join(', ')}\n`;
        }
        markdown += '\n';
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
        return { markdown, filename: outputPath };
    }
}
exports.TaskRewardService = TaskRewardService;
//TODO questions that never got answered
