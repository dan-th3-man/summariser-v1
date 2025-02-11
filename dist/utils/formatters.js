"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMessages = formatMessages;
function formatMessages(messages, users) {
    return messages.map(msg => {
        const user = users.find((u) => u.id === msg.user_id);
        const username = user?.username || msg.user_id;
        return `[${new Date(msg.created_at).toISOString()}] ${username}: ${msg.content}`;
    }).join('\n');
}
