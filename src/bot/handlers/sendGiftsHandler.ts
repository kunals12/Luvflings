import { Telegraf } from "telegraf";
import { SendGift, SendGiftAmount } from "../../enums/botEnums";
import { sendGiftMap } from "./actionHandler";
import StartService from "../../backend/start.service";

export function registerSendGiftHandlers(
  bot: Telegraf,
  startService: StartService
) {
  bot.hears(SendGift.FLOWERS, async (ctx) => {
    const from = ctx.message.from.id;
    const to = sendGiftMap.get(ctx.message.from.id);
    // console.log({ from, to });

    if (!to) {
      await ctx.reply("Something went wrong, please try again");
      return;
    }

    await startService.sendGifts(ctx, from, to, SendGiftAmount.FLOWERS);
  });

  bot.hears(SendGift.CANDIES, async (ctx) => {
    const from = ctx.message.from.id;
    const to = sendGiftMap.get(ctx.message.from.id);
    // console.log({ from, to });

    if (!to) {
      await ctx.reply("Something went wrong, please try again");
      return;
    }

    await startService.sendGifts(ctx, from, to, SendGiftAmount.CANDIES);
  });

  bot.hears(SendGift.DESSERT, async (ctx) => {
    const from = ctx.message.from.id;
    const to = sendGiftMap.get(ctx.message.from.id);
    // console.log({ from, to });

    if (!to) {
      await ctx.reply("Something went wrong, please try again");
      return;
    }

    await startService.sendGifts(ctx, from, to, SendGiftAmount.DESSERT);
  });

  bot.hears(SendGift.SOFT_TOY, async (ctx) => {
    const from = ctx.message.from.id;
    const to = sendGiftMap.get(ctx.message.from.id);
    // console.log({ from, to });

    if (!to) {
      await ctx.reply("Something went wrong, please try again");
      return;
    }

    await startService.sendGifts(ctx, from, to, SendGiftAmount.SOFT_TOY);
  });
}
