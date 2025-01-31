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

    const { data: reactions, error: reactionsError } = await this.client
      .from('memories')
      .select('*')
      .eq('type', 'messages')
      .contains('content', { source: 'discord' })
      .filter('content->text', 'like', '*<_*>: "*')  // Match emoji reaction pattern
      .neq('content->inReplyTo', null);
      
    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
      return {};
    }

    // Group reactions by message ID
    const reactionsByMessage: Record<string, any[]> = {};
    
    reactions?.forEach(reaction => {
      // Only process if it matches the emoji reaction pattern *<emoji>: "message"*
      const emojiMatch = reaction.content?.text?.match(/^\*<([^>]+)>: ".*"\*$/);
      if (emojiMatch && reaction.content?.inReplyTo && messageIds.includes(reaction.content.inReplyTo)) {
        const messageId = reaction.content.inReplyTo;
        const emoji = emojiMatch[1];
        
        if (!reactionsByMessage[messageId]) {
          reactionsByMessage[messageId] = [];
        }
        
        reactionsByMessage[messageId].push({
          emoji,
          url: reaction.content.url
        });
      }
    });

    // Debug logging
    console.log(`Found ${reactions?.length || 0} total reactions`);
    console.log(`Matched ${Object.keys(reactionsByMessage).length} messages with reactions`);
    Object.entries(reactionsByMessage).forEach(([msgId, reactions]) => {
      console.log(`Message ${msgId}: ${reactions.length} reactions:`, 
        reactions.map(r => r.emoji).join(', '));
    });
    
    return reactionsByMessage;
  }

  async debugReactions(serverId: string, channelId?: string): Promise<void> {
    // First get all memories that look like reactions
    const { data: possibleReactions, error } = await this.client
      .from('memories')
      .select('*')
      .eq('type', 'messages')
      .contains('content', { source: 'discord' })
      .filter('content->>text', 'ilike', '*<_*>: "*')  // Changed to ilike and content->>text
      .limit(10);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    // Filter for actual emoji reactions
    const emojiReactions = possibleReactions?.filter(r => 
      r.content?.text?.match(/^\*<[^>]+>: ".*"\*$/) && 
      r.content?.inReplyTo
    ) || [];

    console.log('Found emoji reactions:', emojiReactions.length);
    if (emojiReactions.length > 0) {
      console.log('Emoji reactions:', emojiReactions.map(r => ({
        emoji: r.content.text.match(/^\*<([^>]+)>:/)?.[1],
        inReplyTo: r.content.inReplyTo,
        fullText: r.content.text
      })));
    }
  }
} 