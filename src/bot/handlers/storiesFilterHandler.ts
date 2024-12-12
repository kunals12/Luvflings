import { Context, Telegraf } from "telegraf";
import { StoryFilter } from "../../enums/botEnums";
import { storiesMenu } from "../keyboards";

export async function storiesFilterHandlers(bot: Telegraf) {
    bot.hears(StoryFilter.LOCATION, (ctx:Context) => {
        ctx.reply("Comming Soon");
    });

    bot.hears(StoryFilter.STORY_FILTER_GENDER, (ctx:Context) => {
        ctx.reply("Comming Soon", storiesMenu);
    });

    bot.hears(StoryFilter.AGE, (ctx:Context) => {
        ctx.reply("Comming Soon");
    });

    bot.hears(StoryFilter.BACK, (ctx:Context) => {
        ctx.reply("Comming Soon");
    });
}