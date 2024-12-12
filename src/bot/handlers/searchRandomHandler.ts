import { Telegraf } from "telegraf";
import { StartMenu } from "../../enums/botEnums";
import { mainMenu, sendGiftMenu } from "../keyboards";

export function registerSearchRandomHandlers(bot: Telegraf) {
  bot.hears(StartMenu.LIKE, (ctx) => {
    ctx.reply("You selected Like");
  });

  bot.hears(StartMenu.UNLIKE, (ctx) => {
    ctx.reply("You selected Unlike");
  });

  bot.hears(StartMenu.VIEW, (ctx) => {
    ctx.reply("You selected View");
  });

  bot.hears(StartMenu.SEND_GIFT, (ctx) => {
    ctx.reply("Send Gift", sendGiftMenu);
  });

  bot.hears(StartMenu.MAIN_MENU, (ctx) => {
    ctx.reply("Main menu", mainMenu(ctx.from.id));
  });
}
