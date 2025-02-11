import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';
import { TaskRewardService } from '../services/TaskRewardService';
import { CommunityRules, DEFAULT_COMMUNITY_RULES } from '../models/CommunityProfile';
import { getServerIdByName, getChannelIdsByName } from '../utils/communityHelpers';

// Use defaults or merge with custom settings
const communityRules: CommunityRules = {
  ...DEFAULT_COMMUNITY_RULES,
  // Override with custom settings as needed
};

async function analyzeTasksInChannels(
  startDate: Date,
  endDate: Date,
  serverNameOrId: string,
  channelNamesOrIds?: string[]
) {
  try {
    const serverId = getServerIdByName(serverNameOrId);
    if (!serverId) {
      console.error('Server not found:', serverNameOrId);
      return;
    }

    const channelIds = channelNamesOrIds 
      ? getChannelIdsByName(serverId, channelNamesOrIds)
      : undefined;

    const supabase = new SupabaseService();
    const taskService = new TaskRewardService(communityRules);
    
    console.log('Analyzing messages from:', startDate, 'to:', endDate);
    console.log('Server:', serverNameOrId);
    console.log('Channels:', channelNamesOrIds?.join(', ') || 'all channels');
    
    // Get messages for all specified channels
    const allMessages = [];
    if (channelIds?.length) {
      for (const channelId of channelIds) {
        const messages = await supabase.getMessagesByDateRange(
          startDate,
          endDate,
          serverId,
          channelId
        );
        allMessages.push(...messages);
      }
    } else {
      const messages = await supabase.getMessagesByDateRange(
        startDate,
        endDate,
        serverId
      );
      allMessages.push(...messages);
    }

    console.log(`Found ${allMessages.length} messages`);

    if (allMessages.length === 0) {
      console.log('No messages found for the specified criteria');
      return;
    }

    // Get user details
    const userIds = [...new Set(allMessages.map(m => m.user_id))];
    const users = await supabase.getUserDetails(userIds);

    // Get existing tasks (implement this based on your storage)
    const existingTasks: any[] = [];

    // Analyze tasks
    const analysis = await taskService.analyzeTasks(allMessages, users, existingTasks);
    
    // Format with all channel IDs
    const { markdown, filename } = taskService.formatToMarkdown(analysis, serverId, channelIds);
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync(filename, markdown);

    // Save JSON next to the markdown file
    const jsonPath = filename.replace('.md', '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
    
    console.log('\nAnalysis Results:');
    console.log(markdown);
    console.log(`\nResults saved to ${filename} and ${jsonPath}`);
  } catch (error) {
    console.error('Error analyzing messages:', error);
    process.exit(1);
  }
}

// Default values
const DEFAULT_SERVER_ID = '932238833146277958';
const DEFAULT_DAYS = 7;

// Update script arguments to handle multiple channels
const serverNameOrId = process.argv[2] || 'OPENFORMAT';  // Can now use name instead of ID
const channelNames = process.argv[3] ? process.argv[3].split(',').map(c => c.trim()) : ['all'];  // Default to 'all' channels
const days = parseInt(process.argv[4] || DEFAULT_DAYS.toString());

const endDate = new Date();
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - days);

(async () => {
  try {
    await analyzeTasksInChannels(startDate, endDate, serverNameOrId, channelNames);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})(); 