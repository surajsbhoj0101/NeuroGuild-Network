import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || "redis",
      port: Number(process.env.REDIS_PORT) || 6379,
    });

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redis;