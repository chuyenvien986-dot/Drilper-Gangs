"use strict";
const fs   = require("fs");
const path = require("path");

module.exports = {
    getTokens() {
        const p = path.join(__dirname, "..", "tokens.txt");
        if (!fs.existsSync(p)) return null;
        const tokens = fs.readFileSync(p, "utf-8")
            .split(/\r?\n/).map(t => t.trim()).filter(Boolean);
        return tokens.length ? tokens : null;
    },

    getOAuth2URL() {
        const ClientId    = process.env.CLIENT_ID;
        const redirectUrl = process.env.REDIRECT_URL;
        if (!ClientId || !redirectUrl) return null;
        return (
            `https://discord.com/oauth2/authorize` +
            `?client_id=${ClientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
            `&response_type=code` +
            `&scope=guilds.join+identify`
        );
    },

    async getAccessToken(code) {
        const ClientId     = process.env.CLIENT_ID;
        const ClientSecret = process.env.CLIENT_SECRET;
        const redirectUrl  = process.env.REDIRECT_URL;
        if (!ClientId || !ClientSecret || !redirectUrl) return null;

        const params = new URLSearchParams();
        params.append("client_id", ClientId);
        params.append("client_secret", ClientSecret);
        params.append("grant_type", "authorization_code");
        params.append("code", code);
        params.append("redirect_uri", redirectUrl);

        try {
            const res = await fetch("https://discord.com/api/oauth2/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params.toString(),
            });
            if (!res.ok) {
                console.error("[oauth] fail:", res.status, res.statusText);
                return null;
            }
            const data = await res.json();
            return data.access_token || null;
        } catch (err) {
            console.error("[oauth] error:", err);
            return null;
        }
    },
};
