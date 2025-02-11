import { ThirdwebStorage } from "@thirdweb-dev/storage";
import 'dotenv/config';

const THIRDWEB_SECRET = process.env.THIRDWEB_SECRET;
if (!THIRDWEB_SECRET) {
  throw new Error("THIRDWEB_SECRET environment variable is not set");
}

console.log("ThirdWeb Secret available:", !!THIRDWEB_SECRET);

const storage = new ThirdwebStorage({
  secretKey: THIRDWEB_SECRET, // Use the verified secret
});

interface TokenListProps {
    tokens: Token[];
  }

interface Token {
  id: string;
  token: {
    id: string;
    name: string;
    tokenType: 'Base' | 'Point';
    createdAt: string;
  }
}

interface Badge {
  id: string;
  name: string;
  description: string;
  totalAwarded: string;
}

interface SimpleToken {
  id: string;
  name: string;
}

interface CommunityTokensResponse {
  badges: Badge[];
  tokens: SimpleToken[];
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

interface BadgeReward {
  rewardId: string;
  userId: string;
  badgeName: string;
  name: string;
  description: string;
}

interface BadgeRewardResponse {
  rewards: BadgeReward[];
}

interface TokenReward {
  rewardId: string;
  userId: string;
  tokenName: string;
  tokenAmount: string;
}

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/82634/open-format-arbitrum-sepolia/v0.1.1";

export async function getCommunityTokens(communityId: string): Promise<CommunityTokensResponse> {
  try {
    const query = `
      query CreateBadgeList($communityAddress: ID!) {
        apps(where: {id: $communityAddress}){
          badges{
            id
            name
            metadataURI
            totalAwarded
          }
          tokens{
            token{
              id
              name
            }
          }
        }
      }
    `;

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: { communityAddress: communityId }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GraphQLResponse;
    const app = data.data?.apps?.[0];
    
    if (!app) {
      return {
        badges: [],
        tokens: []
      };
    }

    const badgesWithMetadata = await Promise.all(
      app.badges.map(async (badge: any) => {
        try {
          const metadata = await getMetadata(badge.metadataURI);
          return {
            id: badge.id,
            name: metadata.name,
            description: metadata.description,
            totalAwarded: badge.totalAwarded
          };
        } catch (error) {
          console.error(`Error fetching metadata for badge ${badge.id}:`, error);
          return {
            id: badge.id,
            name: badge.name,
            description: '',
            totalAwarded: badge.totalAwarded
          };
        }
      })
    );

    return {
      badges: badgesWithMetadata,
      tokens: app.tokens.map((t: any) => ({
        id: t.token.id,
        name: t.token.name
      }))
    };

  } catch (error) {
    console.error('Error fetching community tokens:', error);
    throw error;
  }
}

export function getTokenType(tokenType: 'Base' | 'Point'): string {
  const tokenTypes = {
    Base: "ERC20",
    Point: "Points",
  };
  return tokenTypes[tokenType];
} 

export async function getMetadata(ipfsHash: string) {
    const metadata = await storage.downloadJSON(ipfsHash);
  
    if (metadata.image) {
      const image = await storage.download(metadata.image);
      metadata.image = image.url;
    }
  
    return metadata;
  }

export async function getRecentBadgeRewards(communityId: string): Promise<BadgeReward[]> {
  try {
    const query = `
      query getRecentBadgeRewards {
        rewards(
          orderBy: createdAt, 
          orderDirection: desc, 
          first: 10, 
          where: {
            app: "${communityId}",
            badge_not: null
          }
        ) {
          rewardId
          user {
            id
          }
          metadataURI
          badge {
            name
          }
        }
      }
    `;

    console.log('Querying subgraph with:', {
      url: SUBGRAPH_URL,
      communityId,
      query
    });

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GraphQLResponse;
    console.log('Raw GraphQL Response:', JSON.stringify(data, null, 2));

    if (!data.data) {
      throw new Error(`Invalid GraphQL response: ${JSON.stringify(data)}`);
    }

    const rewards = data.data.rewards || [];
    
    // Fetch metadata for each reward and flatten the structure
    const rewardsWithMetadata = await Promise.all(
      rewards.map(async (reward: any) => {
        try {
          console.log('Fetching metadata for URI:', reward.metadataURI);
          const metadata = await getMetadata(reward.metadataURI);
          console.log('Fetched metadata:', metadata);
          
          return {
            rewardId: reward.rewardId,
            userId: reward.user.id,
            badgeName: reward.badge.name,
            ...metadata  // Spread all metadata key-value pairs into the object
          };
        } catch (error) {
          console.error(`Error fetching metadata for reward ${reward.rewardId}:`, error);
          return {
            rewardId: reward.rewardId,
            userId: reward.user.id,
            badgeName: reward.badge.name
          };
        }
      })
    );

    return rewardsWithMetadata;

  } catch (error) {
    console.error('Error fetching recent badge rewards:', error);
    throw error;
  }
}

export async function getRecentTokenRewards(communityId: string): Promise<TokenReward[]> {
  try {
    const query = `
      query getRecentTokenRewards {
        rewards(
          orderBy: createdAt, 
          orderDirection: desc, 
          first: 10, 
          where: {
            app: "${communityId}",
            token_not: null
          }
        ) {
          rewardId
          user {
            id
          }
          metadataURI
          token {
            name
          }
          tokenAmount
        }
      }
    `;

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GraphQLResponse;

    if (!data.data) {
      throw new Error(`Invalid GraphQL response: ${JSON.stringify(data)}`);
    }

    const rewards = data.data.rewards || [];
    
    // Fetch metadata for each reward and flatten the structure
    const rewardsWithMetadata = await Promise.all(
      rewards.map(async (reward: any) => {
        try {
          const metadata = await getMetadata(reward.metadataURI);
          
          return {
            rewardId: reward.rewardId,
            userId: reward.user.id,
            tokenName: reward.token.name,
            tokenAmount: (Number(reward.tokenAmount) / 1e18).toString(), // Convert Wei to Ether
            ...metadata
          };
        } catch (error) {
          console.error(`Error fetching metadata for reward ${reward.rewardId}:`, error);
          return {
            rewardId: reward.rewardId,
            userId: reward.user.id,
            tokenName: reward.token.name,
            tokenAmount: (Number(reward.tokenAmount) / 1e18).toString() // Convert Wei to Ether
          };
        }
      })
    );

    return rewardsWithMetadata;

  } catch (error) {
    console.error('Error fetching recent token rewards:', error);
    throw error;
  }
}