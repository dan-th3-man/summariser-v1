import 'dotenv/config';
import { SupabaseService } from '../services/SupabaseService';

async function debugReactions(serverId: string, channelId?: string) {
  const supabase = new SupabaseService();
  await supabase.debugReactions(serverId, channelId);
}

// Default values
const DEFAULT_SERVER_ID = '932238833146277958';

const serverId = process.argv[2] || DEFAULT_SERVER_ID;
const channelId = process.argv[3];

(async () => {
  try {
    await debugReactions(serverId, channelId);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
})(); 