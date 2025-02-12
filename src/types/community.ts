import { Badge, SimpleToken, BadgeReward, TokenReward } from './token';

export interface CommunityProfile {
  // Community identifier
  communityId: string;  // e.g., "0xeb2301ae1140758d543f899b218d0d462ca43e0d"
  
  // Basic community information
  name: string;
  description: string;
  mission_statement: string;
  goals: string[];
  
  // Community focus areas and target participants
  target_participants: Array<{
    role: string;            // e.g., "developer", "designer", "ambassador"
    skills_needed: string[]; // e.g., ["React", "TypeScript"] or ["UI/UX", "Figma"]
    experience_level: string;// e.g., "Beginner-friendly" or "3+ years experience"
  }>;

  // Active initiatives
  current_campaigns: Array<{
    name: string;
    description: string;
    start_date: string;
    end_date?: string;
    status: 'active' | 'upcoming' | 'completed';
  }>;

  // Community engagement system
  point_system: {
    rules: string[];
    monetary_rewards: boolean;
  };
  
  // Available and recent rewards (populated from tokenUtils functions)
  current_available_rewards: {
    badges: Badge[];
    tokens: SimpleToken[];
  };
  
  recent_rewards: {
    badges: BadgeReward[];
    tokens: TokenReward[];
  };
  
  reward_guidelines: {
    min_points: number;
    max_points: number;
    monetary_thresholds?: {
      min_value: number;
      max_value: number;
      currency?: string;
    };
  };

  // Role definitions
  roles?: {
    team?: RoleDefinition;
    builder?: RoleDefinition;
    ambassador?: RoleDefinition;
    member?: RoleDefinition;
  };
  
  // Additional community information
  communication_channels: {
    type: string;      // e.g., "Discord", "Slack", "Forum"
    url: string;
    primary: boolean;
  }[];
  
  resources: {
    documentation?: string;
    getting_started?: string;
    contribution_guidelines?: string;
    code_of_conduct?: string;
  };
}

interface RoleDefinition {
  description: string;
  permissions: string[];
}

export interface CommunityServer {
  name: string;
  channels: Record<string, string>;
} 