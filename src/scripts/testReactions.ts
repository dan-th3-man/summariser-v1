import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';

async function testReactions(
  startDate: Date,
  endDate: Date,
  serverId: string,
  channelId?: string
) {
  try {
    const supabase = new SupabaseService();
    
    console.log('Fetching messages from:', startDate, 'to:', endDate);
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

    // Get reactions for these messages
    const messageIds = messages.map(m => m.id);
    const reactions = await supabase.getMessageReactions(messageIds);
    
    // Log results
    console.log('\nReaction Analysis:');
    Object.entries(reactions).forEach(([messageId, messageReactions]) => {
      const message = messages.find(m => m.id === messageId);
      if (message && messageReactions.length > 0) {
        console.log('\nMessage:', message.content.substring(0, 100) + '...');
        console.log('Reactions:', messageReactions);
      }
    });

  } catch (error) {
    console.error('Error testing reactions:', error);
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
    await testReactions(startDate, endDate, serverId, channelId);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})(); 