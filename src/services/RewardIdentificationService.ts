import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { ChatMessage } from '../types/chat';
import { IdentifiedReward, RewardAnalysis } from '../types/rewards';
import { chunkMessages } from '../utils/chunks';
import { formatMessages } from '../utils/formatters';
import { generateCommunityContextPrompt } from '../utils/communityProfilePrompt';
import { CommunityProfile } from '../types/community';

export class RewardIdentificationService {
  private model: ChatOpenAI;
  private communityProfile: CommunityProfile;

  constructor(communityProfile: CommunityProfile) {
    this.model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.2,
      maxTokens: 2000,
    });
    this.communityProfile = communityProfile;
  }

  async analyzeContributions(
    messages: ChatMessage[],
    users: Record<string, any>
  ): Promise<RewardAnalysis> {
    const chunks = chunkMessages(messages, 150);
    const analyses: RewardAnalysis[] = [];
    
    console.log(`Analyzing ${messages.length} messages in ${chunks.length} chunks`);
    const communityContext = await generateCommunityContextPrompt(this.communityProfile);
    console.log('Community Context:', communityContext);

    for (const chunk of chunks) {
      const transcript = formatMessages(chunk, users);
      console.log('\nAnalyzing chunk with messages:', chunk.length);
      console.log('Sample of transcript:', transcript.slice(0, 500));
      
      const prompt = `Analyze this Discord chat segment and identify contributions that deserve rewards.

Use the following community context to inform your analysis:
${communityContext}

Contribution Levels:
1. Basic Community Engagement (Token rewards: 1-5)
   - Welcoming new members
   - Regular participation in discussions
   - Sharing project updates
   - Supporting community initiatives

2. Meaningful Contributions (Token rewards: 5-20)
   - Detailed feedback or suggestions
   - Helping other community members
   - Contributing to discussions with valuable insights
   - Promoting community projects

3. Significant Contributions (Token/Badge rewards)
${this.communityProfile.reward_guidelines.reward_worthy_contributions.map(c => `   - ${c}`).join('\n')}

Examples:
${this.communityProfile.reward_guidelines.contribution_examples.map(c => `- ${c}`).join('\n')}

Focus on:
1. Identifying contributions at all levels, from basic engagement to significant impact
2. Matching contributions to appropriate rewards (badges for significant achievements, tokens for engagement)
3. Providing clear evidence and reasoning for each reward
4. Creating meaningful metadata about the contribution

If you are rewarding a badge, make sure the description of the badge matches the reason for the reward, otherwise simply reward the token.

IMPORTANT: Respond ONLY with a JSON object in the following format, with no additional text

Respond in this JSON format:
{
  "identified_rewards": [
    {
      "discordName": "@username",
      "rewardType": "badge|token",
      "rewardName": "name of badge or token",
      "amount": 1,
      "rewardId": "A simple description of the reward - must be less than 40 characters",
      "reason": "Clear explanation of why this reward is deserved",
      "metadata": [
        { "key": "contribution_type", "value": "code|documentation|community_support|etc" },
        { "key": "impact_level", "value": "high|medium|low" },
        { "key": "skill_demonstrated", "value": "specific skill shown" },
        { "key": "time_investment", "value": "approximate time spent" },
        { "key": "community_benefit", "value": "specific benefit to community" },
        { "key": "evidence", "value": "The exact message quote showing contribution" },
        { "key": "channel_name", "value": "The name of the channel where the contribution was made" }
      ]
    }
  ]
}

Chat transcript:
${transcript}`;


      const response = await this.model.invoke([new HumanMessage(prompt)]);
      console.log('Model response:', response);
      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
      const analysis = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
      analyses.push(analysis);
    }

    return this.mergeAnalyses(analyses);
  }

  private mergeAnalyses(analyses: RewardAnalysis[]): RewardAnalysis {
    const rewardMap = new Map<string, IdentifiedReward>();

    for (const analysis of analyses) {
      analysis.identified_rewards?.forEach(reward => {
        const key = `${reward.discordName}:${reward.rewardName}`;
        if (!rewardMap.has(key)) {
          rewardMap.set(key, reward);
        }
      });
    }

    return {
      identified_rewards: Array.from(rewardMap.values())
    };
  }

  formatToCSV(analysis: RewardAnalysis): string {
    // Get all unique metadata keys across all rewards
    const metadataKeys = new Set<string>();
    analysis?.identified_rewards?.forEach(reward => {
      reward.metadata?.forEach(m => metadataKeys.add(m.key));
    });

    const headers = [
      'Discord Name',
      'Reward Type',
      'Reward Name',
      'Amount',
      'Reward ID',
      'Reason',
      ...Array.from(metadataKeys),
    ].join(',');

    if (!analysis?.identified_rewards) {
      console.warn('No rewards identified in analysis');
      return headers;
    }

    const rows = analysis.identified_rewards.map(reward => {
      // Create a map of metadata for easy lookup
      const metadataMap = new Map(
        reward.metadata?.map(m => [m.key, m.value]) || []
      );

      return [
        reward.discordName,
        reward.rewardType,
        reward.rewardName,
        reward.amount,
        `"${reward.rewardId}"`,
        `"${reward.reason}"`,
        ...Array.from(metadataKeys).map(key => 
          `"${metadataMap.get(key) || ''}"`)
      ].join(',');
    });

    return [headers, ...rows].join('\n');
  }
} 