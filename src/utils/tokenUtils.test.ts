import 'dotenv/config';
import { getCommunityTokens, getRecentBadgeRewards, getRecentTokenRewards } from './tokenUtils';

async function testGetCommunityTokens() {
  try {
    // This is an example community address - replace with a real one from your system
    const communityId = "0xeb2301ae1140758d543f899b218d0d462ca43e0d";
    
    console.log("Fetching tokens for community:", communityId);
    const result = await getCommunityTokens(communityId);
    
    console.log("\nBadges found:", result.badges.length);
    console.log("\nTokens found:", result.tokens.length);
    console.log("\nFull result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

async function testGetRecentBadgeRewards() {
  try {
    const communityId = "0xeb2301ae1140758d543f899b218d0d462ca43e0d";
    const rewards = await getRecentBadgeRewards(communityId);

    console.log("\nRecent Badge Rewards:");
    console.log(JSON.stringify(rewards, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

async function testGetRecentTokenRewards() {
    try {
      const communityId = "0xeb2301ae1140758d543f899b218d0d462ca43e0d";
      const rewards = await getRecentTokenRewards(communityId);
  
      console.log("\nRecent Token Rewards:");
      console.log(JSON.stringify(rewards, null, 2));
    } catch (error) {
      console.error("Test failed:", error);
    }
  }

// Run the test
//testGetCommunityTokens(); 
//testGetRecentBadgeRewards();
testGetRecentTokenRewards();