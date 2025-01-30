export interface ChatMessage {
  user_id: string;
  content: string;
  created_at: string;
  channel_id: string;
  // Add other necessary fields
}

export interface MemoryContent {
  url: string;
  text: string;
  source: string;
  attachments: any[];
}

export interface Memory {
  id: string;
  type: string;
  createdAt: string;
  content: MemoryContent;
  userId: string;
  agentId: string | null;
  roomId: string | null;
  unique: boolean;
}

export interface ChatQuestion {
  question: string;
  asker: string;
}

export interface ChatHelp {
  helper: string;
  recipient: string;
  task: string;
  assistance: string;
}

export type ActionItemType = 'Technical Tasks' | 'Documentation Needs' | 'Feature Requests';

export interface ActionItem {
  description: string;
  mentioned_by: string;
  type: ActionItemType;
}

export interface HelpInteraction {
  helper: string;
  recipient: string;
  task: string;
  assistance: string;
  suggested_points: number;
  reason: string;
}

export interface ChatAnalysis {
  summary: string;
  faq: Array<{ question: string; asker: string }>;
  help_interactions: HelpInteraction[];
  action_items: Array<{
    description: string;
    mentioned_by: string;
    type: string;
  }>;
}

interface DateRange {
  start: Date;
  end: Date;
}

export interface InsightChunk {
  summary: string;
  key_topics: Array<{
    name: string;
    description: string;
    participants: string[];
    key_points: string[];
  }>;
  notable_interactions: Array<{
    type: string;
    description: string;
    participants: string[];
    impact: string;
  }>;
  emerging_trends: string[];
  dateRange: DateRange;
}

export interface CommunityInsight {
  insights: InsightChunk[];
  dateRange: DateRange;
}

export interface TaskRequirements {
  role: "team" | "builder" | "ambassador" | "member";
  skills: string[];
  access_level: "internal" | "trusted" | "public";
  experience_level: "beginner" | "intermediate" | "advanced";
}

export interface IdentifiedTask {
  description: string;
  type: string;
  evidence: string[];
  requirements: TaskRequirements;
  suggested_reward: {
    points: number;
    badges?: string[];
    monetary_value?: number;
    reasoning: string;
  };
}

export interface TaskAnalysis {
  identified_tasks: IdentifiedTask[];
  contributions: Array<{
    contributor: string;
    description: string;
    impact: string;
    suggested_reward: {
      points: number;
      badges?: string[];
      reasoning: string;
    };
  }>;
}

export interface CommunityRules {
  point_system: {
    rules: string[];
    badge_types: string[];
    monetary_rewards: boolean;
  };
  existing_badges: string[];
  reward_guidelines: {
    min_points: number;
    max_points: number;
    monetary_thresholds?: {
      min_value: number;
      max_value: number;
    };
  };
} 