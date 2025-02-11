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
    apps: Array<{
      badges: Badge[];
      tokens: Array<{
        token: {
          id: string;
          name: string;
        }
      }>;
    }>;
  };
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
    const app = data.data?.apps[0];
    
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