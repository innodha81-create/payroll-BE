import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const KEYS_DIR = path.join(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.key');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.key');

function ensureKeysExist(): { privateKey: string; publicKey: string } {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    return { privateKey, publicKey };
  }

  console.log('[Security] Generating 2048-bit RS256 RSA Key Pair for Dual Token System...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });
  console.log('[Security] RSA Key pair generated and saved successfully.');

  return { privateKey, publicKey };
}

const keys = ensureKeysExist();

export const PRIVATE_KEY = keys.privateKey;
export const PUBLIC_KEY = keys.publicKey;
