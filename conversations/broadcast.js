import client from "../db/index.js";
import chunk from "lodash/chunk.js";

class Broadcaster {
  constructor(client, ctx) {
    this.client = client;
    this.ctx = ctx;
    this.sent = 0;
    this.failed = 0;
  }

  async getUsers() {
    return await this.client.sMembers("users");
  }

  async sendMessageToBatch(batch, message) {
    await Promise.all(batch.map(async (id) => {
      try {
        await this.ctx.api.copyMessage(id, message.chat.id, message.message_id);
        this.sent++;
      } catch (e) {
        this.failed++;
      }
    }));
  }

  async broadcastMessage(message) {
    const users = await this.getUsers();
    const batches = chunk(users, 10);

    for (const batch of batches) {
      await this.sendMessageToBatch(batch, message);
      await new Promise(res => setTimeout(res, 5000));
    }

    return { sent: this.sent, failed: this.failed };
  }
}

export default async function broadcastConversation(conversation, ctx) {
  await ctx.reply("پیام مورد نظر (متن، عکس، ویدیو و...) را ارسال کنید:");
  const { message } = await conversation.wait();
  if (!message) {
    await ctx.reply("پیامی دریافت نشد.");
    return;
  }

  const broadcaster = new Broadcaster(client, ctx);
  const { sent, failed } = await broadcaster.broadcastMessage(message);

  await ctx.reply(`پیام به ${sent} کاربر ارسال شد. (${failed} ناموفق)`);
}