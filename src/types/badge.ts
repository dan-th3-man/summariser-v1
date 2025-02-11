export interface Badge {
  id: string;
  name: string;
  description: string;
  totalAwarded: string;
}

export interface BadgeReward {
  rewardId: string;
  userId: string;
  badgeName: string;
  name: string;
  description: string;
}

export interface BadgeRewardResponse {
  rewards: BadgeReward[];
} 