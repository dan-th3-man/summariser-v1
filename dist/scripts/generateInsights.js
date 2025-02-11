"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const SupabaseService_1 = require("../services/SupabaseService");
const CommunityInsightService_1 = require("../services/CommunityInsightService");
const communityHelpers_1 = require("../utils/communityHelpers");
async function generateCommunityInsights(startDate, endDate, serverNameOrId, channelNamesOrIds) {
    try {
        const serverId = (0, communityHelpers_1.getServerIdByName)(serverNameOrId);
        if (!serverId) {
            console.error('Server not found:', serverNameOrId);
            return;
        }
        const channelIds = channelNamesOrIds
            ? (0, communityHelpers_1.getChannelIdsByName)(serverId, channelNamesOrIds)
            : undefined;
        const supabase = new SupabaseService_1.SupabaseService();
        const insightService = new CommunityInsightService_1.CommunityInsightService();
        console.log('Analyzing messages from:', startDate, 'to:', endDate);
        console.log('Server:', serverNameOrId);
        console.log('Channels:', channelNamesOrIds?.join(', ') || 'all channels');
        // Get messages for all specified channels
        const allMessages = [];
        if (channelIds?.length) {
            for (const channelId of channelIds) {
                const messages = await supabase.getMessagesByDateRange(startDate, endDate, serverId, channelId);
                allMessages.push(...messages);
            }
        }
        else {
            const messages = await supabase.getMessagesByDateRange(startDate, endDate, serverId);
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
        console.log(`Retrieved details for ${users.length} users`);
        // Generate insights
        const insights = await insightService.generateInsights(allMessages, users);
        // Convert to markdown
        const markdownInsights = insightService.formatToMarkdown(insights, serverId, channelIds);
        // Save to file
        const fs = require('fs');
        fs.writeFileSync(markdownInsights.filename, markdownInsights.markdown);
        // Save JSON next to the markdown file
        const jsonPath = markdownInsights.filename.replace('.md', '.json');
        fs.writeFileSync(jsonPath, JSON.stringify(insights, null, 2));
        console.log('\nCommunity Insights:');
        console.log(markdownInsights.markdown);
        console.log(`\nResults saved to ${markdownInsights.filename} and ${jsonPath}`);
    }
    catch (error) {
        console.error('Error generating insights:', error);
        process.exit(1);
    }
}
// Parse command line arguments
const serverNameOrId = process.argv[2];
const channelNamesOrIds = process.argv[3]?.split(',').map(c => c.trim());
const days = parseInt(process.argv[4] || '7');
if (!serverNameOrId) {
    console.error('Please provide a server name or ID');
    process.exit(1);
}
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - days);
generateCommunityInsights(startDate, endDate, serverNameOrId, channelNamesOrIds);
