import get from "axios"
import { Bot, InlineKeyboard, InputFile, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import texts from "./text.json" assert { type: "json" };
import rjdl from "./src/rjdl.js";
import { autoChatAction } from "@grammyjs/auto-chat-action";

const token = "7038512790:AAH_ibeJGR7KN8d0QxCPQsk7zRIOZr-KWSE";

const bot = new Bot(token);

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
bot.use(createConversation(greeting));
bot.use(autoChatAction(bot.api));

function shortenBytes(n) {
  const k = n > 0 ? Math.floor((Math.log2(n)/10)) : 0
  const count = Math.floor(n / Math.pow(1024, k))
  return count
}

async function greeting(conversation, ctx) {
  ctx.chatAction = "typing";
  await ctx.reply(texts.welcome);
  const { message } = await conversation.wait();
  if (message.text.includes("rj.app")) {
    const msg = await ctx.reply("درحال جستجو برای لینک مدنظر...");
    const result = await rjdl(message.text);
    ctx.chatAction = "upload_photo";
    await ctx.replyWithPhoto(result.photo, {
      caption: `[👤] Artist: ${result.artist}\n[🔹] Song: ${result.song}\n[🎧] Plays: ${result.plays}\n[👍🏻] Likes: ${result.likes}\n- Published: ${result.date}`,
    });
    await ctx.api.deleteMessage(msg.chat.id, msg.message_id);
    if(result.size >= 20){
      await ctx.reply(texts.isPodcast, {
        reply_markup: new InlineKeyboard().url("دانلود", result.src)
      })
    } else {
      ctx.chatAction = "upload_audio"
      await ctx.replyWithAudio(new InputFile({ url: result.src }))
    }
  } else {
    await ctx.reply("لطفا از صحیح بودن لینک ارسالی اطمینان حاصل کنید")
  }
}

bot.command("start", async (ctx) => {
  await ctx.conversation.enter("greeting");
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  console.error(err)
});

bot.start();
