import { InlineKeyboard, InputFile } from "grammy"
import { readFileSync } from "fs"
import dotenv from "dotenv"
import rjdl from "../src/rjdl.js"

dotenv.config()
const texts = JSON.parse(readFileSync("./text.json"))

async function sendMusicLink(conv, ctx){
  await ctx.reply("لینک موزیک یا پادکست مدنظرتونو بفرستین:")
  const { message } = await conv.wait()
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

export default sendMusicLink
