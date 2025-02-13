import 'dotenv/config';
import { RewardIdentificationService } from '../services/RewardIdentificationService';
import { DEFAULT_COMMUNITY_PROFILE } from '../constants/defaultCommunity';
import { SupabaseService } from '../services/SupabaseService';
import { getServerIdByName, getChannelIdsByName, getServerAndChannelNames } from '../utils/communityHelpers';
import fs from 'fs/promises';

async function analyzeRewardsInChannels(
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

    const service = new RewardIdentificationService(DEFAULT_COMMUNITY_PROFILE);
    const supabase = new SupabaseService();
    
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

    const analysis = await service.analyzeContributions(allMessages, users);
    const csv = service.formatToCSV(analysis);

    // Use server and channel names in the filename
    const { serverName, channelNames } = getServerAndChannelNames(serverId, channelIds);
    const dateStr = startDate.toISOString().split('T')[0];
    const channelSuffix = channelNames?.length 
      ? `-${channelNames.map(name => name.toLowerCase().replace(/\s+/g, '-')).join('-')}` 
      : '';
    
    const filename = `rewards-${serverName}${channelSuffix}-${dateStr}.csv`;
    await fs.writeFile(filename, csv);
    
    console.log(`Analysis complete. Results written to ${filename}`);
    return { analysis, filename };
  } catch (error) {
    console.error('Error analyzing messages:', error);
    process.exit(1);
  }
}

// Default values from analyzeTasks.ts
const DEFAULT_SERVER_ID = '932238833146277958';
const DEFAULT_DAYS = 7;

const serverNameOrId = process.argv[2] || 'OPENFORMAT';
const channelNames = process.argv[3] ? process.argv[3].split(',').map(c => c.trim()) : ['all'];
const days = parseInt(process.argv[4] || DEFAULT_DAYS.toString());

const endDate = new Date();
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - days);

if (require.main === module) {
  analyzeRewardsInChannels(startDate, endDate, serverNameOrId, channelNames)
    .catch(console.error);
}

export { analyzeRewardsInChannels }; 