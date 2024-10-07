import { Menu } from "@grammyjs/menu"
import { InputMediaBuilder, InputFile } from "grammy"
import { readFileSync } from "fs"
import sendMusicLink from "../conversations/send_music_link.js"
import client from "../db/index.js"

const token = "883737:6474575682c66"
const texts = JSON.parse(readFileSync("./text.json"))
let meow = []
let counter = 0;

client.connect().then(() => console.log("connected to redis."))
/*
;(async () => {
  const response = await fetch(`https://one-api.ir/radiojavan/?token=${token}&action=new_songs`)
  const result = await response.json()
  console.log(result)
  if(result.status === 200){
    await client.set("musics", JSON.stringify(result.result))
  }
})()
*/

async function updateMusics(userCounter){
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  const { id, title, link, photo, plays, artist, song, likes, dislikes, downloads } = musics[userCounter]
  const caption = `
  │ •[ID] ${id}
│ •[Title] ${title}
│ •[Plays] ${plays}
│ •[Artist] ${artist}
│ •[Song] ${song}
│ •[Likes] ${likes}
│ •[Dislikes] ${dislikes}
│ •[Downloads] ${downloads}
 `
  const media = InputMediaBuilder.photo(photo, {
    caption
  })
  return media
}
const indexMenu = new Menu("index", { onMenuOutdated: false })
.text("جدیدترین آهنگ ها", async ctx => {
  const results = await client.get("musics")
  const res = JSON.parse(results)
  const from = ctx.msg.chat.id
  await client.set(`user:${from}:counter`, 0)
  meow = res
  //console.log(results.data)
  if(res){
    const { id, title, link, photo, plays, artist, song, likes, dislikes, downloads } = res[0]
    const caption = `
    │ •[ID] ${id}
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
  await ctx.editMessageText("این بخش موقتا غیرفعال میباشد", {
    reply_markup: backBtn
  })
  //const response = await fetch(`https://one-api.ir/radiojavan/?token=${token}&action=search&q=${query}`)
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
  const msg = ctx.update.callback_query.message.caption
  const songId = msg.match(/ID: (\d+)/)[1]
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  const song = musics.find(item => item.id === Number(songId))
  const uploadMsg = await ctx.reply("درحال آپلود...")
  ctx.chatAction = "upload_audio"
  await ctx.replyWithAudio(new InputFile({ url: song.link }))
  await ctx.api.deleteMessage(uploadMsg.chat.id, uploadMsg.message_id)
  //await ctx.api.deleteMessage(uploadMsg.chat.id, uploadMsg.message.message_id)
})
.row()
.text("< Prev", async ctx => {
  const from = ctx.msg.chat.id
  //await client.decr(`user:${from}:counter`)
  let userCounter = Number(await client.get(`user:${from}:counter`))
  console.log(`user counter is ${userCounter}`)
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  if(userCounter === 0){
    await ctx.answerCallbackQuery("این اخرین اهنگه رو به جلو برو")
    //await client.set(`user:${from}:counter`, 0)
  } else if(userCounter === result.length){
    await ctx.answerCallbackQuery("این اخرین اهنگه رو به عقب برو")
  } else {
    await client.decr(`user:${from}:counter`)
    userCounter--
    const media = await updateMusics(userCounter)
    await ctx.editMessageMedia(media)
  }
})
.text("Next >", async ctx => {
  const from = ctx.msg.chat.id
  await client.incr(`user:${from}:counter`)
  let userCounter = Number(await client.get(`user:${from}:counter`))
  console.log(`user counter is ${userCounter}`, typeof userCounter)
  const result = await client.get("musics")
  const musics = JSON.parse(result)
  //await client.incr(`user:${from}:counter`)
  userCounter++
  const media = await updateMusics(userCounter)
  await ctx.editMessageMedia(media)
})

export { indexMenu, downloadAndNextBtn, backBtn }
