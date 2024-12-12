import redisClient from '../../backend/redisClient';
import { Context, MiddlewareFn } from 'telegraf';
import { UserService } from '../../backend/user.service';
import createError from 'http-errors';

const userService = new UserService();

const checkUserInCache: MiddlewareFn<Context> = async (ctx: Context, next) => {

  const user = ctx.message?.from || ctx.from;
  const cacheKey = `user:${user?.id}`;

  try {
    // Check if the user already exists in Redis
    const cachedUser = await redisClient.get(cacheKey);

    if (cachedUser) {
      // console.log('User found in cache');
      ctx.state.user = JSON.parse(cachedUser); // Store user data in context state
    } else {
      // console.log('User not found in cache');
      if (!user?.id) {
        
        // console.log('User ID not found');
        return;
      }

      const dbUser = await userService.getUser(user.id);
      // Cache user data
      await redisClient.set(cacheKey, JSON.stringify(dbUser), {
        EX: 3600, // Cache for 1 hour
      });
      ctx.state.user = dbUser; // Store user data in context state
    }

    await next();
  } catch (error) {
    if (error instanceof createError.NotFound) {
      // console.log('User not found in database');
    //   await ctx.reply('Creating your account');
    } else {
      // console.log('An error occurred:', error);
    //   await ctx.reply('An unexpected error occurred');
    }
  }
};

export { checkUserInCache };
