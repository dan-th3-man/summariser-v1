export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  server_id: string;
  channel_id: string;
  channel_name?: string;
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

export interface ChatAnalysis {
  summary: string;
  faq: Array<ChatQuestion>;
  help_interactions: HelpInteraction[];
  action_items: Array<{
    description: string;
    mentioned_by: string;
    type: string;
  }>;
}

export interface HelpInteraction {
  helper: string;
  recipient: string;
  task: string;
  assistance: string;
  suggested_points: number;
  reason: string;
} 