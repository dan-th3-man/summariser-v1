import { Badge } from '../types/badge';
import { SimpleToken } from '../types/token';

export interface CommunityProfile {
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
  current_available_rewards: {
    badges: Badge[];
    tokens: SimpleToken[];
  };

  // Role definitions
  roles?: {
    team?: {
      description: string;
      permissions: string[];
    };
    builder?: {
      description: string;
      permissions: string[];
    };
    ambassador?: {
      description: string;
      permissions: string[];
    };
    member?: {
      description: string;
      permissions: string[];
    };
  };
  
  custom_roles?: Record<string, {
    description: string;
    permissions: string[];
  }>;

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

// Default configuration
export const DEFAULT_COMMUNITY_PROFILE: CommunityProfile = {
  name: "Default Community",
  description: "A welcoming community for collaboration and growth",
  mission_statement: "Building together for a better future",
  goals: [
    "Foster an inclusive environment for collaboration",
    "Develop innovative solutions",
    "Support member growth and learning"
  ],
  
  target_participants: [{
    role: "developer",
    skills_needed: ["Programming", "Git", "Web Development"],
    experience_level: "All levels welcome"
  }, {
    role: "designer",
    skills_needed: ["UI/UX", "Figma", "Visual Design"],
    experience_level: "2+ years experience"
  }, {
    role: "community builder",
    skills_needed: ["Communication", "Event Planning", "Community Management"],
    experience_level: "Beginner-friendly"
  }],

  current_campaigns: [{
    name: "Welcome Campaign",
    description: "Onboarding new members and introducing community features",
    start_date: new Date().toISOString(),
    status: 'active'
  }],

  current_available_rewards: {
    badges: [],
    tokens: [],
  },

  communication_channels: [{
    type: "Discord",
    url: "https://discord.gg/defaultcommunity",
    primary: true
  }],

  resources: {
    getting_started: "/docs/getting-started",
    contribution_guidelines: "/docs/contributing",
    code_of_conduct: "/docs/code-of-conduct"
  }
}; 