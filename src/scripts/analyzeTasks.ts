import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';
import { TaskRewardService } from '../services/TaskRewardService';
import { CommunityRules, DEFAULT_COMMUNITY_RULES } from '../models/CommunityRules';

// Use defaults or merge with custom settings
const communityRules: CommunityRules = {
  ...DEFAULT_COMMUNITY_RULES,
  // Override with custom settings as needed
};

async function analyzeTasksInChannel(
  startDate: Date,
  endDate: Date,
  serverId: string,
  channelId?: string
) {
  try {
    const supabase = new SupabaseService();
    const taskService = new TaskRewardService(communityRules);
    
    console.log('Analyzing messages from:', startDate, 'to:', endDate);
    console.log('Server ID:', serverId);
    console.log('Channel ID:', channelId || 'all channels');
    
    // Get messages
    const messages = await supabase.getMessagesByDateRange(
      startDate,
      endDate,
      serverId,
      channelId
    );
    console.log(`Found ${messages.length} messages`);

    if (messages.length === 0) {
      console.log('No messages found for the specified criteria');
      return;
    }

    // Get user details
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const users = await supabase.getUserDetails(userIds);

    // Get existing tasks (implement this based on your storage)
    const existingTasks: any[] = [];

    // Analyze tasks
    const analysis = await taskService.analyzeTasks(messages, users, existingTasks);
    
    // Format and save results
    const { markdown, filename } = taskService.formatToMarkdown(analysis, serverId, channelId);
    
    // Save both formats
    const fs = require('fs');
    fs.writeFileSync(filename, markdown);
    fs.writeFileSync(filename.replace('.md', '.json'), JSON.stringify(analysis, null, 2));
    
    console.log('\nAnalysis Results:');
    console.log(markdown);
    console.log(`\nResults saved to ${filename} and ${filename.replace('.md', '.json')}`);
  } catch (error) {
    console.error('Error analyzing tasks:', error);
    process.exit(1);
  }
}

// Default values
const DEFAULT_SERVER_ID = '932238833146277958';
const DEFAULT_DAYS = 7;

// Get command line arguments
const serverId = process.argv[2] || DEFAULT_SERVER_ID;
const channelId = process.argv[3];
const days = parseInt(process.argv[4] || DEFAULT_DAYS.toString());

const endDate = new Date();
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - days);

(async () => {
  try {
    await analyzeTasksInChannel(startDate, endDate, serverId, channelId);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})(); 