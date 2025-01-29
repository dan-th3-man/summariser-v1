export function chunkMessages<T>(messages: T[], chunkSize: number = 20): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize));
  }
  return chunks;
}
