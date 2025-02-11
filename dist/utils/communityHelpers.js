"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerIdByName = getServerIdByName;
exports.getChannelIdsByName = getChannelIdsByName;
exports.getServerAndChannelNames = getServerAndChannelNames;
const communities_1 = require("../constants/communities");
function getServerIdByName(nameOrId) {
    // If it's already an ID in our constants, return it
    if (communities_1.COMMUNITY_SERVERS[nameOrId])
        return nameOrId;
    // Search by name
    const server = Object.entries(communities_1.COMMUNITY_SERVERS).find(([_, data]) => data.name.toLowerCase() === nameOrId.toLowerCase());
    return server ? server[0] : null;
}
function getChannelIdsByName(serverId, channelNamesOrIds) {
    const server = communities_1.COMMUNITY_SERVERS[serverId];
    if (!server)
        return [];
    // If the first channel is "all", return all channel IDs for the server
    if (channelNamesOrIds.length === 1 && channelNamesOrIds[0].toLowerCase() === 'all') {
        return Object.keys(server.channels);
    }
    return channelNamesOrIds.map(nameOrId => {
        // If it's already an ID in our constants, return it
        if (server.channels[nameOrId])
            return nameOrId;
        // Search by name
        const channel = Object.entries(server.channels).find(([_, channelName]) => channelName.toLowerCase() === nameOrId.toLowerCase());
        return channel ? channel[0] : nameOrId;
    });
}
function getServerAndChannelNames(serverId, channelIds) {
    const server = communities_1.COMMUNITY_SERVERS[serverId];
    if (!server)
        return { serverName: serverId, channelNames: channelIds };
    const channelNames = channelIds?.map(id => server.channels[id] || id);
    return {
        serverName: server.name,
        channelNames
    };
}
