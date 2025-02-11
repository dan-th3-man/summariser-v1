export interface DateRange {
  start: Date;
  end: Date;
}

export interface TopReaction {
  messageContent: string;
  reactions: Array<{
    emoji: string;
    count: number;
  }>;
  url: string;
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
  top_reactions?: TopReaction[];
}

export interface CommunityInsight {
  insights: InsightChunk[];
  dateRange: DateRange;
  topReactedMessages?: TopReaction[];
} 