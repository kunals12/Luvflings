import { Context, MiddlewareFn } from "telegraf";
import { LRUCache } from "lru-cache";
import prisma from "../../common/prisma";
import { numberToString } from "../../common/constant";

const CACHE_MAX_ITEMS = 10000;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes
const BATCH_INTERVAL = 120000; // 5 minute

const lastSeenCache = new LRUCache<number, Date>({
  max: CACHE_MAX_ITEMS,
  ttl: CACHE_TTL,
});

const updateLastSeen: MiddlewareFn<Context> = async (ctx, next) => {
  const userId = ctx.from?.id;

  if (userId) {
    const now = new Date();
    lastSeenCache.set(userId, now);
  }

  return next();
};

const batchUpdateLastSeen = async () => {
  const updates: any = [];

  lastSeenCache.forEach((lastSeen, userId) => {
    updates.push(
      prisma.user.update({
        where: { id: numberToString(userId) },
        data: { lastSeen: lastSeen },
      })
    );
  });

  await Promise.all(updates);
  lastSeenCache.clear();
};

// Schedule batch updates
setInterval(batchUpdateLastSeen, BATCH_INTERVAL);

export { updateLastSeen };
