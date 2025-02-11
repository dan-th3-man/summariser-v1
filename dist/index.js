"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SupabaseService_1 = require("./services/SupabaseService");
const AnalyzerService_1 = require("./services/AnalyzerService");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // Load environment variables
async function main() {
    const supabase = new SupabaseService_1.SupabaseService();
    const analyzer = new AnalyzerService_1.AnalyzerService();
    try {
        const startDate = new Date('2024-01-01');
        const endDate = new Date();
        const discordServerId = '856517297141317643'; // Replace with your server ID
        const messages = await supabase.getMessagesByDateRange(startDate, endDate, discordServerId
        // roomId is optional, omitted here
        );
        const userIds = [...new Set(messages.map(m => m.user_id))];
        const users = await supabase.getUserDetails(userIds);
        const analysis = await analyzer.analyzeChat(messages, users);
        // Output results (could be to file, API response, etc.)
        console.log(JSON.stringify(analysis, null, 2));
    }
    catch (error) {
        console.error('Analysis failed:', error);
    }
}
main();
