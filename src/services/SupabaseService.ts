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
      user_id: memory.userId,
      content: memory.content.text,
      created_at: memory.createdAt,
      channel_id: memory.content.url.split('/')[5], // Extract channel ID from URL
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
} 