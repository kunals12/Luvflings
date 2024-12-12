import { Telegraf, Markup } from "telegraf";
import { SearchSetting } from "../../enums/botEnums";
import { settingsMenu, mainMenu } from "../keyboards";
import redisClient from "../../backend/redisClient";

export function registerSearchSettingHandlers(
  bot: Telegraf,
  userStates: Map<number, { waitingFor: string | null }>
) {
  bot.hears(SearchSetting.LOCATION, async (ctx) => {
    const userId = ctx.from.id;
    // Set the state to wait for the about input
    userStates.set(userId, { waitingFor: "search-location" });
    await ctx.reply("Tell us your preferred location");
  });

  bot.hears(SearchSetting.SEARCH_GENDER, async (ctx) => {
      const inline_keyboard = Markup.inlineKeyboard([
        Markup.button.callback("Male", "searchSettingGenderMale"),
        Markup.button.callback("Female", "searchSettingGenderFemale"),
        Markup.button.callback("Other", "searchSettingGenderOther"),
      ]);
      await ctx.reply(
        "Tell us your preferred gender to search for...",
        inline_keyboard
      );
  });

  bot.hears(SearchSetting.AGE, async (ctx) => {
    const userId = ctx.from.id;
    // Set the state to wait for the about input
    userStates.set(userId, { waitingFor: "search-age" });
    await ctx.reply("Tell us your preferred age to search for...");
  });

  bot.hears(SearchSetting.BACK, async (ctx) => {
    ctx.reply("Settings", settingsMenu);
  });

  bot.hears(SearchSetting.MAIN_MENU, async (ctx) => {
    ctx.reply("Main menu", mainMenu(ctx.from.id));
  });
}
