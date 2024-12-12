import { Telegraf, Context, Markup } from "telegraf";
import ConnectWallet from "../../wallet/connect";
// import cron from "node-cron";
import { getWallets } from "../../wallet/wallet";
import {
  handleDisconnectCommand,
  handleSendTXCommand,
  onOpenUniversalQRClick,
  onWalletClick,
} from "../../wallet/connect-wallet-menu";
import {
  Gender,
  PremiumMonths,
  PrismaClient,
  StoryReactions,
} from "@prisma/client";
import { UserService } from "../../backend/user.service";
import StartService from "../../backend/start.service";
import { mainMenu, sendGiftMenu } from "../keyboards";
import {
  likedYouMsg,
  recommendationMsg,
  sendGiftMsg,
  userBalanceMsg,
} from "../../common/messages";
import MainMenuService from "../../backend/mainMenu.service";
// import { createCombinedImage } from "../../common/mergeImage";
import { VipPlansPrices } from "../../enums/botEnums";
import redisClient from "../../backend/redisClient";
import Stories from "../../backend/stories.service";
import { v4 as uuidv4 } from "uuid";
import { numberToString } from "../../common/constant";

// import { createGroup } from "./createChannel";

// create map
export const sendGiftMap = new Map<number, number>();

// Function to empty the 'likesYou' array for all users
// const clearLikesYouArray = async () => {
//   try {
//     // console.log("Clearing 'likesYou' arrays...");
//     const prisma = new PrismaClient();
//     await prisma.user.updateMany({
//       data: {
//         likesYou: [],
//       },
//     });
//     // console.log("'likesYou' arrays cleared.");
//   } catch (error) {
//     // console.log("Error clearing 'likesYou' arrays:", error);
//   }
// };

// // Schedule the task to run every 12 hours
// cron.schedule('0 */12 * * *', async () => {
//   await clearLikesYouArray();
// });

// Define a type for the reactions
type ReactionType = "fire" | "laugh" | "love" | "cry" | "mindBlowing";

// Map reactions to Prisma StoryReaction enum values
const reactionMap: Record<ReactionType, StoryReactions> = {
  fire: StoryReactions.FIRE,
  laugh: StoryReactions.LAUGH,
  love: StoryReactions.LOVE,
  cry: StoryReactions.CRY,
  mindBlowing: StoryReactions.MIND_BLOWING,
};

class WalletActions {
  private bot: Telegraf<Context>;
  private prisma = new PrismaClient();
  private userService = new UserService();
  private startSearvice = new StartService();
  private mainMenuService = new MainMenuService();

  constructor(bot: Telegraf<Context>) {
    this.bot = bot;
    this.registerActions();
  }

