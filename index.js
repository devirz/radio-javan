import dotenv from "dotenv"
import { readFileSync, createReadStream } from "fs"
import { Bot, InlineKeyboard, InputFile, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
//import texts from "./text.json" assert { type: "json" };
import rjdl from "./src/rjdl.js";
import { indexMenu, downloadAndNextBtn, backBtn } from "./src/menu.js"
import sendMusicLink from "./conversations/send_music_link.js"
import client from "./db/index.js"
import { autoChatAction } from "@grammyjs/auto-chat-action";

// configure .env file
dotenv.config()
const texts = JSON.parse(readFileSync("./text.json"))
//console.log(texts)

const bot = new Bot(process.env.TOKEN);
const token = "883737:6474575682c66"

;(async () => {
 // const response = await fetch(`https://play.radiojavan.com/api/p/mp3s?type=trending&page=1`)
  const response = await fetch("https://play.radiojavan.com/api/p/mp3s?type=trending&page=1", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "x-api-key": "40e87948bd4ef75efe61205ac5f468a9fd2b970511acf58c49706ecb984f1d67",
    "x-rj-user-agent": "Radio Javan/4.0.2/f6173917bde5c0102c894b5d2e478693c9d750b7 com.radioJavan.rj.web",
    "Referer": "https://play.radiojavan.com/browse/songs",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
});
  const result = await response.json()
  await client.set("musics", JSON.stringify(result))
})()


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
indexMenu.register(backBtn)
indexMenu.register(downloadAndNextBtn)

async function checkJoined(chat, user){
  const status = await bot.api.getChatMember(chat, user)
  return status.status === "left"
}

bot.chatType("private").command("start", async (ctx) => {
  //await ctx.conversation.enter("greeting");
  const notJoined = await checkJoined(process.env.MUSIC_CHANNEL, ctx.from.id)
  if(notJoined){
    await ctx.reply("شما در کانال ما جوین نیستید\nلطفا پس از جوین شدن دوباره /start رو بزنین", {
      reply_markup: new InlineKeyboard().url("Radio Music", "https://t.me/RadioMusicIRZ")
    })
    return
  }
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
