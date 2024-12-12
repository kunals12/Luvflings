import { PrismaClient } from "@prisma/client";
import { userStates } from "../bot/bot";
import { Context } from "telegraf";
import redisClient from "./redisClient";
import { numberToString } from "../common/constant";

const prisma = new PrismaClient();

export class AnswerService {
  async trackProfileChecksAndAskQuestion(ctx: Context, userId: number) {
    const profileCheckKey = `profileCheck:${userId}`;
    // console.log({ profileCheckKey });

    // Check if the profile check counter already exists
    const profileCheckCount = await redisClient.get(profileCheckKey);

    if (!profileCheckCount) {
      // If not, set it to 0
      await redisClient.set(profileCheckKey, 0, {
        EX: 3600, // 1 hour
      });
    }

    // Increment the profile check counter
    const incrementedProfileCheckCount = await redisClient.incr(
      profileCheckKey
    );
    // console.log({ incrementedProfileCheckCount });

    // If the counter reaches 5, reset it and ask a question
    if (incrementedProfileCheckCount >= 5) {
      await redisClient.del(profileCheckKey);
      await this.askUserQuestion(ctx, userId);
    }
  }

  // Method to ask a question to the user
  async askUserQuestion(ctx: Context, userId: number) {
    // Get the last answered question ID for the user
    const lastAnswer = await prisma.userResponse.findFirst({
      where: { userId: numberToString(userId) },
      orderBy: { questionId: "desc" },
      select: { questionId: true },
    });

    let nextQuestion;
    if (lastAnswer) {
      // Fetch the next question with a higher ID than the last answered question
      nextQuestion = await prisma.question.findFirst({
        where: { id: { gt: lastAnswer.questionId } },
        orderBy: { id: "asc" },
      });
    } else {
      // If no answers found, start from the first question
      nextQuestion = await prisma.question.findFirst({
        orderBy: { id: "asc" },
      });
    }

    if (nextQuestion) {
      await ctx.reply(nextQuestion.question, {
        reply_markup: { force_reply: true },
      });
      userStates.set(userId, { waitingFor: `question_${nextQuestion.id}` });
    } else {
      await ctx.reply("You have answered all the questions. Thank you!");
    }
  }

  // Method to get a random question from the database
  async getRandomQuestion() {
    const questions = await prisma.question.findMany();
    return questions[Math.floor(Math.random() * questions.length)];
  }

  async createAnswer(userId: number, questionId: number, response: string) {
    return await prisma.userResponse.create({
      data: {
        userId: numberToString(userId),
        questionId,
        response,
      },
    });
  }

  async getAnswersByUser(userId: number) {
    return await prisma.userResponse.findMany({
      where: {
        userId: numberToString(userId),
      },
      include: {
        question: true,
      },
    });
  }
}
