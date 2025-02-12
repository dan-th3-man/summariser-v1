import { Badge, SimpleToken, BadgeReward, TokenReward } from '../types/token';

export function formatAvailableRewards(badges: Badge[], tokens: SimpleToken[]): string {
  let prompt = `## Available Rewards\n`;
  
  if (badges.length) {
    prompt += `Available Badges:\n`;
    badges.forEach(badge => {
      prompt += `- ${badge.name}: ${badge.description} (Awarded ${badge.totalAwarded} times)\n`;
    });
  }
  
  if (tokens.length) {
    prompt += `\nAvailable Tokens:\n`;
    tokens.forEach(token => {
      prompt += `- ${token.name}\n`;
    });
  }
  
  return prompt + '\n';
}

export function formatRecentRewards(badgeRewards: BadgeReward[], tokenRewards: TokenReward[]): string {
  let prompt = `## Recent Reward Activity\n`;
  
  if (badgeRewards.length) {
    prompt += `Recent Badge Awards:\n`;
    badgeRewards.slice(0, 5).forEach(reward => {
      prompt += `- ${reward.badgeName} awarded for: ${reward.description}\n`;
    });
  }
  
  if (tokenRewards.length) {
    prompt += `\nRecent Token Awards:\n`;
    tokenRewards.slice(0, 5).forEach(reward => {
      prompt += `- ${reward.tokenAmount} ${reward.tokenName} awarded to ${reward.userId}\n`;
    });
  }
  
  return prompt + '\n';
} 