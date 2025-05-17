import { Menu } from "@grammyjs/menu";
import { InputMediaBuilder, InputFile } from "grammy";
import client from "../db/index.js";

/**
 * جستجوی موزیک بر اساس نام
 * @param {string} name
 * @returns {Promise<Array>} آرایه موزیک‌ها یا پیغام خطا
 */
export async function searchMusic(name) {
  const response = await fetch("https://play.radiojavan.com/api/p/search?query=" + encodeURIComponent(name), {
    headers: {
      "accept": "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9,fa;q=0.8",
      "x-api-key": "40e87948bd4ef75efe61205ac5f468a9fd2b970511acf58c49706ecb984f1d67",
      "x-rj-user-agent": "Radio Javan/4.0.2/badeda3b3ffa2488d32128a49526270ca7aa6f2e com.radioJavan.rj.web",
      // سایر هدرها قابل حذف است مگر اینکه واقعا نیاز باشد!
    },
    method: "GET"
  });
  if (response.status === 200) {
    const data = await response.json();
    const musics = data.mp3s.map(music => ({
      id: music.id,
      title: music.title,
      link: music.link,
      photo: music.photo,
      plays: music.plays,
      likes: music.likes,
      dislikes: music.dislikes,
      downloads: music.downloads,
      duration: music.duration,
    }));
    return musics;
  } else {
    return [];
  }
}

/**
 * ساخت کپشن موزیک
 */
function musicCaption(music) {
  return `
│ -ID: ${music.id}
│ •[Title] ${music.title}
│ •[Plays] ${music.plays}
│ •[Likes] ${music.likes}
│ •[Dislikes] ${music.dislikes}
│ •[Downloads] ${music.downloads}
│ •[Duration] ${music.duration}
  `;
}

/**
 * ارسال نتایج جستجو به کاربر و ذخیره وضعیت در ردیس
 */
export async function showSearchResults(ctx, name) {
  const from = ctx.msg.chat.id;
  const musics = await searchMusic(name);
  if (!musics.length) {
    await ctx.reply("آهنگی پیدا نشد!");
    return;
  }
  // ذخیره نتایج و وضعیت کاربر در ردیس
  await client.set(`search:${from}:result`, JSON.stringify(musics));
  await client.set(`search:${from}:counter`, 0);
  const music = musics[0];
  await ctx.replyWithPhoto(music.photo, {
    caption: musicCaption(music),
    reply_markup: searchMusicMenu,
  });
}

/**
 * ساخت منوی جستجو با دکمه‌های قبلی/بعدی/دانلود
 */
const searchMusicMenu = new Menu("searchMusicMenu", { onMenuOutdated: false })
  .text("⬅️ قبلی", async ctx => {
    const from = ctx.msg.chat.id;
    let counter = Number(await client.get(`search:${from}:counter`)) || 0;
    const musics = JSON.parse(await client.get(`search:${from}:result`)) || [];
    if (counter <= 0) {
      await ctx.answerCallbackQuery("اولین آهنگ!");
      return;
    }
    counter--;
    await client.set(`search:${from}:counter`, counter);
    const music = musics[counter];
    const media = InputMediaBuilder.photo(music.photo, { caption: musicCaption(music) });
    await ctx.editMessageMedia(media);
  })
  .text("دانلود 🎵", async ctx => {
    const from = ctx.msg.chat.id;
    let counter = Number(await client.get(`search:${from}:counter`)) || 0;
    const musics = JSON.parse(await client.get(`search:${from}:result`)) || [];
    const music = musics[counter];
    const uploadMsg = await ctx.reply("درحال آپلود...");
    ctx.chatAction = "upload_audio";
    await ctx.replyWithAudio(new InputFile({ url: music.link }));
    await ctx.api.deleteMessage(uploadMsg.chat.id, uploadMsg.message_id);
  })
  .text("بعدی ➡️", async ctx => {
    const from = ctx.msg.chat.id;
    let counter = Number(await client.get(`search:${from}:counter`)) || 0;
    const musics = JSON.parse(await client.get(`search:${from}:result`)) || [];
    if (counter >= musics.length - 1) {
      await ctx.answerCallbackQuery("آخرین آهنگ!");
      return;
    }
    counter++;
    await client.set(`search:${from}:counter`, counter);
    const music = musics[counter];
    const media = InputMediaBuilder.photo(music.photo, { caption: musicCaption(music) });
    await ctx.editMessageMedia(media);
  });

export default searchMusicMenu;