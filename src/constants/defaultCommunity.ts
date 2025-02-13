import { CommunityProfile } from '../types/community';

export const DEFAULT_COMMUNITY_PROFILE: CommunityProfile = {
  communityId: "0xeb2301ae1140758d543f899b218d0d462ca43e0d",
  name: "Web3 Music Community",
  description: "A community focused on empowering artists and fans through web3 technology.",
  mission_statement: "To revolutionize the music industry by connecting artists directly with fans through decentralized technology.",
  goals: [
    "Build tools that empower independent artists",
    "Create new ways for fans to support their favorite artists",
    "Foster collaboration between artists and web3 developers",
    "Educate artists and fans about web3 technology"
  ],

  target_participants: [
    {
      role: "artist",
      skills_needed: ["Music Creation", "Social Media", "Community Building"],
      experience_level: "Beginner-friendly"
    },
    {
      role: "fan",
      skills_needed: ["Music Appreciation", "Web3 Basics", "Social Engagement"],
      experience_level: "Beginner-friendly"
    },
    {
      role: "builder",
      skills_needed: ["Solidity", "TypeScript", "Music Industry Knowledge"],
      experience_level: "Intermediate"
    }
  ],

  point_system: {
    rules: [
      "Points are awarded for community engagement and support",
      "Artists earn points for sharing music and engaging with fans",
      "Fans earn points for supporting artists and providing feedback",
      "Builders earn points for developing tools and features"
    ],
    monetary_rewards: true
  },

  reward_guidelines: {
    reward_worthy_contributions: [
      "Artists sharing original music",
      "Meaningful feedback on artists' work",
      "Supporting other community members",
      "Contributing to web3 music tools",
      "Creating educational content about web3 music",
      "Organizing community events or listening sessions",
      "Bug reports and feature suggestions for music platforms"
    ],
    contribution_examples: [
      "An artist sharing their latest track with the community",
      "A fan providing detailed feedback on a new release",
      "A builder creating a tool for music NFT distribution",
      "Helping community members understand music NFTs",
      "Organizing a virtual listening party"
    ]
  },

  roles: {
    team: {
      description: "Core team members managing the community",
      permissions: ["admin", "moderate", "reward", "publish"]
    },
    artist: {
      description: "Musicians and creators sharing their work",
      permissions: ["share_music", "earn_rewards", "create_events"]
    },
    fan: {
      description: "Music enthusiasts supporting artists",
      permissions: ["support_artists", "participate", "earn_rewards"]
    },
    builder: {
      description: "Developers building web3 music tools",
      permissions: ["contribute", "review", "earn_rewards"]
    }
  },

  resources: {
    documentation: "https://docs.example.com",
    getting_started: "https://docs.example.com/start",
    contribution_guidelines: "https://docs.example.com/contribute",
    code_of_conduct: "https://docs.example.com/conduct"
  },

  communication_channels: {
    discord: "https://discord.gg/example",
    telegram: "https://t.me/example",
    forum: "https://forum.example.com"
  },

  // These will be populated from blockchain data
  current_available_rewards: {
    badges: [],
    tokens: []
  },
  recent_rewards: {
    badges: [],
    tokens: []
  }
}; 