import client from "../db/index.js";
import chunk from "lodash/chunk.js";

export default async function broadcastConversation(conversation, ctx) {
  await ctx.reply("پیام مورد نظر (متن، عکس، ویدیو و...) را ارسال کنید:");
  const { message } = await conversation.wait();
  if (!message) {
    await ctx.reply("پیامی دریافت نشد.");
    return;
  }

  const users = await client.sMembers("users");
  let sent = 0, failed = 0;

  // تقسیم کاربران به گروه‌های ۱۰تایی
  const batches = chunk(users, 10);

  for (const batch of batches) {
    await Promise.all(batch.map(async (id) => {
      try {
        await ctx.api.copyMessage(id, message.chat.id, message.message_id);
        sent++;
      } catch (e) {
        failed++;
      }
    }));
    await new Promise(res => setTimeout(res, 5000));
  }

  await ctx.reply(`پیام به ${sent} کاربر ارسال شد. (${failed} ناموفق)`);
}