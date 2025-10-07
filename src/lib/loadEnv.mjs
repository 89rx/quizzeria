// src/lib/loadEnv.mjs

import fs from 'fs';
import path from 'path';

export function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envFileContent = fs.readFileSync(envPath, { encoding: 'utf-8' });
      envFileContent.split('\n').forEach(line => {
        if (line.trim() !== '' && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim();
          if (key && value && !process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (error) {
    console.error('Failed to manually load .env.local in API route:', error);
  }
}