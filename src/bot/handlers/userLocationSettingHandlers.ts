import { Telegraf } from "telegraf";
import { UserLocationSetting } from "../../enums/botEnums";

export function registerUserLocationSettingHandlers(bot: Telegraf, userStates: Map<number, { waitingFor: string | null }>) {
  bot.hears(UserLocationSetting.CITY, async (ctx) => {
    const userId = ctx.from.id;
    // Set the state to wait for the about input
    userStates.set(userId, { waitingFor: "user-city" });
    await ctx.reply("Tell us your city");
  });

  bot.hears(UserLocationSetting.STATE, async (ctx) => {
    const userId = ctx.from.id;
    // Set the state to wait for the about input
    userStates.set(userId, { waitingFor: "user-state" });
    await ctx.reply("Tell us your state");
  });

  bot.hears(UserLocationSetting.COUNTRY, async (ctx) => {
    const userId = ctx.from.id;
    // Set the state to wait for the about input
    userStates.set(userId, { waitingFor: "user-country" });
    await ctx.reply("Tell us your country");
  });
}
