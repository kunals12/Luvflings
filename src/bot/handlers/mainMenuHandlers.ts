import { Markup, Telegraf } from "telegraf";
import { MainMenu, StoriesMenu } from "../../enums/botEnums";
import { storiesMenu, settingsMenu, mainMenu } from "../keyboards";
import StartService from "../../backend/start.service";
import MainMenuService from "../../backend/mainMenu.service";
import { userBalanceMsg } from "../../common/messages";
import Stories from "../../backend/stories.service";
import { ReplyKeyboardMarkup } from "telegraf/typings/core/types/typegram";

export function registerMainMenuHandlers(
  bot: Telegraf,
  startService: StartService,
  mainMenuService: MainMenuService
) {
  bot.hears(MainMenu.STORIES, async (ctx) => {
    // TODO: Redirect to tma to see self stories
    // const storiesMenuu = Markup.keyboard([
    //   [
    //     StoriesMenu.FILTERS,
    //     Markup.button.url(
    //       "My Stories",
    //       `http://t.me/LuvflingsBot/luvflings?startapp=${ctx.from.id}`
    //     ),
    //   ],
    //   [StoriesMenu.NEXT, StoriesMenu.MAIN_MENU],
    //   [StoriesMenu.PUBLISH_STORY],
    // ]).resize();

    /*
    // TODO : Uncomment for later use...Now just showing comming soon
    await ctx.reply("Checkout Stories", storiesMenu);
    const loaderMsg = await ctx.reply("⏳");

    // Instantiate the Stories service with the current context
    const storiesService = new Stories(ctx);

    // Get stories based on the user's gender and send them
    await storiesService.getStories(ctx.from.id);
    await ctx.deleteMessage(loaderMsg.message_id);
    */
   await ctx.reply("Coming Soon", mainMenu(ctx.from.id));
  });

  bot.hears(MainMenu.START, async (ctx) => {
    const userId = ctx.message.from.id;
    const loader = await ctx.reply("⏳");
    await startService.showRecommendations(ctx, userId);
    await ctx.deleteMessage(loader.message_id);
  });

  bot.hears(MainMenu.MATCHES, (ctx) => {
    ctx.reply("You selected Matches");
  });

  bot.hears(MainMenu.LIKES_YOU, async (ctx) => {
    const loader = await ctx.reply("⏳");
    await mainMenuService.likesYou(ctx.message.from.id, ctx);
    await ctx.deleteMessage(loader.message_id);
  });

  bot.hears(MainMenu.SETTINGS, (ctx) => {
    ctx.reply("You selected Settings", settingsMenu);
  });

  bot.hears(MainMenu.WALLET, async (ctx) => {
    try {
      await userBalanceMsg(ctx);
    } catch (error) {
      // console.log(error);
      await ctx.reply("An error occurred while processing your request.");
    }
  });

  bot.hears(MainMenu.HELP, (ctx) => {
    ctx.reply("You selected Help");
  });

  bot.hears(MainMenu.ABOUT, (ctx) => {
    ctx.reply("You selected About");
  });
}
