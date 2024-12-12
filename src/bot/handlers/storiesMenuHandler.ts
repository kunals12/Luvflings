import { Markup, Telegraf } from "telegraf";
import { PublishStorySetting, StoriesMenu } from "../../enums/botEnums";
import {  mainMenu, publishStoryBackBtn, searchSettingMenu, storiesMenu, storyFilterMenu } from "../keyboards";
import redisClient from "../../backend/redisClient";
import Stories from "../../backend/stories.service"
import { Story } from "@prisma/client";


export function registerStoriesMenuHandlers(bot: Telegraf) {
  

  bot.hears(StoriesMenu.FILTERS, (ctx) => {
    ctx.reply("You selected Filters", storyFilterMenu);
  });

  bot.hears(StoriesMenu.NEXT, async (ctx) => {
    const loaderMsg = await ctx.reply("⏳");
    
    // Instantiate the Stories service with the current context
    const storiesService = new Stories(ctx);

    // Get stories based on the user's gender and send them
    await storiesService.getStories(ctx.from.id);
    await ctx.deleteMessage(loaderMsg.message_id);
  });

  bot.hears(StoriesMenu.MAIN_MENU, (ctx) => {
    ctx.reply("Main menu", mainMenu(ctx.from.id));
  });

//   bot.hears(StoriesMenu.MY_STORIES, async (ctx) => {
//     // Define your custom keyboard
// const myStoriesKeyboard = Markup.keyboard([
//   [Markup.button.url("👤 Profile", `http://t.me/LuvflingsBot/luvflings?startapp=${ctx.from.id}`)],
// ]).resize(); // .resize() adjusts the keyboard size to fit the screen

//   await ctx.reply("You selected My Stories", myStoriesKeyboard);
//   });

  bot.hears(StoriesMenu.PUBLISH_STORY, async (ctx) => {
    await redisClient.set(`story:${ctx.from.id}`, JSON.stringify(ctx.from.id));
    ctx.reply("Send your story to publish", publishStoryBackBtn);
  });

  bot.hears(PublishStorySetting.PUBLISH_BACK, (ctx) => {
    ctx.reply("Back", storiesMenu);
  });

  // bot.hears(StoriesMenu.FIRE_EMOJI, (ctx) => {
  //   ctx.reply("You selected Fire Emoji");
  // });

  // bot.hears(StoriesMenu.LAUGHING_EMOJI, (ctx) => {
  //   ctx.reply("You selected Laughing Emoji");
  // });

  // bot.hears(StoriesMenu.SAD_EMOJI, (ctx) => {
  //   ctx.reply("You selected Sad Emoji");
  // });

  // bot.hears(StoriesMenu.LOVE_EMOJI, (ctx) => {
  //   ctx.reply("You selected Love Emoji");
  // });

  // bot.hears(StoriesMenu.SHOCKED_EMOJI, (ctx) => {
  //   ctx.reply("You selected Shocked Emoji");
  // });
}
