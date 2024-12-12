import { Telegraf, Markup } from "telegraf";
import { Profile } from "../../enums/botEnums";
import { userLocationSettingMenu, settingsMenu, mainMenu } from "../keyboards";

export function registerProfileHandlers(bot: Telegraf, userStates: Map<number, { waitingFor: string | null }>) {
  bot.hears(Profile.NAME, async (ctx) => {
    const userId = ctx.from.id;

    // Set the state to wait for the name input
    userStates.set(userId, { waitingFor: "name" });
    await ctx.reply("What is your new name?");
  });

  bot.hears(Profile.ABOUT, async (ctx) => {
    const userId = ctx.from.id;

    // Set the state to wait for the about input
    userStates.set(userId, { waitingFor: "about" });

    await ctx.reply("Tell us about yourself");
  });

  bot.hears(Profile.DATE_OF_BIRTH, async (ctx) => {
    const userId = ctx.from.id;

    // Set the state to wait for the dob input
    userStates.set(userId, { waitingFor: "dob" });

    await ctx.reply(
      "Please enter your date of birth in the format YYYY-MM-DD."
    );
  });

  bot.hears(Profile.PHOTO, async (ctx) => {
    const userId = ctx.from.id;

    // Set the state to wait for the profilePic input
    userStates.set(userId, { waitingFor: "profilePic" });
    await ctx.reply("Send your pic to save as your profile pic");
  });

  bot.hears(Profile.LOCATION, (ctx) =>
    ctx.reply("Setup your location", userLocationSettingMenu)
  );

  bot.hears(Profile.PRODILE_GENDER, async (ctx) => {
    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.callback("Male", "setGenderMale"),
      Markup.button.callback("Female", "setGenderFemale"),
      Markup.button.callback("Other", "setGenderOther"),
    ]);
    await ctx.reply("Select your gender", inlineKeyboard);
  });

  bot.hears(Profile.BACK, (ctx) => ctx.reply("Settings", settingsMenu));

  bot.hears(Profile.MAIN_MENU, (ctx) => ctx.reply("Main menu", mainMenu(ctx.from.id)));
}
