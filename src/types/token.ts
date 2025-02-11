export interface Badge {
  id: string;
  name: string;
  description: string;
  totalAwarded: string;
}

export interface SimpleToken {
  id: string;
  name: string;
}

export interface CommunityTokensResponse {
  badges: Badge[];
  tokens: SimpleToken[];
}

export interface BadgeReward {
  rewardId: string;
  userId: string;
  badgeName: string;
  name: string;
  description: string;
}

export interface Token {
  id: string;
  token: {
    id: string;
    name: string;
    tokenType: 'Base' | 'Point';
    createdAt: string;
  }
}

export interface TokenReward {
  rewardId: string;
  userId: string;
  tokenName: string;
  tokenAmount: string;
}

interface GraphQLResponse {
  data: {
    apps?: Array<{
      badges: Badge[];
      tokens: Array<{
        token: {
          id: string;
          name: string;
        }
      }>;
    }>;
    rewards?: BadgeReward[];
  };
}

interface BadgeRewardResponse {
  rewards: BadgeReward[];
} 