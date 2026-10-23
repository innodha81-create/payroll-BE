"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const keys_1 = require("./keys");
function generateAccessToken(user) {
    const jti = crypto_1.default.randomUUID();
    const expiresInSeconds = 15 * 60; // 15 minutes
    const token = jsonwebtoken_1.default.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        jti
    }, keys_1.PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn: '15m',
        issuer: 'icomply-auth'
    });
    return { token, jti, expiresInSeconds };
}
function generateRefreshToken(userId, familyId) {
    const jti = crypto_1.default.randomUUID();
    const famId = familyId || crypto_1.default.randomUUID();
    const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days
    const token = jsonwebtoken_1.default.sign({
        sub: userId,
        familyId: famId,
        jti
    }, keys_1.PRIVATE_KEY, {
        algorithm: 'RS256',
        expiresIn: '7d',
        issuer: 'icomply-auth'
    });
    return { token, jti, familyId: famId, expiresInSeconds };
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, keys_1.PUBLIC_KEY, {
        algorithms: ['RS256'],
        issuer: 'icomply-auth'
    });
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, keys_1.PUBLIC_KEY, {
        algorithms: ['RS256'],
        issuer: 'icomply-auth'
    });
}
