import { Gender, Story } from "@prisma/client";
import { Context, Markup } from "telegraf";
import redisClient from "./redisClient";
import prisma from "../common/prisma";
import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { formatDistanceToNow } from "date-fns";

class Stories {
  private ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  private async fetchAndCacheStories(id: number): Promise<Story[]> {
    // Retrieve the user from Redis
    const user = await redisClient.get(`user:${id}`);

    // If user is not found in Redis, reply with an error message
    if (!user) {
      await this.ctx.reply("User Not Found");
      return [];
    }

    // Parse the user object as it is stored as a string in Redis
    const parsedUser = JSON.parse(user);
    // console.log({ parsedUser });

    // Extract the user's gender
    const searchGenderFor: Gender =
      parsedUser.gender === Gender.MALE
        ? Gender.FEMALE
        : parsedUser.gender === Gender.FEMALE
        ? Gender.MALE
        : Gender.OTHER;
    // console.log({ searchGenderFor });

    // Fetch stories where the story owner's gender matches the user's gender
    const stories = await prisma.story.findMany({
      where: {
        user: {
          gender: searchGenderFor,
        },
      },
      include: {
        user: true,
      },
    });

    // Shuffle the fetched stories
    for (let i = stories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [stories[i], stories[j]] = [stories[j], stories[i]];
    }

    // Store the shuffled stories in Redis with an expiration time (e.g., 1 hour)
    await redisClient.setEx(
      `recommendedStories:${id}`,
      3600,
      JSON.stringify(stories)
    );

    // Return the shuffled stories
    return stories;
  }

  private async getCachedStories(id: number): Promise<Story[] | null> {
    const cachedStories = await redisClient.get(`recommendedStories:${id}`);
    return cachedStories ? JSON.parse(cachedStories) : null;
  }

  public async getStories(id: number) {
    try {
      let stories = await this.getCachedStories(id);

      // If stories are not cached, fetch from the database and cache them
      if (!stories) {
        stories = await this.fetchAndCacheStories(id);
      }

      // Send the stories to the user
      if (stories.length > 0) {
        // Select a random story from the list
        const randomIndex = Math.floor(Math.random() * stories.length);
        // console.log({ randomIndex });

        const story = stories[randomIndex];

        const storyUser = await prisma.user.findUnique({
          where: {
            id: story.userId,
          },
          select: {
            id: true,
            username: true,
            firstName: true,
            age: true,
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

        if (storyUser) {
          const lastSeenFormatted = storyUser.lastSeen
            ? formatDistanceToNow(new Date(storyUser.lastSeen), {
                addSuffix: true,
              })
            : "";

          // Build the caption with user details and story content
          // const caption = `${storyUser.firstName}, ${storyUser.age}, ${storyUser.address?.city}, ${storyUser.address?.country}, (${lastSeenFormatted}) \n\n${story.content || "No content"}`;
          const caption = `${story.content || "No content"}`;
          // Create an inline keyboard with user details
          const inlineKeyboard: InlineKeyboardMarkup = {
            inline_keyboard: [
              [
                Markup.button.callback("🔥", `story_reaction_fire_${story.id}`),
                Markup.button.callback(
                  "😂",
                  `story_reaction_laugh_${story.id}`
                ),
                Markup.button.callback("😍", `story_reaction_love_${story.id}`),
                Markup.button.callback("😭", `story_reaction_cry_${story.id}`),
                Markup.button.callback(
                  "🤯",
                  `story_reaction_mindBlowing_${story.id}`
                ),
              ],
              [
                Markup.button.url(
                  "👤 Profile",
                  `http://t.me/LuvflingsBot/luvflings?startapp=${storyUser.id}`
                ),
              ],
            ],
          };

          // Send the story with the caption and inline keyboard
          await this.ctx.replyWithPhoto(story.imgUrl, {
            caption: caption,
            reply_markup: inlineKeyboard,
          });
        } else {
          await this.ctx.reply("User details not found.");
        }

        //   await this.ctx.replyWithPhoto(story.imgUrl, {
        //     caption: story.content || "No content",
        //   });
      } else {
        await this.ctx.reply("No stories found.");
      }
    } catch (error) {
      // console.log(error);
    }
  }

  public async updateStoryFilter(id: number) {
    try {
      
    } catch (error) {
      
    }
  }
}

export default Stories;
