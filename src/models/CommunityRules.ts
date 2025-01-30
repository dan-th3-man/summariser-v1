export interface CommunityRules {
  point_system: {
    rules: string[];           // Flexible array of point-awarding rules
    badge_types: string[];     // Available badge categories
    monetary_rewards: boolean; // Whether monetary rewards are enabled
  };
  existing_badges: string[];   // List of all available badges
  reward_guidelines: {
    min_points: number;
    max_points: number;
    monetary_thresholds?: {    // Optional monetary rewards config
      min_value: number;
      max_value: number;
      currency?: string;       // Optional currency specification
    };
  };
  roles?: {                    // Optional role definitions
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
  custom_roles?: Record<string, {  // Optional custom roles
    description: string;
    permissions: string[];
  }>;
}

// Default configuration
export const DEFAULT_COMMUNITY_RULES: CommunityRules = {
  point_system: {
    rules: [
      "Points are awarded for valuable contributions",
      "Larger tasks receive more points",
      "Technical contributions are highly valued"
    ],
    badge_types: ["helper", "builder", "teacher", "innovator"],
    monetary_rewards: false
  },
  existing_badges: ["helper", "builder", "teacher", "innovator"],
  reward_guidelines: {
    min_points: 10,
    max_points: 500
  }
}; 