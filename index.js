import dotenv from "dotenv"
import { readFileSync } from "fs"
import { Bot, InlineKeyboard, InputFile, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
//import texts from "./text.json" assert { type: "json" };
import rjdl from "./src/rjdl.js";
import { indexMenu, downloadAndNextBtn } from "./src/menu.js"
import sendMusicLink from "./conversations/send_music_link.js"
import { autoChatAction } from "@grammyjs/auto-chat-action";

// configure .env file
dotenv.config()
const texts = JSON.parse(readFileSync("./text.json"))
//console.log(texts)

const bot = new Bot(process.env.TOKEN);
// Install the session plugin.
bot.use(
  session({
    initial() {
      // return empty object for now
      return {};
    },
  })
);

// Install the conversations plugin.
bot.use(conversations());
bot.use(createConversation(sendMusicLink))
bot.use(autoChatAction(bot.api));
bot.use(indexMenu)
indexMenu.register(downloadAndNextBtn)

async function checkJoined(chat, user){
  const status = await bot.api.getChatMember(chat, user)
  return status.status === "left"
}

bot.chatType("private").command("start", async (ctx) => {
  //await ctx.conversation.enter("greeting");
  await ctx.reply(texts.welcome, {
    reply_markup: indexMenu
  })
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  console.error(err)
});

bot.start();
