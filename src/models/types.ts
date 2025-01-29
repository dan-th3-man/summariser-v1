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