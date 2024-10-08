import { InlineKeyboard, InputFile } from "grammy"
import { readFileSync } from "fs"
import dotenv from "dotenv"
import rjdl from "../src/rjdl.js"
import getPlaylistUrl from "../src/getPlaylist.js"

dotenv.config()
const texts = JSON.parse(readFileSync("./text.json"))

async function sendMusicLink(conv, ctx){
  await ctx.reply("لینک موزیک یا پادکست مدنظرتونو بفرستین:")
  const { message } = await conv.wait()
  if (message.text.includes("rj.app")) {
    const msg = await ctx.reply("درحال جستجو برای لینک مدنظر...");
    const playlist = await getPlaylistUrl(message.text)
    if(playlist.includes("playlist")){
	const regex = /mp3\/([^?]*)/; // Regex to capture the text after "mp3/" and before "?"
	const match = playlist.match(regex);
	if (match && match[1]) {
	  const result = match[1]; // This will hold the matched text
	  const response = await fetch("https://play.radiojavan.com/api/p/mp3_playlist_with_items?id=" + result, {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Chromium\";v=\"124\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-api-key": "40e87948bd4ef75efe61205ac5f468a9fd2b970511acf58c49706ecb984f1d67",
    "x-rj-user-agent": "Radio Javan/4.0.2/f6173917bde5c0102c894b5d2e478693c9d750b7 com.radioJavan.rj.web",
    "cookie": "_rj_web=BAh7B0kiD3Nlc3Npb25faWQGOgZFVEkiJTczNzgxOTBiOGMyNGUxNjk5YTBhY2YyNDA1YTBkYjViBjsAVEkiDGdlb2luZm8GOwBGewg6D2lwX2FkZHJlc3NJIhoyYTAxOjRmODpjMDEwOjNiMmM6OjEGOwBUOgxleHBpcmVzSXU6CVRpbWUN7CQfgLDUNtcKOg1uYW5vX251bWkCpwI6DW5hbm9fZGVuaQY6DXN1Ym1pY3JvIgdnkDoLb2Zmc2V0af7AxzoJem9uZUkiCEVEVAY7AEY6B2Riews6EWNvdW50cnlfY29kZUkiB0RFBjsAVDoRY291bnRyeV9uYW1lSSIMR2VybWFueQY7AFQ6CWNpdHlJIhBGYWxrZW5zdGVpbgY7AFQ6C3JlZ2lvbkkiB1NOBjsAVDoNbGF0aXR1ZGVmDDUwLjQ3Nzc6DmxvbmdpdHVkZWYMMTIuMzY0OQ%3D%3D--8dc94bb5dd9d695a4cc846d9fcb560adc6d7c6ad",
    "Referer": `https://play.radiojavan.com/playlist/mp3/${result}?appOverlay=1`,
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": null,
  "method": "GET"
});
	  const jsonResponse = await response.json()
	  const { id, title, items, count, created_by, followers, photo } = jsonResponse
    const caption = `
│ •[🫶Title] ${title}
│ •[🫧ID]  ${id}
│ •[👤Created] ${created_by}
│ •[🌟Songs] ${count}
│ •[👍🏻Followers] ${followers}
`
	  await ctx.replyWithPhoto(photo, {
		caption
	  })
	  ctx.chatAction = "upload_audio"
	  const musics = items.map(item => item.link)
	  for(let music of musics){
		  await ctx.replyWithAudio(music)
	  }
	} else {
    	  await ctx.reply("لینک اشتباه است")
	}
    }
    const result = await rjdl(message.text);
    ctx.chatAction = "upload_photo";
    const { title, plays, artist, song, likes, size, date } = result
    const caption = `
│ •[🫶Title] ${title}
│ •[🎧Plays] ${plays}
│ •[👤Artist] ${artist}
│ •[🌟Song] ${song}
│ •[👍🏻Likes] ${likes}
│ •[⚜Size] ${size} MB
│ •[Date] ${date}
`
    const poster = await ctx.replyWithPhoto(result.photo, {
      caption: caption,
    });
    await ctx.api.deleteMessage(msg.chat.id, msg.message_id);
    if(result.size >= 20){
      await ctx.reply(texts.isPodcast, {
        reply_markup: new InlineKeyboard().url("دانلود", result.src)
      })
      await ctx.api.copyMessage(process.env.MUSIC_CHANNEL, poster.chat.id, poster.message_id, {
        reply_markup: new InlineKeyboard().url(result.song, result.src)
      })
    } else {
      ctx.chatAction = "upload_audio"
      const music = await ctx.replyWithAudio(new InputFile({ url: result.src }))
      await ctx.api.copyMessage(process.env.MUSIC_CHANNEL, poster.chat.id, poster.message_id)
      await ctx.api.copyMessage(process.env.MUSIC_CHANNEL, music.chat.id, music.message_id)
      await ctx.api.sendMessage(1913245253, `کاربر ${message.chat.first_name} با ایدی ${message.chat.id} موزیک ${title} را دانلود کرد`)
    }
  } else {
    await ctx.reply("لطفا از صحیح بودن لینک ارسالی اطمینان حاصل کنید")
  }
 
}

export default sendMusicLink
