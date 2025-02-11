import { Badge, BadgeReward } from './badge';
import { SimpleToken } from './token';

export interface CommunityTokensResponse {
  badges: Badge[];
  tokens: SimpleToken[];
}

export interface GraphQLResponse {
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