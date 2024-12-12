import { PrismaClient } from "@prisma/client";
import createError from "http-errors";
import { Context, Markup } from "telegraf";
import { mainMenu } from "../bot/keyboards";
import { SendGiftAmount } from "../enums/botEnums";
import { sendGiftMap } from "../bot/handlers/actionHandler";
import { recommendationMsg, userBalanceMsg } from "../common/messages";
import redisClient from "./redisClient";
import { AnswerService } from "./answer.service";
import { numberToString } from "../common/constant";

const prisma = new PrismaClient();
interface RecommendationCacheEntry {
  timestamp: number;
  data: any[];
}

const recommendationCache: { [userId: number]: RecommendationCacheEntry } = {};
const CACHE_TTL = 60; // 15 min in milliseconds

class StartService {
  private prisma: PrismaClient = prisma;
  private ansService: AnswerService = new AnswerService();
  // private userService: UserService = new UserService();
  private async getUserFromCache(id: number) {
    const cacheKey = `user:${id}`;
    const cachedUser = await redisClient.get(cacheKey);
    if (cachedUser) {
      // console.log("Returning user from cached data");
      return JSON.parse(cachedUser);
    }
    return null;
  }

  private async cacheUser(id: number, user: any) {
    const cacheKey = `user:${id}`;
    await redisClient.set(cacheKey, JSON.stringify(user), {
      EX: CACHE_TTL,
    });
  }

  private async getUser(id: number) {
    const cachedUser = await this.getUserFromCache(id);
    if (cachedUser) {
      // console.log("cached user returning");

      return cachedUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: numberToString(id) },
      select: {
        firstName: true,
        age: true,
        gifts: true,
        gender: true,
        address: {
          select: {
            city: true,
            country: true,
          },
        },
        lastSeen: true,
      },
    });

    if (!user) {
      throw new createError.NotFound("User not found");
    }

    await this.cacheUser(id, user);
    return user;
  }

  private extractRelevantUserData(user: any) {
    return {
      firstName: user.firstName,
      age: user.age,
      gender: user.gender,
      gifts: user.gifts,
      address: {
        city: user.address?.city,
        country: user.address?.country,
      },
    };
  }

  private async getRecommendations(user: any) {
    // console.log(user.gender);

    const recommendGender = user.gender === "MALE" ? "FEMALE" : "MALE";
    // console.log({ recommendGender });

    return await this.prisma.user.findMany({
      where: {
        gender: recommendGender,
        AND: [
          {
            profilePhoto: {
              not: {
                equals: '', // Ensure profilePhoto is not an empty string
              },
            },
          },
          {
            profilePhoto: {
              not: {
                equals: null, // Ensure profilePhoto is not null
              },
            },
          },
        ],
        // address: {
        //   country: user.address?.country,
        // },
      },
      select: {
        id: true,
        firstName: true,
        profilePhoto: true,
        address: {
          select: {
            city: true,
            country: true,
            state: true,
          },
        },
        age: true,
        gender: true,
        likesYou: true,
        gifts: true,
        balance: true,
        lastSeen: true,
      },
    });
  }

  private async cacheRecommendations(userId: number, recommendations: any) {
    const cacheKey = `recommendations:${userId}`;
    await redisClient.set(cacheKey, JSON.stringify(recommendations), {
      EX: CACHE_TTL,
    });
  }

  private async getRecommendationsFromCache(userId: number) {
    const cacheKey = `recommendations:${userId}`;
    const cachedRecommendations = await redisClient.get(cacheKey);
    if (cachedRecommendations) {
      console.log("returning from cached data");
      
      return JSON.parse(cachedRecommendations);
    }
    return null;
  }

  async fetchAndCacheRecommendations(userData: any) {
    const userId = userData.id;
    const recommendations = await this.getRecommendations(userData);
    await this.cacheRecommendations(userId, recommendations);
    console.log("fetching and caching recommendations");
    
    return recommendations;
  }

  async showRecommendations(ctx: Context, userId: number) {
    const user = await ctx.state.user;

    // set users gendar
    if (!user.gender) {
      const inlineKeyboard = Markup.inlineKeyboard([
        Markup.button.callback("Male", "setGenderMale"),
        Markup.button.callback("Female", "setGenderFemale"),
        Markup.button.callback("Other", "setGenderOther"),
      ]);
      await ctx.reply("Select your gender", inlineKeyboard);
      return;
    }

    if (!user.profilePhoto) {
      await ctx.reply("Please set your profile photo first. Then try again", mainMenu(userId));
      return;
    }

    let recommendations = await this.getRecommendationsFromCache(userId);
    // console.log({recommendations});
    

    if (!recommendations) {
      // console.log("Fetching and caching recommendations");
      recommendations = await this.fetchAndCacheRecommendations(user);
    }

    if (recommendations.length === 0) {
      await ctx.reply("No recommendations available at the moment.", mainMenu(userId));
      return;
    }

    try {
      const randomRecommendation =
      recommendations[Math.floor(Math.random() * recommendations.length)];
    const recommendationMessage = recommendationMsg(randomRecommendation);

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("💜", `like_${randomRecommendation.id}`),
        Markup.button.callback("❌", `dislike_${randomRecommendation.id}`),
      ],
      [
        Markup.button.url(
          "👤 Profile",
          `http://t.me/LuvflingsBot/luvflings?startapp=${randomRecommendation.id}`
        ),
        Markup.button.callback(
          "🎁 Send gift",
          `sendGift_${randomRecommendation.id}`
        ),
      ],
    ]);

    if (randomRecommendation.profilePhoto) {
      await ctx.replyWithPhoto(
        {
          url: randomRecommendation.profilePhoto || "",
        },
        { caption: recommendationMessage, reply_markup: keyboard.reply_markup }
      );
    } else {
      await ctx.reply(recommendationMessage, {
        reply_markup: keyboard.reply_markup,
      });
    }

    // Track profile checks and ask a question if needed
    await this.ansService.trackProfileChecksAndAskQuestion(ctx, userId);
    } catch (error) {
      // console.log(error); 
    }
  }

  async sendGifts(
    ctx: Context,
    from: number,
    to: number,
    amount: SendGiftAmount
  ) {
    const user = await ctx.state.user;

    if (user.balance < amount) {
      // TODO: if balance is less then give msg to buy some coins
      await ctx.reply("You don't have enough balance");
      userBalanceMsg(ctx);
      return;
    }

    await this.prisma.user.update({
      where: {
        id: numberToString(from),
      },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    await this.prisma.user.update({
      where: {
        id: numberToString(to),
      },
      data: {
        // balance: {
        //   increment: amount,
        // },
        gifts: {
          // increment by 1
          increment: +1,
        },
      },
    });

    let giftMessage = "";

    switch (amount) {
      case 10:
        giftMessage = "💐";
        break;
      case 15:
        giftMessage = "🍫";
        break;
      case 20:
        giftMessage = "🧁";
        break;
      case 25:
        giftMessage = "🧸";
        break;
      default:
        break;
    }

    if (giftMessage) {
      await ctx.reply(giftMessage, mainMenu(from));
      // Send a message to the recipient
      const inlineKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.url(
            "👤 View Profile",
            `http://t.me/LuvflingsBot/luvflings?startapp=${from}`
          ),
        ],
      ]);

      await ctx.telegram.sendMessage(
        to,
        `You have received a ${giftMessage} from ${user.firstName}!`,
        {
          reply_markup: inlineKeyboard.reply_markup,
        }
      );
    }

    sendGiftMap.delete(from);
  }
}

export default StartService;
