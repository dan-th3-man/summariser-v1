import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';
import { formatMessages } from '../utils/formatters';

async function getChannelMessages(
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

    // Get user details
    const userIds = [...new Set(messages.map(m => m.user_id))];
    console.log(`Found ${userIds.length} unique users`);
    
    const users = await supabase.getUserDetails(userIds);
    console.log(`Retrieved details for ${users.length} users`);

    // Format messages with usernames
    const formattedMessages = formatMessages(messages, users);
    console.log('\nFormatted Messages:');
    console.log(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
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

// Wrap the main execution in an IIFE with error handling
(async () => {
  try {
    await getChannelMessages(startDate, endDate, serverId, channelId);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})(); 