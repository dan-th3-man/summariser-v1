export interface CommunityProfile {
  name: string;
  description: string;
  mission_statement: string;
  goals: string[];
  
  target_participants: Array<{
    role: string;
    skills_needed: string[];
    experience_level: string;
  }>;

  current_campaigns: Array<{
    name: string;
    description: string;
    start_date: string;
    end_date?: string;
    status: 'active' | 'upcoming' | 'completed';
  }>;

  point_system: {
    rules: string[];
    monetary_rewards: boolean;
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

  roles?: {
    team?: RoleDefinition;
    builder?: RoleDefinition;
    ambassador?: RoleDefinition;
    member?: RoleDefinition;
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