"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGeoLocation = resolveGeoLocation;
exports.parseClientDetails = parseClientDetails;
exports.recordAuditLog = recordAuditLog;
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const ua_parser_js_1 = require("ua-parser-js");
const db_1 = require("../../database/db");
function isPrivateIp(ip) {
    if (!ip || ip === '127.0.0.1' || ip === 'localhost')
        return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.'))
        return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip))
        return true;
    return false;
}
async function resolveGeoLocation(ip) {
    const isLocal = isPrivateIp(ip);
    // 1. High-precision Provider 1: ipinfo.io
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const targetUrl = isLocal
            ? 'https://ipinfo.io/json'
            : `https://ipinfo.io/${encodeURIComponent(ip)}/json`;
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            if (data && data.city) {
                let lat = null;
                let lon = null;
                if (data.loc) {
                    const parts = data.loc.split(',');
                    if (parts.length === 2) {
                        lat = parseFloat(parts[0]);
                        lon = parseFloat(parts[1]);
                    }
                }
                const countryDisplay = data.country === 'IN' ? 'India' : data.country === 'SG' ? 'Singapore' : data.country || 'India';
                return {
                    publicIp: data.ip || (isLocal ? null : ip),
                    city: data.city || null,
                    state: data.region || null,
                    country: countryDisplay,
                    latitude: lat,
                    longitude: lon
                };
            }
        }
    }
    catch (err) {
        // fallback to provider 2
    }
    // 2. High-precision Provider 2: freeipapi.com
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const targetUrl = isLocal
            ? 'https://freeipapi.com/api/json'
            : `https://freeipapi.com/api/json/${encodeURIComponent(ip)}`;
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            if (data && data.cityName) {
                return {
                    publicIp: data.ipAddress || (isLocal ? null : ip),
                    city: data.cityName || null,
                    state: data.regionName || null,
                    country: data.countryName || 'India',
                    latitude: data.latitude != null ? Number(data.latitude) : null,
                    longitude: data.longitude != null ? Number(data.longitude) : null
                };
            }
        }
    }
    catch (err) {
        // fallback to geoip-lite
    }
    // 3. Fallback: geoip-lite for public IP
    let geo = null;
    if (!isLocal) {
        try {
            geo = geoip_lite_1.default.lookup(ip);
        }
        catch { }
    }
    return {
        publicIp: isLocal ? null : ip,
        city: geo?.city || (isLocal ? 'Localhost' : null),
        state: geo?.region || (isLocal ? 'Local' : null),
        country: geo?.country || 'India',
        latitude: geo?.ll && geo.ll[0] != null ? Number(geo.ll[0]) : null,
        longitude: geo?.ll && geo.ll[1] != null ? Number(geo.ll[1]) : null
    };
}
function parseClientDetails(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    const realIp = req.headers['x-real-ip'];
    const forwarded = req.headers['x-forwarded-for'];
    let rawIp = cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.socket.remoteAddress || '127.0.0.1'));
    if (rawIp.startsWith('::ffff:')) {
        rawIp = rawIp.replace('::ffff:', '');
    }
    if (rawIp === '::1') {
        rawIp = '127.0.0.1';
    }
    const ip = rawIp.trim();
    let city = null;
    let state = null;
    let country = null;
    let latitude = null;
    let longitude = null;
    if (!isPrivateIp(ip)) {
        const geo = geoip_lite_1.default.lookup(ip);
        if (geo) {
            city = geo.city || null;
            state = geo.region || null;
            country = geo.country || null;
            if (geo.ll && geo.ll.length >= 2) {
                latitude = Number(geo.ll[0]);
                longitude = Number(geo.ll[1]);
            }
        }
    }
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const parser = new ua_parser_js_1.UAParser(userAgent);
    const result = parser.getResult();
    const deviceType = result.device.type || 'Desktop';
    const deviceModel = result.device.model || (result.device.vendor ? `${result.device.vendor}` : 'PC/Mac');
    const osName = result.os.name || 'Unknown OS';
    const osVersion = result.os.version || null;
    const browserName = result.browser.name || 'Unknown Browser';
    const browserVersion = result.browser.version || null;
    return {
        ip,
        city,
        state,
        country,
        latitude,
        longitude,
        deviceType,
        deviceModel,
        osName,
        osVersion,
        browserName,
        browserVersion,
        userAgent
    };
}
function recordAuditLog(userId, email, status, clientDetails, failureReason) {
    setImmediate(async () => {
        try {
            // Asynchronously resolve geo location with high accuracy
            const geo = await resolveGeoLocation(clientDetails.ip);
            const effectiveIp = geo.publicIp || clientDetails.ip;
            const city = geo.city || clientDetails.city || 'Madurai';
            const state = geo.state || clientDetails.state || 'Tamil Nadu';
            const country = geo.country || clientDetails.country || 'India';
            const latitude = geo.latitude ?? clientDetails.latitude;
            const longitude = geo.longitude ?? clientDetails.longitude;
            await db_1.pool.query(`INSERT INTO login_audit_logs (
          user_id, email, status, ip_address, city, state, country,
          latitude, longitude, device_type, device_model, os_name,
          os_version, browser_name, browser_version, user_agent, failure_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`, [
                userId,
                email,
                status,
                effectiveIp,
                city,
                state,
                country,
                latitude,
                longitude,
                clientDetails.deviceType,
                clientDetails.deviceModel,
                clientDetails.osName,
                clientDetails.osVersion,
                clientDetails.browserName,
                clientDetails.browserVersion,
                clientDetails.userAgent,
                failureReason || null
            ]);
        }
        catch (err) {
            console.error('[Audit Log Error]:', err);
        }
    });
}
