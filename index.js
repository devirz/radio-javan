import dotenv from "dotenv";
import { readFileSync } from "fs";
import { Bot, GrammyError, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { indexMenu, downloadAndNextBtn, backBtn } from "./src/menu.js";
import sendMusicLink from "./conversations/send_music_link.js";
import searchMusicConversation from "./conversations/search_music.js";
import client from "./db/index.js";
import { autoChatAction } from "@grammyjs/auto-chat-action";
import searchMusicMenu from "./src/searchMusic.js";
import adminMenu, { showAdminPanel } from "./src/adminPanel.js";
import broadcastConversation from "./conversations/broadcast.js";

// 1. Load environment variables and texts
dotenv.config();
const texts = JSON.parse(readFileSync("./text.json"));

// 2. Initialize the bot
const bot = new Bot(process.env.TOKEN);

// 3. Periodically fetch and cache music data
function startMusicCacheInterval() {
  setInterval(async () => {
    try {
      const response = await fetch("https://play.radiojavan.com/api/p/mp3s?type=featured&page=1", {
        headers: {
          accept: "application/json, text/plain, */*",
          "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": "\"Android\"",
          "x-api-key": "40e87948bd4ef75efe61205ac5f468a9fd2b970511acf58c49706ecb984f1d67",
          "x-rj-user-agent": "Radio Javan/4.0.2/f6173917bde5c0102c894b5d2e478693c9d750b7 com.radioJavan.rj.web",
          Referer: "https://play.radiojavan.com/browse/songs",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        method: "GET"
      });
      const result = await response.json();
      await client.set("musics", JSON.stringify(result));
    } catch (err) {
      console.error("Failed to update music cache:", err);
    }
  }, 5 * 60 * 1000);
}

// 4. Bot middlewares and plugins
function setupBotMiddlewares(botInstance) {
  botInstance.use(session({ initial: () => ({}) }));
  botInstance.use(conversations());
  botInstance.use(searchMusicMenu)
  botInstance.use(createConversation(sendMusicLink));
  botInstance.use(createConversation(searchMusicConversation, "searchMusicConversation"));
  botInstance.use(createConversation(broadcastConversation, "broadcastConversation"));
  botInstance.use(autoChatAction(botInstance.api));
  botInstance.use(indexMenu);
  botInstance.use(adminMenu);

  indexMenu.register(backBtn);
  indexMenu.register(downloadAndNextBtn);
}

// 5. Utilities
async function checkJoined(chat, user, api) {
  const status = await api.getChatMember(chat, user);
  return status.status === "left";
}

// 6. Command handlers
function setupHandlers(botInstance) {
  // کامند نمایش پنل ادمین
  botInstance.command("admin", showAdminPanel);
  botInstance.chatType("private").command("start", async (ctx) => {
    const userId = ctx.message.chat.id;
    // await client.sAdd("users", userId.toString());
    const exists = await client.exists(`user:${userId}`);
    if (!exists) {
      // اگر نبود، ذخیره کن
      const userData = {
        id: userId,
        first_name: ctx.from.first_name || "",
        username: ctx.from.username || "",
        downloads: 0,
        joined: new Date().toISOString()
      };
      await client.set(`user:${userId}`, JSON.stringify(userData));
    }
    // await client.sAdd("users", userId.toString());
    // const notJoined = await checkJoined(process.env.MUSIC_CHANNEL, ctx.from.id, botInstance.api);
    // if (notJoined) {
    //   await ctx.reply("شما در کانال ما جوین نیستید\nلطفا پس از جوین شدن دوباره /start رو بزنین", {
    //     reply_markup: new InlineKeyboard().url("Radio Music", "https://t.me/RadioMusicIRZ")
    //   });
    //   return;
    // }
    await ctx.reply(texts.welcome, { reply_markup: indexMenu });
  });
}

// 7. Error handling
function setupErrorHandling(botInstance) {
  botInstance.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    if(err.error instanceof GrammyError){
      console.error(err.error.description);
      if(err.error.description.includes("Bad Request: chat not found")){
        ctx.reply("خطای داخلی!\nربات تا ساعاتی دیگر اپدیت میشود لطفا اخبار را از کانال پشتیبانی پیگیری کنید")
      }
    } else {
      console.error(err.error);
    }
  });
}

// 8. Main startup
function main() {
  startMusicCacheInterval();
  setupBotMiddlewares(bot);
  setupHandlers(bot);
  setupErrorHandling(bot);
  bot.start();
}

main();