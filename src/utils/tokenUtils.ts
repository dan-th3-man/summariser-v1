import { type Chain } from "../constants/chains";

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
  metadataURI: string;
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { communityAddress: communityId }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GraphQLResponse;
    console.log('Raw GraphQL Response:', JSON.stringify(data, null, 2));  // Debug log

    if (!data.data) {
      throw new Error(`Invalid GraphQL response: ${JSON.stringify(data)}`);
    }

    const app = data.data.apps[0];
    
    if (!app) {
      return {
        badges: [],
        tokens: []
      };
    }

    return {
      badges: app.badges || [],
      tokens: (app.tokens || []).map((t: any) => ({
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