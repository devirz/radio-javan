import dotenv from "dotenv"
import { readFileSync } from "fs"
import { Bot, InlineKeyboard, InputFile, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
//import texts from "./text.json" assert { type: "json" };
import rjdl from "./src/rjdl.js";
import { autoChatAction } from "@grammyjs/auto-chat-action";

// configure .env file
dotenv.config()
const texts = JSON.parse(readFileSync("./text.json"))
console.log(texts)

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
bot.use(createConversation(greeting));
bot.use(autoChatAction(bot.api));

async function checkJoined(chat, user){
  const status = await bot.api.getChatMember(chat, user)
  return status.status === "left"
}

async function greeting(conversation, ctx) {
  ctx.chatAction = "typing";
  const status = await checkJoined(process.env.MUSIC_CHANNEL, ctx.from.id)
  if (status){
    await ctx.reply(texts.join, {
      reply_markup: new InlineKeyboard().url("Radio Music", "https://t.me/RadioMusicIRZ")
    })
    return
  }
  await ctx.reply(texts.welcome);
  const { message } = await conversation.wait();
  if (message.text.includes("rj.app")) {
    const msg = await ctx.reply("درحال جستجو برای لینک مدنظر...");
    const result = await rjdl(message.text);
    ctx.chatAction = "upload_photo";
    const caption = `[👤] Artist: ${result.artist}\n[🔹] Song: ${result.song}\n[🎧] Plays: ${result.plays}\n[👍🏻] Likes: ${result.likes}\n- Published: ${result.date}`
    const poster = await ctx.replyWithPhoto(result.photo, {
      caption: caption,
    });
    await ctx.api.deleteMessage(msg.chat.id, msg.message_id);
    if(result.size >= 20){
      await ctx.reply(texts.isPodcast, {
        reply_markup: new InlineKeyboard().url("دانلود", result.src)
      })
      await bot.api.copyMessage(process.env.MUSIC_CHANNEL, poster.chat.id, poster.message_id, {
        reply_markup: new InlineKeyboard().url(result.song, result.src)
      })
    } else {
      ctx.chatAction = "upload_audio"
      const music = await ctx.replyWithAudio(new InputFile({ url: result.src }))
      await bot.api.copyMessage(process.env.MUSIC_CHANNEL, poster.chat.id, poster.message_id)
      await bot.api.copyMessage(process.env.MUSIC_CHANNEL, music.chat.id, music.message_id)
    }
  } else {
    await ctx.reply("لطفا از صحیح بودن لینک ارسالی اطمینان حاصل کنید")
  }
}

bot.chatType("private").command("start", async (ctx) => {
  await ctx.conversation.enter("greeting");
});

bot.chatType("private").on("msg::url", async ctx => {
  const status = await checkJoined(process.env.MUSIC_CHANNEL, ctx.from.id)
  if (status){
    await ctx.reply(texts.join, {
      reply_markup: new InlineKeyboard().url("Radio Music", "https://t.me/RadioMusicIRZ")
    })
    return
  }
  if (ctx.message.text.includes("rj.app")) {
    const msg = await ctx.reply("درحال جستجو برای لینک مدنظر...");
    const result = await rjdl(ctx.message.text);
    ctx.chatAction = "upload_photo";
    const caption = `[👤] Artist: ${result.artist}\n[🔹] Song: ${result.song}\n[🎧] Plays: ${result.plays}\n[👍🏻] Likes: ${result.likes}\n- Published: ${result.date}`
    const poster = await ctx.replyWithPhoto(result.photo, {
      caption: caption,
    });
    await ctx.api.deleteMessage(msg.chat.id, msg.message_id);
    if(result.size >= 20){
      await ctx.reply(texts.isPodcast, {
        reply_markup: new InlineKeyboard().url("دانلود", result.src)
      })
      await bot.api.copyMessage(process.env.MUSIC_CHANNEL, poster.chat.id, poster.message_id, {
        reply_markup: new InlineKeyboard().url(result.song, result.src)
      })
    } else {
      ctx.chatAction = "upload_audio"
      const music = await ctx.replyWithAudio(new InputFile({ url: result.src }))
      await bot.api.copyMessage(process.env.MUSIC_CHANNEL, poster.chat.id, poster.message_id)
      await bot.api.copyMessage(process.env.MUSIC_CHANNEL, music.chat.id, music.message_id)
    }
  } else {
    await ctx.reply("لطفا از صحیح بودن لینک ارسالی اطمینان حاصل کنید")
  }
})

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  console.error(err)
});

bot.start();
