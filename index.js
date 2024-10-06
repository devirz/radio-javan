import dotenv from "dotenv"
import { readFileSync, createReadStream } from "fs"
import { Bot, InlineKeyboard, InputFile, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
//import texts from "./text.json" assert { type: "json" };
import rjdl from "./src/rjdl.js";
import { indexMenu, downloadAndNextBtn, backBtn } from "./src/menu.js"
import sendMusicLink from "./conversations/send_music_link.js"
import { autoChatAction } from "@grammyjs/auto-chat-action";

// configure .env file
dotenv.config()
const texts = JSON.parse(readFileSync("./text.json"))
//console.log(texts)

const bot = new Bot(process.env.TOKEN);
const token = "883737:6474575682c66"

setInterval(async () => {
  const response = await fetch(`https://one-api.ir/radiojavan/?token=${token}&action=new_songs`)
  const result = await response.json()
  if(result.status === 200){
    await client.set("musics", JSON.stringify(result.result))
  }
}, 5 * 60 * 1000);


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
