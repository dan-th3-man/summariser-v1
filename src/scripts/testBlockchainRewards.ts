import { DEFAULT_COMMUNITY_PROFILE } from '../constants/defaultCommunity';
import { generateCommunityContextPrompt } from '../utils/communityProfilePrompt';

async function testBlockchainRewards() {
  try {
    console.log('Testing with community ID:', DEFAULT_COMMUNITY_PROFILE.communityId);
    const prompt = await generateCommunityContextPrompt(DEFAULT_COMMUNITY_PROFILE);
    console.log('\nGenerated Prompt:\n', prompt);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBlockchainRewards().catch(console.error); 