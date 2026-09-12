"use strict";

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    AttachmentBuilder,
} = require("discord.js");
const SelfbotClient = require("discord.js-selfbot-v13").Client;
const dotenv = require("dotenv");
const fs     = require("fs");
const path   = require("path");
const utils  = require("./utils");
const CFG    = require("./config");

dotenv.config();

// ═════════════════════════════════════════════
//  MAIN CLIENT
// ═════════════════════════════════════════════
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
});

const sessions = new Map();
const ID_REGEX = /^\d{17,20}$/;

client.on("error", (err) => console.error("[client error]", err));
client.on("warn",  (msg) => console.log("[warn]", msg));

client.login(process.env.CLIENT_TOKEN).catch((err) => {
    console.error("[login] fail:", err);
    process.exit(1);
});

client.on("ready", () => {
    console.log(`[main] Logged in as ${client.user?.tag}`);

    // check assets
    const dir = path.join(__dirname, "assets");
    if (!fs.existsSync(dir)) {
        console.log(`[assets] ⚠ folder thiếu: ${dir}`);
    } else {
        const miss = [];
        for (const k of Object.keys(CFG)) {
            if (!k.startsWith("IMG_")) continue;
            if (CFG[k] && !fs.existsSync(CFG[k])) miss.push(path.basename(CFG[k]));
        }
        console.log(miss.length
            ? `[assets] ⚠ thiếu: ${miss.join(", ")}`
            : `[assets] ✓ tất cả ảnh OK`);
    }
});

// ═════════════════════════════════════════════
//  ATTACH + SEND HELPERS
// ═════════════════════════════════════════════
function attach(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return { file: null, url: null };
    const name = path.basename(filePath);
    return {
        file: new AttachmentBuilder(filePath, { name }),
        url:  `attachment://${name}`,
    };
}

function withAsset(embed, imgKey) {
    const { file, url } = attach(CFG[imgKey]);
    if (url) embed.setImage(url);
    return { embeds: [embed], files: file ? [file] : [] };
}

/** gửi message trong channel (đã có .send) */
async function sendTo(channel, embedBuilder, imgKey) {
    return channel.send(withAsset(embedBuilder, imgKey));
}

/** edit message (đã có .edit) */
async function editTo(message, embedBuilder, imgKey) {
    return message.edit(withAsset(embedBuilder, imgKey));
}

/** gửi DM cho user — LUÔN createDM() trước */
async function sendDM(user, embedBuilder, imgKey) {
    const dm = await user.createDM();
    return dm.send(withAsset(embedBuilder, imgKey));
}

