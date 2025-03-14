import { CommunityProfile } from '../types/community';
import { getCommunityTokens, getRecentBadgeRewards, getRecentTokenRewards } from './tokenUtils';
import { formatAvailableRewards, formatRecentRewards } from './communityHelpers';

export async function generateCommunityContextPrompt(profile: CommunityProfile): Promise<string> {
  let prompt = `Community Context for ${profile.name}\n\n`;

  // Basic Information
  prompt += `## Basic Information\n`;
  prompt += `${profile.description}\n\n`;
  prompt += `Mission: ${profile.mission_statement}\n\n`;
  prompt += `Goals:\n${profile.goals.map(goal => `- ${goal}`).join('\n')}\n\n`;

  // Target Participants
  if (profile.target_participants?.length) {
    prompt += `## Target Participants\n`;
    profile.target_participants.forEach(participant => {
      prompt += `Role: ${participant.role}\n`;
      prompt += `Required Skills: ${participant.skills_needed.join(', ')}\n`;
      prompt += `Experience Level: ${participant.experience_level}\n\n`;
    });
  }

  // Active Campaigns
  if (profile.current_campaigns?.length) {
    prompt += `## Active Initiatives\n`;
    profile.current_campaigns.forEach(campaign => {
      prompt += `${campaign.name} (${campaign.status})\n`;
      prompt += `${campaign.description}\n`;
      prompt += `Started: ${campaign.start_date}\n`;
      if (campaign.end_date) prompt += `Ends: ${campaign.end_date}\n`;
      prompt += '\n';
    });
  }

  // Reward System
  prompt += `## Reward System\n`;

    // Fetch and format blockchain rewards data
    try {
      console.log('Fetching blockchain rewards data...');
      const [communityTokens, recentBadgeRewards, recentTokenRewards] = await Promise.all([
        getCommunityTokens(profile.communityId),
        getRecentBadgeRewards(profile.communityId),
        getRecentTokenRewards(profile.communityId)
      ]);

    // Only add blockchain data if we actually got results
    if (communityTokens?.badges?.length || communityTokens?.tokens?.length) {
      prompt += formatAvailableRewards(
        communityTokens.badges || [],
        communityTokens.tokens || []
      );
    }

    if (recentBadgeRewards?.length || recentTokenRewards?.length) {
      prompt += formatRecentRewards(
        recentBadgeRewards || [],
        recentTokenRewards || []
      );
    }

  } catch (error) {
    console.error('Error fetching blockchain rewards data:', error);
    prompt += '## Rewards\nUnable to fetch current reward information\n\n';
  }

  // Role Definitions
  if (profile.roles) {
    prompt += `## Community Roles\n`;
    Object.entries(profile.roles).forEach(([role, details]) => {
      if (details) {
        prompt += `${role}:\n`;
        prompt += `${details.description}\n`;
        prompt += `Permissions: ${details.permissions.join(', ')}\n\n`;
      }
    });
  }

  // Resources
  if (profile.resources) {
    prompt += `## Available Resources\n`;
    Object.entries(profile.resources).forEach(([key, url]) => {
      if (url) prompt += `- ${key.replace(/_/g, ' ').toUpperCase()}: ${url}\n`;
    });
  }

  return prompt;
} 