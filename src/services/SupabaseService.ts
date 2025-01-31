import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../models/types';

export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }

  async getMessagesByDateRange(
    startDate: Date, 
    endDate: Date, 
    discordServerId: string,
    channelId?: string  // Optional Discord channel ID
  ): Promise<ChatMessage[]> {
    let query = this.client
      .from('memories')
      .select('*')
      .eq('type', 'messages')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .contains('content', { source: 'discord' });

    // Filter by server ID and optionally channel ID
    if (channelId) {
      query = query.filter('content->>url', 'like', `%/channels/${discordServerId}/${channelId}/%`);
    } else {
      query = query.filter('content->>url', 'like', `%/channels/${discordServerId}/%`);
    }

    const { data, error } = await query;
    
    console.log('Query parameters:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      serverId: discordServerId,
      channelId: channelId
    });

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No data returned from query');
    } else {
      console.log(`Found ${data.length} messages`);
    }

    return data.map(memory => ({
      id: memory.id,
      user_id: memory.userId,
      content: memory.content.text,
      created_at: memory.createdAt,
      server_id: memory.content.url.split('/')[4],
      channel_id: memory.content.url.split('/')[5],
      channel_name: memory.content.channel_name || memory.content.channelName
    }));
  }

  async getUserDetails(userIds: string[]) {
    const { data, error } = await this.client
      .from('accounts')  // Using accounts table from your schema
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return data;
  }

  async getMessageReactions(messageIds: string[]): Promise<Record<string, any[]>> {
    console.log('Looking for reactions for message IDs:', messageIds);

    // Get all reactions that have inReplyTo in their content
    const { data: reactions, error: reactionsError } = await this.client
      .from('memories')
      .select('*')
      .eq('type', 'messages')  // All records are type 'messages'
      .contains('content', { source: 'discord' })
      .neq('content->inReplyTo', null);  // Has inReplyTo in content
      
    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return {};
    }

    console.log('Raw reactions found:', reactions.length);

    // Group reactions by message ID
    const reactionsByMessage: Record<string, any[]> = {};
    reactions.forEach(reaction => {
      // Check if it's an emoji reaction by looking for the pattern "*<emoji>: \"*"
      if (reaction.content?.text?.startsWith('*<') && 
          reaction.content?.text?.includes('>: "') && 
          reaction.content.inReplyTo && 
          messageIds.includes(reaction.content.inReplyTo)) {
        
        const messageId = reaction.content.inReplyTo;
        if (!reactionsByMessage[messageId]) {
          reactionsByMessage[messageId] = [];
        }
        
        // Extract emoji from "*<emoji>: \"text\"*" pattern
        const emojiMatch = reaction.content.text.match(/\*<(.+?)>:/);
        if (emojiMatch) {
          reactionsByMessage[messageId].push({
            emoji: emojiMatch[1],
            url: reaction.content.url
          });
        }
      }
    });

    console.log(`Found ${reactions.length} total reactions`);
    console.log(`Matched ${Object.keys(reactionsByMessage).length} messages with reactions`);
    Object.entries(reactionsByMessage).forEach(([messageId, reactions]) => {
      console.log(`Message ${messageId}: ${reactions.length} reactions`);
    });
    
    return reactionsByMessage;
  }
} 