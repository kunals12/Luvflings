import { createClient } from "redis";

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || "redis"}:${
    process.env.REDIS_PORT || 6379
  }`,
});

redisClient.on("error", (err: any) => console.log("Redis Client Error", err));

(async () => {
  await redisClient.connect();
})();

export default redisClient;
