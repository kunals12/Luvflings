import { Context } from "telegraf";
import { UserService } from "./user.service";
import { vipAdvertisement } from "../common/messages";
import { inlineKeyboard } from "telegraf/typings/markup";
import { balanceMenuForDisconnectedWallet } from "../bot/keyboards";
import cron from "node-cron";
import { isAfter } from "date-fns";
import { PrismaClient } from "@prisma/client";
import { numberToString } from "../common/constant";

const prisma = new PrismaClient();

export class VipService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getVipMessage(ctx: Context) {
    const loaderMessage = await ctx.reply("⏳");
    const user = await ctx.state.user;

    if (!user.isPremium) {
      await ctx.replyWithMarkdownV2(
        vipAdvertisement,
        balanceMenuForDisconnectedWallet
      );
      await ctx.deleteMessage(loaderMessage.message_id);

      return; // Exit the function early if user is not a VIP
    } else {
      await ctx.replyWithMarkdownV2("💎 *You are a VIP member\\!*");
      await ctx.deleteMessage(loaderMessage.message_id);
    }

    // Additional code to handle the VIP message
  }

  async expirePlan(id: number) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: numberToString(id),
        },
        select: {
          premiumExpirationDate: true,
        },
      });

      const now = new Date();

      if (user?.premiumExpirationDate && isAfter(now, new Date(user.premiumExpirationDate))) {
        await prisma.user.update({
            where: {id: numberToString(id)},
            data: {
                isPremium: false,
                premiumMonths: "NONE",
                premiumExpirationDate: null,
            }
        })
      }
      return true;
    } catch (error) {
      // console.log("Error checking premium expiration:");
    }
  }
}
