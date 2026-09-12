"use strict";
const path = require("path");
const A = (...p) => path.join(__dirname, "assets", ...p);

module.exports = {
    BRAND_NAME:  "Drilper Gangs",
    BRAND_OWNER: "NGUYỄN THÀNH KHANG",
    BRAND_TAG:   "NGUYỄN THÀNH KHANG DRILPER",
    FOOTER:      "Make by NGUYỄN THÀNH KHANG DRILPER",

    IMG_JOIN_PROMPT: A("join_prompt.jpg"),
    IMG_DM_GUIDE:    A("dm_guide.jpg"),
    IMG_TOKENS_OK:   A("tokens_ok.jpg"),
    IMG_GUILD_OK:    A("guild_ok.jpg"),
    IMG_JOIN_START:  A("join_start.jpg"),
    IMG_PROGRESS:    A("progress.gif"),
    IMG_DONE:        A("done.jpg"),
    IMG_ERROR:       A("error.jpg"),

    COLOR_MAIN: "Blue",
    COLOR_OK:   "Green",
    COLOR_WARN: "Yellow",
    COLOR_FAIL: "Red",

    PREFIX:  "!",
    COMMAND: "join",

    MAX_TOKENS_PER_SESSION: 500,
    TIMEOUT_PER_TOKEN_MS:   30000,
    SESSION_TIMEOUT_MS:     30 * 60 * 1000,
    PROGRESS_THROTTLE_MS:   1200,

    PROXY: null,
};
