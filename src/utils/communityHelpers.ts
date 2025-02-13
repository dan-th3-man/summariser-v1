import { COMMUNITY_SERVERS } from '../constants/communities';
import { Badge, SimpleToken, BadgeReward, TokenReward } from '../types/token';

export function getServerIdByName(nameOrId: string): string | null {
  // If it's already an ID in our constants, return it
  if (COMMUNITY_SERVERS[nameOrId]) return nameOrId;
  
  // Search by name
  const server = Object.entries(COMMUNITY_SERVERS).find(
    ([_, data]) => data.name.toLowerCase() === nameOrId.toLowerCase()
  );
  
  return server ? server[0] : null;
}

export function getChannelIdsByName(serverId: string, channelNamesOrIds: string[]): string[] {
  const server = COMMUNITY_SERVERS[serverId];
  if (!server) return [];
  
  // If the first channel is "all", return all channel IDs for the server
  if (channelNamesOrIds.length === 1 && channelNamesOrIds[0].toLowerCase() === 'all') {
    return Object.keys(server.channels);
  }
  
  return channelNamesOrIds.map(nameOrId => {
    // If it's already an ID in our constants, return it
    if (server.channels[nameOrId]) return nameOrId;
    
    // Search by name
    const channel = Object.entries(server.channels).find(
      ([_, channelName]) => channelName.toLowerCase() === nameOrId.toLowerCase()
    );
    
    return channel ? channel[0] : nameOrId;
  });
}

export function getServerAndChannelNames(serverId: string, channelIds?: string[]) {
  const server = COMMUNITY_SERVERS[serverId];
  if (!server) return { serverName: serverId, channelNames: channelIds };
  
  const channelNames = channelIds?.map(id => server.channels[id] || id);
  
  return {
    serverName: server.name,
    channelNames
  };
} 

export function formatAvailableRewards(badges: Badge[], tokens: SimpleToken[]): string {
  let prompt = `### Available Rewards - Use these to inform what rewards are currently able to be rewarded\n`;
  
  if (badges.length) {
    prompt += `\n#### Available Badges:\n`;
    badges.forEach(badge => {
      prompt += `- ${badge.name}: ${badge.description} (Awarded ${badge.totalAwarded} times)\n`;
    });
  }
  
  if (tokens.length) {
    prompt += `\n#### Available Tokens:\n`;
    tokens.forEach(token => {
      prompt += `- ${token.name}\n`;
    });
  }
  
  return prompt + '\n';
}

export function formatRecentRewards(badgeRewards: any[], tokenRewards: any[]): string {
  let output = '### Recent Rewards\n\n';
  
  output += '#### Recent Badge Awards:\n';
  badgeRewards.forEach(reward => {
    output += `- The ${reward.badgeName} badge was awarded to ${reward.userId}\n`;
    output += `  Reward ID: ${reward.rewardId}\n`;
    output += `  Metadata:\n`;
    Object.entries(reward).forEach(([key, value]) => {
      if (!['rewardId', 'userId', 'badgeName'].includes(key)) {
        output += `    - ${key}: ${value}\n`;
      }
    });
    output += '\n';
  });
  
  output += '#### Recent Token Awards:\n';
  tokenRewards.forEach(reward => {
    output += `- ${reward.tokenAmount} ${reward.tokenName} tokens awarded to ${reward.userId}\n`;
    output += `  Reason: ${reward.rewardId || 'No reason provided'}\n`;
    output += `  Metadata:\n`;
    Object.entries(reward).forEach(([key, value]) => {
      if (!['rewardId', 'userId', 'tokenName'].includes(key)) {
        output += `    - ${key}: ${value}\n`;
      }
    });
    output += '\n';
  });
  
  return output;
} 