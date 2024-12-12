import { PrismaClient } from "@prisma/client";
import createError from "http-errors";
import { Context, Markup } from "telegraf";
import { noOneLikesYouMsg } from "../common/messages";
import { mainMenu } from "../bot/keyboards";
import { numberToString, stringToNumber } from "../common/constant";

class MainMenuService {
    private prisma: PrismaClient = new PrismaClient();

    private async getUser(id: number) {
        const user = await this.prisma.user.findUnique({
          where: {
            id: numberToString(id),
          },
          include: {
            address: true,
            searchSetting: true,
          },
        });
        if (!user) {
          throw new createError.NotFound("User not found");
        }
        return user;
      }

      // if user likes you back
      async likesYou(id: number, ctx: Context) {
        const user = await this.prisma.user.findUnique({
          where: {
            id: numberToString(id),
          },
          select: {
            likesYou: true
          }
        });
        
        if(!user) {
          await ctx.reply("User not found");
          return;
        }

        if (user.likesYou.length === 0) {
            await ctx.reply(noOneLikesYouMsg, mainMenu());
            return;
        }
    
        const lastUser = user.likesYou[user.likesYou.length - 1];
        const lastUserProfile = await this.getUser(stringToNumber(lastUser));
    
        const profileKeyboard = Markup.inlineKeyboard([
            Markup.button.url('👤 View Profile', `http://t.me/LuvflingsBot/luvflings?startapp=${lastUserProfile.id}`),
            Markup.button.callback('❤️', `like_back_${lastUserProfile.id}`)
        ]);
    
        await ctx.replyWithPhoto(
            lastUserProfile.profilePhoto ? lastUserProfile.profilePhoto : "", 
            {
                caption: `${lastUserProfile.firstName} likes you!`,
                reply_markup: profileKeyboard.reply_markup,
            }
        );
    }
}

export default MainMenuService;