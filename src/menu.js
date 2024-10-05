import { Menu } from "@grammyjs/menu"
import { InputMediaBuilder, InputFile } from "grammy"
import sendMusicLink from "../conversations/send_music_link.js"
import client from "../db/index.js"

const token = "883737:6474575682c66"
let meow = []
let counter = 0;

client.connect().then(() => console.log("connected to redis."))

setInterval(async () => {
  const response = await fetch(`https://one-api.ir/radiojavan/?token=${token}&action=new_songs`)
  const result = await response.json()
  if(result.status === 200){
    meow = result.result
    await client.set("musics", JSON.stringify(result.result))
  }
}, 5 * 60 * 1000);


function updateMusics(){
  const { id, title, link, photo, plays, artist, song, likes, dislikes, downloads } = meow[counter]
  const caption = `
  │ -ID: ${id}
│ -Title: ${title}
│ •[Plays] ${plays}
│ •[Artist] ${artist}
│ •[Song] ${song}
│ •[Likes] ${likes}
│ •[Dislikes] ${dislikes}
│ •[Downloads] ${downloads}
 `
  const media = InputMediaBuilder.photo(meow[counter].photo, {
    caption
  })
  return media
}
const indexMenu = new Menu("index", { onMenuOutdated: false })
.text("جدیدترین آهنگ ها", async ctx => {
  const results = await client.get("musics")
  const res = JSON.parse(results)
  meow = res
  //console.log(results.data)
  if(res){
    const { id, title, link, photo, plays, artist, song, likes, dislikes, downloads } = res[counter]
    const caption = `
    │ -ID: ${id}
│ -Title: ${title}
│ •[Plays] ${plays}
│ •[Artist] ${artist}
│ •[Song] ${song}
│ •[Likes] ${likes}
│ •[Dislikes] ${dislikes}
│ •[Downloads] ${downloads}
    `
    await ctx.replyWithPhoto(meow[counter].photo, {
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
  const response = await fetch(`https://one-api.ir/radiojavan/?token=${token}&action=search&q=${query}`)
})
.row()
.url("پشتیبانی", "https://t.me/AppModule")

const downloadAndNextBtn = new Menu("dl-nxt", { onMenuOutdated: false })
.text("Download", async ctx => {
  const msg = ctx.update.callback_query.message.caption
  const songId = msg.match(/ID: (\d+)/)[1]
  const song = meow.find(item => item.id === Number(songId))
  const uploadMsg = await ctx.reply("درحال آپلود...")
  ctx.chatAction = "upload_audio"
  await ctx.replyWithAudio(new InputFile({ url: song.link }))
  await ctx.api.deleteMessage(uploadMsg.chat.id, uploadMsg.message.message_id)
})
.row()
.text("< Prev", async ctx => {
  if(counter === 0){
    await ctx.answerCallbackQuery("این اخرین اهنگه رو به جلو برو")
  } else if(counter === meow.length){
    await ctx.answerCallbackQuery("این اخرین اهنگه رو به عقب برو")
  } else {
    counter--
    const newMedia = updateMusics()
    await ctx.editMessageMedia(newMedia)
  }
})
.text("Next >", async ctx => {
  counter++
  const newMedia = updateMusics()
  await ctx.editMessageMedia(newMedia)
})

export { indexMenu, downloadAndNextBtn }