// ═════════════════════════════════════════════
//  EMBED BUILDERS
// ═════════════════════════════════════════════
function embedJoinPrompt(user) {
    return new EmbedBuilder()
        .setColor(CFG.COLOR_MAIN)
        .setAuthor({ name: `🚀 ${CFG.BRAND_NAME} — ${CFG.BRAND_OWNER}` })
        .setDescription(
            `📩 <@${user.id}> **Bot đã gửi DM cho bạn!**\n\n` +
            `🔒 Vào DM với bot → gửi token bí mật\n` +
            `Tiến độ join sẽ hiện ngay tại kênh này!\n\n` +
            `*by ${CFG.BRAND_TAG}* 👑`
        )
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function embedDMGuide() {
    return new EmbedBuilder()
        .setColor(CFG.COLOR_MAIN)
        .setAuthor({ name: `🚀 ${CFG.BRAND_NAME} — ${CFG.BRAND_OWNER}` })
        .setDescription(
            `**Xin chào!** 👋 Tool join by **${CFG.BRAND_OWNER}**\n\n` +
            `📌 **BƯỚC 1:** Gửi token tại đây!\n` +
            `• Paste text thẳng *(mỗi dòng 1 token)*\n` +
            `• Hoặc đính kèm file \`.txt\` *(không giới hạn)*\n\n` +
            `🔒 Thông tin bí mật — chỉ bot nhận!\n\n` +
            `*Powered by ${CFG.BRAND_TAG}* 👑`
        )
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function embedTokensReceived(count) {
    return new EmbedBuilder()
        .setColor(CFG.COLOR_OK)
        .setAuthor({ name: `🚀 ${CFG.BRAND_NAME} — ${CFG.BRAND_OWNER}` })
        .setDescription(
            `✅ **Đã tiếp nhận token!**\n\n` +
            `🔑 **Đã nhận:** \`${count}\` token\n\n` +
            `📌 **BƯỚC 2:** Nhập ID Server muốn join:\n` +
            `*(Chỉ nhập 1 dòng — 1 ID server)*\n\n` +
            `🔥 ${CFG.BRAND_OWNER} BOT`
        )
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function embedGuildReceived(guildId) {
    return new EmbedBuilder()
        .setColor(CFG.COLOR_OK)
        .setAuthor({ name: `🚀 ${CFG.BRAND_NAME} — ${CFG.BRAND_OWNER}` })
        .setDescription(
            `✅ **Đã nhận ID server!**\n\n` +
            `🖥️ \`${guildId}\`\n\n` +
            `⏳ Bắt đầu join...\n\n` +
            `🔥 ${CFG.BRAND_OWNER} BOT`
        )
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function embedJoiningStart(guildName, count) {
    return new EmbedBuilder()
        .setColor(CFG.COLOR_MAIN)
        .setAuthor({ name: `🚀 ${CFG.BRAND_NAME} — ${CFG.BRAND_OWNER}` })
        .setDescription(
            `🚀 **Đang tiến hành join!**\n\n` +
            `🖥️ **Server:** \`${guildName}\`\n` +
            `🔑 **Số token:** \`${count}\`\n\n` +
            `⏳ Tiến độ hiện tại tại **kênh server!**\n` +
            `*by ${CFG.BRAND_TAG}* 👑\n\n` +
            `🔥 ${CFG.BRAND_OWNER} BOT`
        )
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function embedProgress(guildName, total, done, failed, logs) {
    const bar = buildBar(done, total);
    const logBlock = logs.slice(-10).join("\n") || "`Đang khởi động...`";
    return new EmbedBuilder()
        .setColor(CFG.COLOR_MAIN)
        .setAuthor({ name: `⚡ ${CFG.BRAND_NAME} ĐANG CHẠY — ${CFG.BRAND_OWNER}` })
        .addFields(
            { name: "🖥️ Server",  value: `\`${guildName}\``, inline: false },
            { name: "👤 Token",    value: `\`${total}\``,     inline: false },
            { name: "📊 Tiến độ",  value: bar,                inline: false },
            { name: "📋 Chi tiết", value: logBlock,           inline: false }
        )
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function embedDone(guildName, total, done, failed) {
    return new EmbedBuilder()
        .setColor(CFG.COLOR_OK)
        .setAuthor({ name: `🏁 ${CFG.BRAND_NAME} HOÀN TẤT — ${CFG.BRAND_OWNER}` })
        .addFields(
            { name: "🖥️ Server",          value: `\`${guildName}\``,       inline: false },
            { name: "✅ Join Thành Công",  value: `\`${done}/${total}\``,   inline: false },
            { name: "❌ Thất Bại / Die",   value: `\`${failed}/${total}\``, inline: false },
            { name: "🔗 Link Kết Quả",     value: "Nhảy tới tin nhắn này",  inline: false }
        )
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function embedError(text) {
    return new EmbedBuilder()
        .setColor(CFG.COLOR_FAIL)
        .setAuthor({ name: `🚀 ${CFG.BRAND_NAME} — ${CFG.BRAND_OWNER}` })
        .setDescription(text)
        .setFooter({ text: `🔥 ${CFG.FOOTER}` });
}

function buildBar(done, total, size = 20) {
    if (!total) return "`0/0`";
    const filled = Math.round((done / total) * size);
    const empty  = size - filled;
    return `\`${"▰".repeat(filled)}${"▱".repeat(empty)}\` **${done}/${total}**`;
}

// ═════════════════════════════════════════════
//  TOKEN EXTRACT
// ═════════════════════════════════════════════
function extractTokensFromText(text) {
    return text.split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 30 && !ID_REGEX.test(l));
}

async function extractTokensFromAttachments(attachments) {
    const out = [];
    for (const [, att] of attachments) {
        if (!att.name?.toLowerCase().endsWith(".txt")) continue;
        try {
            const res  = await fetch(att.url);
            const text = await res.text();
            out.push(...extractTokensFromText(text));
        } catch (e) {
            console.error("[dm] attach read fail:", e);
        }
    }
    return out;
}

// ═════════════════════════════════════════════
//  MESSAGE HANDLER
// ═════════════════════════════════════════════
client.on("messageCreate", async (message) => {
    try {
        if (message.author?.bot) return;
        if (message.author?.id === client.user?.id) return;

        const content = (message.content || "").trim();

        // ══════════════════════════════════════
        //  1. !join (guild)
        // ══════════════════════════════════════
        if (!message.channel.isDMBased()
            && content.toLowerCase() === `${CFG.PREFIX}${CFG.COMMAND}`) {

            sessions.delete(message.author.id);

            // gửi DM guide
            try {
                await sendDM(message.author, embedDMGuide(), "IMG_DM_GUIDE");
            } catch (err) {
                console.error("[join] dm fail:", err);
                return sendTo(
                    message.channel,
                    embedError("❌ Không DM được. Bật **Allow DMs from server members** rồi thử lại."),
                    "IMG_ERROR"
                );
            }

            // tạo session
            sessions.set(message.author.id, {
                userId:    message.author.id,
                channelId: message.channel.id,
                tokens:    [],
                step:      "tokens",
                createdAt: Date.now(),
            });

            // reply kênh
            await sendTo(message.channel, embedJoinPrompt(message.author), "IMG_JOIN_PROMPT");

            // auto cleanup
            setTimeout(() => {
                const s = sessions.get(message.author.id);
                if (s && Date.now() - s.createdAt > CFG.SESSION_TIMEOUT_MS) {
                    sessions.delete(message.author.id);
                }
            }, CFG.SESSION_TIMEOUT_MS);
            return;
        }

        // ══════════════════════════════════════
        //  2. DM
        // ══════════════════════════════════════
        if (message.channel.isDMBased()) {
            const sess = sessions.get(message.author.id);
            if (!sess) return;

            // ─── BƯỚC 1: token ───
            if (sess.step === "tokens") {
                let newTokens = extractTokensFromText(content);
                newTokens.push(...await extractTokensFromAttachments(message.attachments));
                newTokens = [...new Set(newTokens)];

                sess.tokens = [...new Set([...sess.tokens, ...newTokens])];

                if (!sess.tokens.length) {
                    return sendTo(
                        message.channel,
                        embedError("❌ Không có token nào hợp lệ. Paste text hoặc gửi file `.txt`."),
                        "IMG_ERROR"
                    );
                }

                if (sess.tokens.length > CFG.MAX_TOKENS_PER_SESSION) {
                    return sendTo(
                        message.channel,
                        embedError(`❌ Quá nhiều token (max ${CFG.MAX_TOKENS_PER_SESSION}).`),
                        "IMG_ERROR"
                    );
                }

                // save riêng
                const dir = path.join(__dirname, "tokens");
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(
                    path.join(dir, `user_${message.author.id}_${Date.now()}.txt`),
                    sess.tokens.join("\n"),
                    "utf-8"
                );

                sess.step = "guild";

                return sendTo(
                    message.channel,
                    embedTokensReceived(sess.tokens.length),
                    "IMG_TOKENS_OK"
                );
            }

            // ─── BƯỚC 2: guild id ───
            if (sess.step === "guild") {
                const m = content.match(/\d{17,20}/);
                if (!m) {
                    return sendTo(
                        message.channel,
                        embedError("❌ ID server không hợp lệ. Nhập lại đúng 1 dòng số (17-20 chữ số)."),
                        "IMG_ERROR"
                    );
                }

                const guildId   = m[0];
                const tokens    = sess.tokens;
                const channelId = sess.channelId;
                const author    = message.author;

                sessions.delete(author.id);

                await sendTo(message.channel, embedGuildReceived(guildId), "IMG_GUILD_OK");

                runJoiner(author, channelId, guildId, tokens)
                    .catch(e => console.error("[joiner] fatal:", e));
            }
        }
    } catch (err) {
        console.error("[messageCreate] unhandled:", err);
    }
});

// ═════════════════════════════════════════════
//  CORE JOINER
// ═════════════════════════════════════════════
async function runJoiner(author, channelId, guildId, tokens) {
    let originChannel = null;
    try {
        originChannel = await client.channels.fetch(channelId);
    } catch {}

    if (!originChannel?.isTextBased?.()) {
        return sendDM(
            author,
            embedError("❌ Không tìm thấy kênh gốc."),
            "IMG_ERROR"
        ).catch(() => {});
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        const e = embedError(`❌ Guild \`${guildId}\` không hợp lệ hoặc bot không ở trong server.`);
        await sendTo(originChannel, e, "IMG_ERROR").catch(() => {});
        return sendDM(author, e, "IMG_ERROR").catch(() => {});
    }

    const oAuth2URL = utils.getOAuth2URL();
    if (!oAuth2URL) {
        const e = embedError("❌ Thiếu `CLIENT_ID` / `REDIRECT_URL` trong `.env`.");
        await sendTo(originChannel, e, "IMG_ERROR").catch(() => {});
        return;
    }

    // tin #1: start
    await sendTo(
        originChannel,
        embedJoiningStart(guild.name, tokens.length),
        "IMG_JOIN_START"
    ).catch(() => {});

    // tin #2: progress
    let done = 0;
    let failed = 0;
    const logs = [];

    const progressMsg = await sendTo(
        originChannel,
        embedProgress(guild.name, tokens.length, done, failed, logs),
        "IMG_PROGRESS"
    ).catch(() => null);

    let lastEdit = 0;
    const updateProgress = async (force = false) => {
        if (!progressMsg) return;
        const now = Date.now();
        if (!force && now - lastEdit < CFG.PROGRESS_THROTTLE_MS) return;
        lastEdit = now;
        try {
            await editTo(
                progressMsg,
                embedProgress(guild.name, tokens.length, done, failed, logs),
                "IMG_PROGRESS"
            );
        } catch {}
    };

    for (const token of tokens) {
        await new Promise((resolve) => {
            const tokenClient = new SelfbotClient({});
            let finished = false;

            const finish = async (ok, username, reason) => {
                if (finished) return;
                finished = true;

                if (ok) {
                    done++;
                    logs.push(`✅ ${done}/${tokens.length} | ${username || "unknown"}`);
                } else {
                    failed++;
                    logs.push(`❌ ${failed}/${tokens.length} | ${reason}`);
                }

                await updateProgress();
                try { tokenClient.destroy(); } catch {}
                resolve();
            };

            const timeout = setTimeout(
                () => finish(false, null, "timeout"),
                CFG.TIMEOUT_PER_TOKEN_MS
            );

            tokenClient.on("ready", async () => {
                try {
                    const authorize = await tokenClient.authorizeURL(oAuth2URL);
                    const code = authorize?.location?.split("code=")[1];
                    if (!code) {
                        clearTimeout(timeout);
                        return finish(false, null, "no oauth code");
                    }

                    const accessToken = await utils.getAccessToken(code);
                    if (!accessToken) {
                        clearTimeout(timeout);
                        return finish(false, null, "no access_token");
                    }

                    const userId   = tokenClient.user?.id;
                    const existing = await guild.members.fetch(userId).catch(() => null);
                    if (existing) {
                        clearTimeout(timeout);
                        return finish(false, tokenClient.user?.username, "already in guild");
                    }

                    await guild.members.add(userId, { accessToken });
                    clearTimeout(timeout);
                    finish(true, tokenClient.user?.username);
                } catch (err) {
                    clearTimeout(timeout);
                    finish(false, null, String(err).slice(0, 60));
                }
            });

            tokenClient.on("error", (err) => {
                clearTimeout(timeout);
                finish(false, null, String(err).slice(0, 60));
            });

            tokenClient.login(token).catch(() => {
                clearTimeout(timeout);
                finish(false, null, "invalid token");
            });
        });
    }

    // flush cuối
    await updateProgress(true);

    // tin #3: done
    await sendTo(
        originChannel,
        embedDone(guild.name, tokens.length, done, failed),
        "IMG_DONE"
    ).catch(() => {});

    // DM kết quả
    await sendDM(
        author,
        embedDone(guild.name, tokens.length, done, failed),
        "IMG_DONE"
    ).catch(() => {});
}
