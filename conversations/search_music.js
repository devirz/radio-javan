import { showSearchResults } from "../src/searchMusic.js";

// conversation entry
export default async function searchMusicConversation(conversation, ctx) {
  // 1. سوال از کاربر
  await ctx.reply("نام آهنگ یا خواننده را وارد کنید:");
  // 2. منتظر پاسخ کاربر
  const { message } = await conversation.wait();
  const text = message?.text?.trim();
  if (!text) {
    await ctx.reply("لطفا فقط نام آهنگ یا خواننده را به صورت متن وارد کنید!");
    return;
  }
  // 3. نمایش نتایج جستجو
  await showSearchResults(ctx, text);
}