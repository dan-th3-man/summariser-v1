import { SupabaseService } from './services/SupabaseService';
import { AnalyzerService } from './services/AnalyzerService';
import { config } from 'dotenv';

config(); // Load environment variables

async function main() {
  const supabase = new SupabaseService();
  const analyzer = new AnalyzerService();

  try {
    const startDate = new Date('2024-01-01');
    const endDate = new Date();
    
    const discordServerId = '856517297141317643'; // Replace with your server ID
    const messages = await supabase.getMessagesByDateRange(
      startDate, 
      endDate,
      discordServerId
      // roomId is optional, omitted here
    );
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const users = await supabase.getUserDetails(userIds);
    
    const analysis = await analyzer.analyzeChat(messages, users);
    
    // Output results (could be to file, API response, etc.)
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

main(); 