import { Telegraf } from "telegraf";
import { SettingsMenu } from "../../enums/botEnums";
import {
  searchSettingMenu,
  profileMenu,
  settingsMenu,
  mainMenu,
} from "../keyboards";
import { userProfileMsg } from "../../common/messages";
import { UserService } from "../../backend/user.service";
import { VipService } from "../../backend/vip.service";
import { Markup } from "telegraf";
import redisClient from "../../backend/redisClient";

export function registerSettingsMenuHandlers(
  bot: Telegraf,
  userService: UserService,
  vipService: VipService,
) {
  
  
  bot.hears(SettingsMenu.SEARCH_SETTING, async (ctx) => {
    await ctx.reply("Setup your search settings", searchSettingMenu);
  });

  bot.hears(SettingsMenu.PROFILE, async (ctx) => {
    try {
      const loadingMessage = await ctx.reply("⏳");
      const loadingMessageId = loadingMessage.message_id;
      
      const profile = await ctx.state.user;
      
      // console.log({profile});
      
      const msgToSend = userProfileMsg(profile);
      // console.log({msgToSend});
      
      const inlineKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.url(
            "👤 Profile",
            `http://t.me/LuvflingsBot/luvflings?startapp=${ctx.message.from.id}`
          ),
        ],
      ]);

      if (profile.profilePhoto) {
        try {
          await ctx.replyWithPhoto(
            { url: profile.profilePhoto },
            { caption: msgToSend, reply_markup: inlineKeyboard.reply_markup }
          );
        } catch (error) {
          // console.log("Error sending photo:", error);
          await ctx.reply(msgToSend, {
            reply_markup: inlineKeyboard.reply_markup,
          });
        }
      } else {
        await ctx.reply(msgToSend, {
          reply_markup: inlineKeyboard.reply_markup,
        });
      }

      await ctx.reply("Setup your profile 👇", {
        reply_markup: profileMenu.reply_markup,
      });
      await ctx.deleteMessage(loadingMessageId);
    } catch (error) {
      // console.log(error);
      
      await ctx.reply("An error occurred while processing your request.");
    }
  });

  bot.hears(SettingsMenu.BOOST, (ctx) => {
    ctx.reply("Coming Soon", mainMenu(ctx.from.id));
  });

  bot.hears(SettingsMenu.VIP, async (ctx) => {
    await vipService.getVipMessage(ctx);
  });

  bot.hears(SettingsMenu.MAIN_MENU, (ctx) => {
    ctx.reply("Main menu", mainMenu(ctx.from.id));
  });
}
