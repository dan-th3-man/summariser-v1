import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';
import { CommunityInsightService } from '../services/CommunityInsightService';

async function generateCommunityInsights(
  startDate: Date,
  endDate: Date,
  serverId: string,
  channelId?: string
) {
  try {
    const supabase = new SupabaseService();
    const insightService = new CommunityInsightService();
    
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
    console.log(`Retrieved details for ${users.length} users`);

    // Generate insights
    const insights = await insightService.generateInsights(messages, users);
    
    // Convert to markdown
    const markdownInsights = insightService.formatToMarkdown(insights, serverId, channelId);
    
    // Output insights
    console.log('\nCommunity Insights:\n');
    console.log(markdownInsights.markdown);

    // Save both JSON and Markdown versions
    const fs = require('fs');
    const date = new Date().toISOString().split('T')[0];
    
    // Save JSON
    const jsonFilename = `insights-${serverId}-${date}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(insights, null, 2));
    console.log(`\nJSON insights saved to ${jsonFilename}`);
    
    // Save Markdown
    fs.writeFileSync(markdownInsights.filename, markdownInsights.markdown);
    console.log(`Markdown insights saved to ${markdownInsights.filename}`);

  } catch (error) {
    console.error('Error generating insights:', error);
    process.exit(1);
  }
}

// Default values
const DEFAULT_SERVER_ID = '932238833146277958';
const DEFAULT_DAYS = 7;

// Get command line arguments
const serverId = process.argv[2] || DEFAULT_SERVER_ID;
const channelId = process.argv[3]; // optional
const days = parseInt(process.argv[4] || DEFAULT_DAYS.toString());

const endDate = new Date();
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - days);

(async () => {
  try {
    await generateCommunityInsights(startDate, endDate, serverId, channelId);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})(); 