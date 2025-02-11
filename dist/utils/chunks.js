"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkMessages = chunkMessages;
function chunkMessages(messages, chunkSize = 20) {
    const chunks = [];
    for (let i = 0; i < messages.length; i += chunkSize) {
        chunks.push(messages.slice(i, i + chunkSize));
    }
    return chunks;
}
