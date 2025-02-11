import { ChatMessage } from '../types/chat';

export function formatMessages(messages: ChatMessage[], users: Record<string, any>): string {
  return messages.map(msg => {
    const user = users.find((u: any) => u.id === msg.user_id);
    const username = user?.username || msg.user_id;
    return `[${new Date(msg.created_at).toISOString()}] ${username}: ${msg.content}`;
  }).join('\n');
}
