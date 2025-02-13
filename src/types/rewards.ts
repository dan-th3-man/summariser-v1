import { BadgeReward, TokenReward } from './token';

export interface RewardMetadata {
  key: string;
  value: string;
}

export interface IdentifiedReward {
  discordName: string;
  rewardType: 'badge' | 'token';
  rewardName: string;
  amount: number;
  rewardId: string;
  reason: string;
  metadata: RewardMetadata[];
  evidence: {
    message: string;
    channelName: string;
    timestamp: string;
  }[];
}

export interface RewardAnalysis {
  identified_rewards: IdentifiedReward[];
} 