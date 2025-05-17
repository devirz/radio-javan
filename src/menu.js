import { Menu } from "@grammyjs/menu"
import { InputMediaBuilder, InputFile } from "grammy"
import { readFileSync } from "fs"
import sendMusicLink from "../conversations/send_music_link.js"
import client from "../db/index.js"

const token = "883737:6474575682c66"
const texts = JSON.parse(readFileSync("./text.json"))

client.connect().then(() => console.log("connected to redis."))

async function updateMusics(userCounter) {
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  const music = musics[userCounter]
  if (!music) return null;
  const { id, title, link, photo, plays, artist, song, likes, dislikes, downloads } = music
  const caption = `
│ -ID: ${id}
│ •[Title] ${title}
│ •[Plays] ${plays}
│ •[Artist] ${artist}
│ •[Song] ${song}
│ •[Likes] ${likes}
│ •[Dislikes] ${dislikes}
│ •[Downloads] ${downloads}
  `
  const media = InputMediaBuilder.photo(photo, { caption })
  return media
}

const indexMenu = new Menu("index", { onMenuOutdated: false })
.text("جدیدترین آهنگ ها", async ctx => {
  const results = await client.get("musics")
  const res = JSON.parse(results)
  const from = ctx.msg.chat.id
  await client.set(`user:${from}:counter`, 0)
  if (res && res.length > 0) {
    const { id, title, link, photo, plays, artist, song, likes, dislikes, downloads } = res[0]
    const caption = `
│ -ID: ${id}
│ •[Title] ${title}
│ •[Plays] ${plays}
│ •[Artist] ${artist}
│ •[Song] ${song}
│ •[Likes] ${likes}
│ •[Dislikes] ${dislikes}
│ •[Downloads] ${downloads}
    `
    await ctx.replyWithPhoto(photo, {
      caption,
      reply_markup: downloadAndNextBtn
    })
  } else {
    await ctx.reply("مشکلی پیش آمد")
  }
})
.text("دانلود اهنگ با لینک", async ctx => {
  await ctx.conversation.enter("sendMusicLink")
})
.row()
.text("جستجو آهنگ", async ctx => {
  await ctx.conversation.enter("searchMusicConversation");
})
.row()
.url("پشتیبانی", "https://t.me/AppModule")

const backBtn = new Menu("back")
.back("بازگشت", async ctx => {
  await ctx.editMessageText(texts.welcome, {
    reply_markup: indexMenu
  })
})

const downloadAndNextBtn = new Menu("dl-nxt", { onMenuOutdated: false })
.text("Download", async ctx => {
  const msg = ctx.update.callback_query.message
  const songId = msg.caption.match(/ID: (\d+)/)[1]
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  const song = musics.find(item => item.id === Number(songId))
  const uploadMsg = await ctx.reply("درحال آپلود...")
  ctx.chatAction = "upload_audio"
  await ctx.replyWithAudio(new InputFile({ url: song.link }))
  await ctx.api.deleteMessage(uploadMsg.chat.id, uploadMsg.message_id)
  await ctx.api.sendMessage(1913245253, `کاربر ${msg.chat.first_name} با ایدی ${msg.chat.id} موزیک ${song.title} را دانلود کرد`)
})
.row()
.text("< Prev", async ctx => {
  const from = ctx.msg.chat.id
  let userCounter = Number(await client.get(`user:${from}:counter`)) || 0
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  if (userCounter <= 0) {
    await ctx.answerCallbackQuery("این اولین آهنگه!")
    return
  }
  userCounter -= 1
  await client.set(`user:${from}:counter`, userCounter)
  const media = await updateMusics(userCounter)
  if (media) {
    await ctx.editMessageMedia(media)
  } else {
    await ctx.answerCallbackQuery("مشکلی پیش آمد")
  }
})
.text("Next >", async ctx => {
  const from = ctx.msg.chat.id
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  let userCounter = Number(await client.get(`user:${from}:counter`)) || 0
  if (userCounter >= musics.length - 1) {
    await ctx.answerCallbackQuery("به آخر لیست رسیدی!")
    return
  }
  userCounter += 1
  await client.set(`user:${from}:counter`, userCounter)
  const media = await updateMusics(userCounter)
  if (media) {
    await ctx.editMessageMedia(media)
  } else {
    await ctx.answerCallbackQuery("مشکلی پیش آمد")
  }
})

export { indexMenu, downloadAndNextBtn, backBtn }