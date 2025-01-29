import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';
import { AnalyzerService } from '../services/AnalyzerService';

async function analyzeChannelMessages(
  startDate: Date,
  endDate: Date,
  serverId: string,
  channelId?: string
) {
  try {
    const supabase = new SupabaseService();
    const analyzer = new AnalyzerService();
    
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

    // Analyze messages
    const analysis = await analyzer.analyzeChat(messages, users);
    
    console.log('\nAnalysis Results:');
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('Error analyzing messages:', error);
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
    await analyzeChannelMessages(startDate, endDate, serverId, channelId);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})(); 