  private registerActions() {
    this.bot.action(/dislike_(\d+)/, async (ctx) => {
      await ctx.reply("❌");
      await this.startSearvice.showRecommendations(ctx, ctx.from.id);
    });

    // Function to handle 'like' button clicks
    this.bot.action(/like_(\d+)/, async (ctx) => {
      const likedUserId =parseInt(ctx.match[1]);
      // console.log({ likedUserId });

      const senderId = ctx.from.id;

      const user = await this.userService.getUser(senderId);

      const thisUserData = await this.prisma.user.findUnique({
        where: {
          id: numberToString(senderId),
        },
        select: {
          likesYou: true,
          balance: true,
        },
      });

      const likedUserData = await this.prisma.user.findUnique({
        where: {
          id: numberToString(likedUserId),
        },
        select: {
          likesYou: true,
          balance: true,
        },
      })

      // console.log({ thisUserData });
      if(!thisUserData) {
        await ctx.reply("Please try later");
        return;
      }

      if (thisUserData?.balance < 25) {
        await ctx.reply("You don't have enough balance");
        // TODO: Buy from wallet
        userBalanceMsg(ctx);
        return;
      }

      if (likedUserData?.likesYou.length) {
        const isAlreadyLiked = likedUserData.likesYou.some(
          (i) => i === numberToString(senderId)
        );
        if (isAlreadyLiked) {
          await ctx.reply("You have already liked this user");
          // Optionally, you can show the updated recommendation
          await this.startSearvice.showRecommendations(ctx, senderId);
          return;
        }
      }

      await ctx.reply("💜", mainMenu(senderId));
      // console.log(123);
      

      // deduct users balance by 25
      await this.prisma.user.update({
        where: {
          id: numberToString(senderId),
        },
        data: {
          balance: {
            decrement: 25,
          },
        },
      });
      // Update the 'likesYou' list for the liked user
      await this.prisma.user.update({
        where: {
          id: numberToString(likedUserId),
        },
        data: {
          likesYou: {
            push: numberToString(senderId),
          },
        },
      });

      // Send a message to the liked user
      if (likedUserId) {
        // Ensure the liked user has a stored chat ID
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback("💕See who likes you", `likedYou_${senderId}`),
        ]);

        // Check if user.profilePhoto is a valid URL
        const photoUrl =
          user.profilePhoto && user.profilePhoto.startsWith("http")
            ? user.profilePhoto
            : "";

        if (photoUrl) {
          await ctx.telegram.sendPhoto(
            likedUserId,
            photoUrl, // Send the sender's profile photo
            {
              caption: likedYouMsg(user.firstName),
              reply_markup: keyboard.reply_markup,
            }
          );
        } else {
          await ctx.telegram.sendMessage(
            likedUserId,
            likedYouMsg(user.firstName),
            {
              reply_markup: keyboard.reply_markup,
            }
          );
        }
      }
      // TODO: Uncomment for later use...
      // Optionally, you can show the updated recommendation
      // await this.startSearvice.showRecommendations(ctx, senderId);
      return;
    });

    // Optimized like_back action
    this.bot.action(/like_back_(\d+)/, async (ctx) => {
      const loaderMsg = await ctx.reply("⏳");
      const likedUserId = parseInt(ctx.match[1]);
      const thisUser = ctx.from.id;

      // Update the 'likesYou' list for the liked user
      try {
        const thisUserData = await this.prisma.user.findUnique({
          where: {
            id: numberToString(thisUser),
          },
          select: {
            id: true,
            matches: {
              select: {
                matchedUsername: true,
              },
            },
            username: true,
            firstName: true,
            profilePhoto: true,
            likesYou: true,
          },
        });
        const LikedUser = await this.prisma.user.findUnique({
          where: {
            id: numberToString(likedUserId),
          },
          select: {
            id: true,
            username: true,
            firstName: true,
            profilePhoto: true,
            likesYou: true,
          },
        });

        // console.log(thisUserData?.matches.length);
        let isLikedBackk: boolean = false;
        // Use some() to check if likedUserId exists in the matches array
        // console.log({ thisUserData });

        isLikedBackk =
          LikedUser?.likesYou?.some((i) => i === thisUserData?.id) || false;
        // console.log({ isLikedBackk });

        if (isLikedBackk) {
          await ctx.reply("Already Like", mainMenu(thisUser));

          const message = `<a href="https://t.me/${LikedUser?.username}">Click here</a> to open Telegram DM`;
          await ctx.telegram.sendMessage(thisUser, message, {
            parse_mode: "HTML",
          });
          await ctx.deleteMessage(loaderMsg.message_id);
          return;
        } else {
          if (!thisUserData || !LikedUser) {
            throw new Error("User not found");
          }

          // console.log(123455);
          let thisUserMatch;
          let likedUserMatch;
          
          try {
             // Create new matches for both users first
          thisUserMatch = await this.prisma.matches.create({
            data: {
              id: uuidv4(),
              userId: numberToString(thisUser), // This user's ID
              matchedUserId: numberToString(likedUserId), // Matched user's ID
              matchedUsername: LikedUser?.username, // Username of the matched user
              firstname: LikedUser.firstName,
              matchedProfilePic:
                LikedUser?.profilePhoto ||
                "https://luvflings-assets.s3.amazonaws.com/luvflings.png", // Fallback profile pic for the matched user
            },
          });

          likedUserMatch = await this.prisma.matches.create({
            data: {
              id: uuidv4(),
              userId: numberToString(likedUserId), // Liked user's ID
              matchedUserId: numberToString(thisUser), // This user's ID (match back)
              firstname: thisUserData.firstName,
              matchedUsername: thisUserData?.username, // Username of this user (matched user)
              matchedProfilePic:
                thisUserData?.profilePhoto || "default_profile_pic_url", // Fallback profile pic for this user
            },
          });

          // console.log({ thisUserMatch, likedUserMatch });
          } catch (error) {
            // console.log({error});
            throw error;
          }

          // Now update both users' `matches[]` with the newly created match entries
          await Promise.all([
            this.prisma.user.update({
              where: {
                id: numberToString(likedUserId),
              },
              data: {
                likesYou: {
                  push: numberToString(thisUser), // Push the current user's ID into `likesYou` array
                },
                matches: {
                  connect: { id: likedUserMatch.id }, // Connect the `thisUserMatch` entry to this user
                },
              },
            }),
            this.prisma.user.update({
              where: {
                id: numberToString(thisUser),
              },
              data: {
                matches: {
                  connect: { id: thisUserMatch.id }, // Connect the `likedUserMatch` entry to this user
                },
              },
            }),
          ]);

          await ctx.reply("🎉", mainMenu(thisUser));
          await ctx.reply("🎉", mainMenu(likedUserId));
          // TODO: Add inline keyboard for this
          const message = `🎉 <b>It's a Match!</b> 🎉\n\nYou and <a href="https://t.me/${thisUserData?.username}">${thisUserData?.firstName}</a> liked each other! Start chatting and see where this goes!\n\n<a href="https://t.me/${thisUserData?.username}">Click here</a> to send them a message on Telegram.`;
          const message1 = `🎉 <b>It's a Match!</b> 🎉\n\nYou and <a href="https://t.me/${LikedUser?.username}">${LikedUser?.firstName}</a> liked each other! Don't wait, reach out and say hello!\n\n<a href="https://t.me/${LikedUser?.username}">Click here</a> to open a Telegram chat.`;
          await ctx.telegram.sendMessage(likedUserId, message, {
            parse_mode: "HTML",
          });
          await ctx.telegram.sendMessage(thisUser, message1, {
            parse_mode: "HTML",
          });
        }

        await ctx.deleteMessage(loaderMsg.message_id);

        // await telegramGroupService.connect();
        // Create a new group with only the bot as admin
        // const groupTitle = `Luvflings_ ${thisUser} and ${likedUserId}`;
        // const groupTitle = `Luvflings_ ${thisUser} annnd ${likedUserId}`;
        // // console.log("creating group");

        // const group = await createGroup([thisUser, likedUserId],groupTitle);
        // // console.log({group});

        // Generate invite link for the group
        // await sendInviteLink(thisUser);
        // await sendInviteLink(likedUserId);

        // Call create group and invite here
      } catch (error) {
        // console.log("Error updating likes and matches:", error);
        await ctx.reply("Error updating likes and matches, please try later");
      }

      /*
      // Fetch both profiles and include both profile photos into one and send to both
      const [likedUserPhoto, thisUserPhoto] = await Promise.all([
        this.prisma.user.findUnique({
          where: {
            id: likedUserId,
          },
          select: {
            profilePhoto: true,
          },
        }),
        this.prisma.user.findUnique({
          where: {
            id: thisUser,
          },
          select: {
            profilePhoto: true,
          },
        }),
      ]);

      // Create combined image
      if (likedUserPhoto?.profilePhoto && thisUserPhoto?.profilePhoto) {
        const combinedImage = await createCombinedImage(
          likedUserPhoto.profilePhoto,
          thisUserPhoto.profilePhoto
        );

        // TODO: Show Buffer Image and handle errors
        // Reply with combined picture
        if (combinedImage) {
          await ctx.replyWithPhoto(
            { source: combinedImage },
            {
              caption: `You and ${likedUserId} have matched!`,
              reply_markup: Markup.inlineKeyboard([
                Markup.button.callback(
                  "👤 View Profile",
                  `viewProfile_${likedUserId}`
                ),
              ]).reply_markup,
            }
          );
        }
      }
      */

      // TODO: get msg from user and send to matched user
    });

    this.bot.action(/sendGift_(\d+)/, async (ctx) => {
      const likedUserId = parseInt(ctx.match[1]);
      // console.log({ likedUserId });
      sendGiftMap.set(ctx.from.id, likedUserId);

      // await this.startSearvice.sendGifts(ctx, ctx.from.id, likedUserId, 10);
      await ctx.reply(sendGiftMsg, sendGiftMenu);
    });

    // Function to handle 'likedYou' button clicks
    this.bot.action(/likedYou_(\d+)/, async (ctx) => {
      const userId = ctx.from.id;

      await this.mainMenuService.likesYou(userId, ctx);
    });

    this.bot.action("setGenderMale", async (ctx) => {
      try {
        const userId = ctx.from.id;

        // Call the updateProfile method with the user ID and the gender update
        await this.userService.updateProfile(userId, {
          gender: Gender.MALE,
        });

        // Respond to the user to confirm the update
        await ctx.reply("Your gender has been updated to Male.");
        await redisClient.del(`user:${userId}`);
        await redisClient.del(`recommendations:${userId}`);
        // Delete the previous message (the one that triggered the action)
        if (ctx.callbackQuery && ctx.callbackQuery.message) {
          await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        }
      } catch (error) {
        // console.log("Error updating gender:", error);
        await ctx.reply("An error occurred while updating your gender.");
      }
    });

    this.bot.action("setGenderFemale", async (ctx) => {
      try {
        const userId = ctx.from.id;

        // Call the updateProfile method with the user ID and the gender update
        await this.userService.updateProfile(userId, { gender: Gender.FEMALE });

        // Respond to the user to confirm the update
        await ctx.reply("Your gender has been updated to Female.");
        await redisClient.del(`user:${userId}`);
        await redisClient.del(`recommendations:${userId}`);
        if (ctx.callbackQuery && ctx.callbackQuery.message) {
          await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        }
      } catch (error) {
        // console.log("Error updating gender:", error);
        await ctx.reply("An error occurred while updating your gender.");
      }
    });

    this.bot.action("setGenderOther", async (ctx) => {
      try {
        const userId = ctx.from.id;

        // Call the updateProfile method with the user ID and the gender update
        await this.userService.updateProfile(userId, { gender: Gender.OTHER });

        // Respond to the user to confirm the update
        await ctx.reply("Your gender has been updated to Other.");  
        await redisClient.del(`user:${userId}`);
        await redisClient.del(`recommendations:${userId}`);
        if (ctx.callbackQuery && ctx.callbackQuery.message) {
          await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        }
      } catch (error) {
        // console.log("Error updating gender:", error);
        await ctx.reply("An error occurred while updating your gender.");
      }
    });

    this.bot.action("searchSettingGenderMale", async (ctx) => {
      const userId = ctx.from.id;
      await this.userService.updateSearchSetting(userId, {
        gender: Gender.MALE,
      });
      await ctx.reply("Your search preference has been updated.");
      await redisClient.del(`recommendations:${userId}`);
      if (ctx.callbackQuery && ctx.callbackQuery.message) {
        await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      }
    });

    this.bot.action("searchSettingGenderFemale", async (ctx) => {
      const userId = ctx.from.id;
      await this.userService.updateSearchSetting(userId, {
        gender: Gender.FEMALE,
      });
      await ctx.reply("Your search preference has been updated.");
      await redisClient.del(`recommendations:${userId}`);
      if (ctx.callbackQuery && ctx.callbackQuery.message) {
        await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      }
    });

    this.bot.action("searchSettingGenderOther", async (ctx) => {
      const userId = ctx.from.id;
      await this.userService.updateSearchSetting(userId, {
        gender: Gender.OTHER,
      });
      await ctx.reply("Your search preference has been updated.");
      await redisClient.del(`recommendations:${userId}`);
      if (ctx.callbackQuery && ctx.callbackQuery.message) {
        await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      }
    });

    this.bot.action("connect_wallet", async (ctx) => {
      const callbackQuery = ctx.update.callback_query;
      const message = callbackQuery.message;
      const chatId = callbackQuery.from.id; // Get chatId from callback query's sender

      if (message) {
        const prevMessageId = message.message_id;
        const connectWallet = new ConnectWallet();
        await connectWallet.connect(chatId, ctx);
        await ctx.answerCbQuery();
        // await ctx.reply("You clicked 'Connect Wallet'.");
        await ctx.deleteMessage(prevMessageId); // Delete the previous message
      }
    });

    this.bot.action("choose_wallet", async (ctx) => {
      // console.log("Callback Query Data:", ctx.callbackQuery);
      const wallets = await getWallets();
      // console.log(wallets);

      try {
        const keyboard = wallets.reduce(
          (acc: any[], wallet: any, index: number) => {
            const row = Math.floor(index / 2);
            if (!acc[row]) acc[row] = [];
            acc[row].push(
              Markup.button.callback(
                wallet.name,
                `select_wallet_${wallet.appName}`
              )
            );
            return acc;
          },
          []
        );

        keyboard.push([Markup.button.callback("« Back", "universal_qr")]);

        await ctx.editMessageReplyMarkup({
          inline_keyboard: keyboard,
        });
      } catch (error) {
        // console.log("Error handling 'choose_wallet' action:", error);
      }
    });

    this.bot.action("universal_qr", async (ctx) => {
      const callbackQuery = ctx.update.callback_query;
      await onOpenUniversalQRClick(ctx, callbackQuery);
    });

    this.bot.action(/select_wallet_(.+)/, async (ctx) => {
      try {
        const callbackQuery = ctx.update.callback_query;
        const walletAppName = ctx.match[1]; // Extract the wallet app name from the callback data

        // console.log(`Selected wallet: ${walletAppName}`);
        // console.log(`Callback Query Data:`, callbackQuery);

        // Here you can handle the wallet selection, for example, by calling another function or replying to the user
        await onWalletClick(ctx, callbackQuery, walletAppName);

        // Further actions based on the selected wallet can be added here
      } catch (error) {
        // console.log("Error handling 'select_wallet' action:", error);
      }
    });

    this.bot.action("disconnect_wallet", async (ctx) => {
      const message = ctx.update.callback_query.message;

      if (message) {
        const prevMessageId = message.message_id;
        await ctx.answerCbQuery();
        await handleDisconnectCommand(ctx, message);
        await ctx.deleteMessage(prevMessageId); // Delete the previous message
      }
    });

    this.bot.action("gold_plan", async (ctx) => {
      const message = ctx.update.callback_query.message;

      if (message) {
        const prevMessageId = message.message_id;
        await ctx.answerCbQuery();
        // await ctx.reply("You selected to buy 50000 coins.");
        await handleSendTXCommand(ctx, message, VipPlansPrices.GOLD);
        await ctx.deleteMessage(prevMessageId); // Delete the previous message
      }
    });

    this.bot.action("silver_plan", async (ctx) => {
      const message = ctx.update.callback_query.message;

      if (message) {
        const prevMessageId = message.message_id;
        await ctx.answerCbQuery();
        await handleSendTXCommand(ctx, message, VipPlansPrices.SILVER);
        await ctx.deleteMessage(prevMessageId); // Delete the previous message
      }
    });

    this.bot.action("bronze_plan", async (ctx) => {
      const message = ctx.update.callback_query.message;

      if (message) {
        const prevMessageId = message.message_id;
        await ctx.answerCbQuery();
        await handleSendTXCommand(ctx, message, VipPlansPrices.SILVER);
        await ctx.deleteMessage(prevMessageId); // Delete the previous message
      }
    });

    this.bot.action(/story_reaction_(.+)_(.+)/, async (ctx) => {
      const [reaction, storyId] = ctx.match.slice(1) as [ReactionType, string];
      const userId = ctx.from.id;

      // Get the correct StoryReaction enum value
      const reactionEnum = reactionMap[reaction];

      if (!reactionEnum) {
        await ctx.reply("Invalid reaction.");
        return;
      }

      // Send the corresponding emoji
      switch (reactionEnum) {
        case StoryReactions.FIRE:
          await ctx.reply("🔥");
          break;
        case StoryReactions.LAUGH:
          await ctx.reply("😂");
          break;
        case StoryReactions.LOVE:
          await ctx.reply("😍");
          break;
        case StoryReactions.CRY:
          await ctx.reply("😭");
          break;
        case StoryReactions.MIND_BLOWING:
          await ctx.reply("🤯");
          break;
        default:
          break;
      }

      // Check if the user has already reacted to this story
      const existingReaction = await this.prisma.storyReaction.findUnique({
        where: {
          userId_storyId: {
            userId: numberToString(userId),
            storyId,
          },
        },
      });

      if (existingReaction) {
        await ctx.reply("You have already reacted to this story.");
        return;
      }

      // Save the reaction
      await this.prisma.storyReaction.create({
        data: {
          userId: numberToString(userId),
          storyId,
          reaction: reactionEnum,
        },
      });

      // Fetch and send stories
      const story = new Stories(ctx);
      await story.getStories(userId);
    });
  }
}

export default WalletActions;
