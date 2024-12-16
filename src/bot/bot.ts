import { Telegraf } from "telegraf";

import * as dotenv from "dotenv";
import { mainMenu, profileMenu } from "./keyboards";
import { UserService } from "../backend/user.service";
import { ProfileUpdater } from "./handlers/textHandler";
import { uploadToS3 } from "../backend/aws-upload";
import https from "https";
import WalletActions from "./handlers/actionHandler";
import StartService from "../backend/start.service";
import MainMenuService from "../backend/mainMenu.service";
import { updateLastSeen } from "./middlewares/updateLastSeen";
import { VipService } from "../backend/vip.service";
import { registerMainMenuHandlers } from "./handlers/mainMenuHandlers";
import { registerSettingsMenuHandlers } from "./handlers/settingMenuHandler";
import { registerStoriesMenuHandlers } from "./handlers/storiesMenuHandler";
import { registerSearchRandomHandlers } from "./handlers/searchRandomHandler";
import { registerSendGiftHandlers } from "./handlers/sendGiftsHandler";
import { registerProfileHandlers } from "./handlers/profileMenuHandlers";
import { registerUserLocationSettingHandlers } from "./handlers/userLocationSettingHandlers";
import { registerSearchSettingHandlers } from "./handlers/searchSettingHandlers";
import redisClient from "../backend/redisClient";
import { checkUserInCache } from "./middlewares/cachedUser";
// import TelegramGroupService from "./handlers/createChannel";

dotenv.config();

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined in the environment variables");
}

// In-memory storage for simplicity
export const userStates = new Map<
  number,
  {
    waitingFor:
      | "name"
      | "about"
      | "dob"
      | "profilePic"
      | "search-location"
      | "search-gender"
      | "search-age"
      | "user-city"
      | "user-country"
      | "user-state"
      | `question_${number}`
      | "msg-reply"
      | null;
  }
>();

class TelegramBot {
  private bot: Telegraf;
  private userService: UserService;
  private vipService: VipService;
  private startService: StartService;
  private mainMenu: MainMenuService;
  // private telegramGroupService: TelegramGroupService;

  // Initialize wallet actions

  constructor(token: string) {
    this.bot = new Telegraf(token);
    this.userService = new UserService();
    this.vipService = new VipService();
    this.startService = new StartService();
    this.mainMenu = new MainMenuService();
    this.initializeBot();
    // this.telegramGroupService = new TelegramGroupService();
    // Initialize wallet actions
    new WalletActions(this.bot);
    // this.telegramGroupService.connectAndSaveSession();
  }

  private async initializeBot() {
    try {
      this.bot.use(updateLastSeen);
      this.bot.start(async (ctx) => {
        const user = ctx.message;
        const { id, username, first_name } = user.from;
      
        try {
          // Beautiful Welcome Message
          await ctx.reply(
            `🌟 Welcome to LuvFlings, ${first_name}! 🌟\n\n💕 Find your perfect match today. Swipe, connect, and start chatting now!`,
            mainMenu(id)
          );
      
          if (!username) {
            await ctx.reply(
              "It looks like you don't have a Telegram username set. Please go to your Telegram settings and set a username, then try again."
            );
            return; // Exit if username is not provided
          }
      
          // Attempt to create user
          await this.userService.createUser({
            id: id,
            username: username,
            firstName: first_name,
          });
      
          await ctx.reply("NOTE: The profiles you will receive are just for demo purposes.");
        } catch (error:any) {
          if (error.response && error.response.error_code === 403) {
            console.error("Bot was blocked by the user, cannot send messages:", error);
            // Optionally, notify admin or log this event for later review
          } else {
            console.error("Error while starting the bot:", error);
            await ctx.reply("Oops! Something went wrong. Please try again later.");
          }
        }
      });
      

      this.bot.use(checkUserInCache);

      registerMainMenuHandlers(this.bot, this.startService, this.mainMenu);
      registerSettingsMenuHandlers(this.bot, this.userService, this.vipService);
      registerStoriesMenuHandlers(this.bot);
      registerSearchRandomHandlers(this.bot);
      registerSendGiftHandlers(this.bot, this.startService);
      registerProfileHandlers(this.bot, userStates);
      registerUserLocationSettingHandlers(this.bot, userStates);
      registerSearchSettingHandlers(this.bot, userStates);

      // Handle incoming messages
      this.bot.on("text", async (ctx) => {
        const userId = ctx.from.id;
        const cacheKey = `user:${userId}`;

        // Check if the user is in the process of updating their name
        const userState = userStates.get(userId);
        const profileUpdater = new ProfileUpdater(ctx, userState);
        await profileUpdater.handleTextConditions();
        userStates.delete(userId);
        if (
          userState?.waitingFor !== "search-location" &&
          userState?.waitingFor !== "search-age" &&
          userState?.waitingFor !== "search-gender"
        ) {
          await redisClient.del(cacheKey);
        }
      });

      this.bot.on("photo", async (ctx) => {
        const photoArray = ctx.message.photo;
        const loaderMsg = await ctx.reply("Setting profile picture..⏳");

        const fileId = photoArray[2].file_id;
        const file = await ctx.telegram.getFileLink(fileId);
        let fileUrl = file.protocol + "//" + file.host + "/" + file.pathname;
        try {
          const fileName = `${ctx.from.id}.jpg`;
          const buffer = await new Promise<Buffer>((resolve, reject) => {
            const req = https.get(fileUrl, (res) => {
              const data: Uint8Array[] = [];
              res.on("data", (chunk) => data.push(chunk));
              res.on("end", () => resolve(Buffer.concat(data)));
            });
            req.on("error", reject);
          });
          fileUrl = await uploadToS3(buffer, fileName);
        } catch (error) {
          await ctx.reply("something went wrong");
        }
        // console.log({ fileUrl });

        // TODO: Fix story feature
        if (await redisClient.get(`story:${ctx.from.id}`)) {
          try {
            const userStory = await this.userService.uploadStory(
              ctx.from.id,
              fileUrl
            );
            if (userStory) {
              await ctx.replyWithPhoto(userStory.imgUrl, {
                caption: "Story uploaded successfully✅",
                reply_markup: profileMenu.reply_markup,
              });
            }
            await ctx.deleteMessage(loaderMsg.message_id);
            await redisClient.del(`story:${ctx.from.id}`);
            return;
          } catch (error) {
            await ctx.reply(
              "Failed to create story, please try again later",
              profileMenu
            );
            return;
          }
        }

        await this.userService.updateProfilePic(ctx.from.id, fileUrl);
        await ctx.deleteMessage(loaderMsg.message_id);
        await ctx.reply("Profile picture set successfully✅", profileMenu);
        await redisClient.del(`user:${ctx.message.from.id}`);
      });
    } catch (error) {
      console.log("error", error);
      // throw error;
    }
  }

  public launch() {
    this.bot
      .launch()
      .then(() => console.log("Bot started successfully"))
      .catch((e) => console.log("Failed to start bot:", e));

    process.once("SIGINT", () => this.bot.stop("SIGINT"));
    process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
  }
}

export default TelegramBot;
