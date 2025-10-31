import { Menu } from "@grammyjs/menu";
import client from "../db/index.js";
// import { InputFile } from "grammy";

// آیدی ادمین رباتت را اینجا بذار (میتونی چندتا هم بزاری)
const ADMIN_IDS = [1913245253]; // اینجا آیدی عددی تلگرام خودت را بذار

// تابع چک ادمین بودن
export function isAdmin(ctx) {
  return ADMIN_IDS.includes(ctx.from.id);
}

// منوی پنل ادمین
const adminMenu = new Menu("adminPanel")
  .text("📊 تعداد کاربران", async ctx => {
    if (!isAdmin(ctx)) {
      await ctx.answerCallbackQuery("دسترسی نداری");
      return;
    }
    const userCount = await client.sCard("users");
    await ctx.reply(`تعداد کاربران ربات: ${userCount}`);
  })
  .row()
  .text("📢 ارسال پیام همگانی", async ctx => {
    if (!isAdmin(ctx)) {
      await ctx.answerCallbackQuery("دسترسی نداری");
      return;
    }
    await ctx.conversation.enter("broadcastConversation");
  })

// تابع نمایش پنل ادمین (در هندلر کامند)
export async function showAdminPanel(ctx) {
  if (isAdmin(ctx)) {
      await ctx.reply("👑 پنل مدیریت:", {
          reply_markup: adminMenu
        });
    }
}

export default adminMenu;