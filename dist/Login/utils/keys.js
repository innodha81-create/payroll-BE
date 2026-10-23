"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_KEY = exports.PRIVATE_KEY = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const KEYS_DIR = path_1.default.join(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path_1.default.join(KEYS_DIR, 'private.key');
const PUBLIC_KEY_PATH = path_1.default.join(KEYS_DIR, 'public.key');
function ensureKeysExist() {
    if (!fs_1.default.existsSync(KEYS_DIR)) {
        fs_1.default.mkdirSync(KEYS_DIR, { recursive: true });
    }
    if (fs_1.default.existsSync(PRIVATE_KEY_PATH) && fs_1.default.existsSync(PUBLIC_KEY_PATH)) {
        const privateKey = fs_1.default.readFileSync(PRIVATE_KEY_PATH, 'utf8');
        const publicKey = fs_1.default.readFileSync(PUBLIC_KEY_PATH, 'utf8');
        return { privateKey, publicKey };
    }
    console.log('[Security] Generating 2048-bit RS256 RSA Key Pair for Dual Token System...');
    const { privateKey, publicKey } = crypto_1.default.generateKeyPairSync('rsa', {
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
    fs_1.default.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs_1.default.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });
    console.log('[Security] RSA Key pair generated and saved successfully.');
    return { privateKey, publicKey };
}
const keys = ensureKeysExist();
exports.PRIVATE_KEY = keys.privateKey;
exports.PUBLIC_KEY = keys.publicKey;
