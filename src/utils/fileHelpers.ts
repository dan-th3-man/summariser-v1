import * as fs from 'fs';
import * as path from 'path';

export function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getOutputPath(type: 'tasks' | 'insights', serverName: string, filename: string): string {
  const baseDir = path.join(process.cwd(), 'outputs');
  const typeDir = path.join(baseDir, type);
  const serverDir = path.join(typeDir, serverName.toLowerCase().replace(/\s+/g, '-'));
  
  ensureDirectoryExists(serverDir);
  return path.join(serverDir, filename);
} 