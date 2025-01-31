import { COMMUNITY_SERVERS } from '../constants/communities';

export function getServerIdByName(nameOrId: string): string | null {
  // If it's already an ID in our constants, return it
  if (COMMUNITY_SERVERS[nameOrId]) return nameOrId;
  
  // Search by name
  const server = Object.entries(COMMUNITY_SERVERS).find(
    ([_, data]) => data.name.toLowerCase() === nameOrId.toLowerCase()
  );
  
  return server ? server[0] : null;
}

export function getChannelIdsByName(serverId: string, channelNamesOrIds: string[]): string[] {
  const server = COMMUNITY_SERVERS[serverId];
  if (!server) return [];
  
  // If the first channel is "all", return all channel IDs for the server
  if (channelNamesOrIds.length === 1 && channelNamesOrIds[0].toLowerCase() === 'all') {
    return Object.keys(server.channels);
  }
  
  return channelNamesOrIds.map(nameOrId => {
    // If it's already an ID in our constants, return it
    if (server.channels[nameOrId]) return nameOrId;
    
    // Search by name
    const channel = Object.entries(server.channels).find(
      ([_, channelName]) => channelName.toLowerCase() === nameOrId.toLowerCase()
    );
    
    return channel ? channel[0] : nameOrId;
  });
}

export function getServerAndChannelNames(serverId: string, channelIds?: string[]) {
  const server = COMMUNITY_SERVERS[serverId];
  if (!server) return { serverName: serverId, channelNames: channelIds };
  
  const channelNames = channelIds?.map(id => server.channels[id] || id);
  
  return {
    serverName: server.name,
    channelNames
  };
} 