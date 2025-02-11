export interface Evidence {
  message: string;
  channelName: string;
  timestamp: string;
}

export interface TaskRequirements {
  role: "team" | "builder" | "ambassador" | "member";
  skills: string[];
  access_level: "internal" | "trusted" | "public";
  experience_level: "beginner" | "intermediate" | "advanced";
}

export interface RewardGuidelines {
  min_points: number;
  max_points: number;
  monetary_thresholds?: {
    min_value: number;
    max_value: number;
    currency?: string;
  };
}

export interface SuggestedReward {
  points: number;
  badges?: string[];
  monetary_value?: number;
  reasoning: string;
}

export interface IdentifiedTask {
  description: string;
  type: string;
  evidence: Evidence[];
  requirements: TaskRequirements;
  suggested_reward: SuggestedReward;
}

export interface Contribution {
  contributor: string;
  description: string;
  impact: string;
  suggested_reward: Omit<SuggestedReward, 'monetary_value'>;
}

export interface TaskAnalysis {
  identified_tasks: IdentifiedTask[];
  contributions: Contribution[];
}