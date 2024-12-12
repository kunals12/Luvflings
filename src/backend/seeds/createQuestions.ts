import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const questions = [
    {
      "question": "What are your favorite hobbies or activities to do in your free time?",
      "category": "Personal Preferences"
    },
    {
      "question": "What type of music do you enjoy listening to the most?",
      "category": "Personal Preferences"
    },
    {
      "question": "Do you prefer reading books or watching movies? What's your favorite?",
      "category": "Personal Preferences"
    },
    {
      "question": "What kind of cuisine do you enjoy the most?",
      "category": "Personal Preferences"
    },
    {
      "question": "Are you an early bird or a night owl?",
      "category": "Personal Preferences"
    },
    {
      "question": "Do you prefer indoor activities or outdoor activities?",
      "category": "Personal Preferences"
    },
    {
      "question": "What kind of vacations do you enjoy – beach, mountains, city, or countryside?",
      "category": "Personal Preferences"
    },
    {
      "question": "Do you have any favorite sports or physical activities?",
      "category": "Personal Preferences"
    },
    {
      "question": "What is your favorite way to relax and unwind?",
      "category": "Personal Preferences"
    },
    {
      "question": "Are you more of a coffee person or a tea person?",
      "category": "Personal Preferences"
    },
    {
      "question": "How do you usually spend your weekends?",
      "category": "Lifestyle"
    },
    {
      "question": "What is your daily routine like?",
      "category": "Lifestyle"
    },
    {
      "question": "Do you enjoy traveling? What’s the best place you’ve visited?",
      "category": "Lifestyle"
    },
    {
      "question": "How often do you exercise, and what kind of workouts do you prefer?",
      "category": "Lifestyle"
    },
    {
      "question": "What does a typical meal look like for you? Do you follow any specific diet?",
      "category": "Lifestyle"
    },
    {
      "question": "How important is a healthy lifestyle to you?",
      "category": "Lifestyle"
    },
    {
      "question": "How do you manage stress in your life?",
      "category": "Lifestyle"
    },
    {
      "question": "Do you have any pets? If so, what kind?",
      "category": "Lifestyle"
    },
    {
      "question": "What are your favorite ways to spend time with friends?",
      "category": "Lifestyle"
    },
    {
      "question": "How do you balance work and personal life?",
      "category": "Lifestyle"
    },
    {
      "question": "What qualities do you value most in a romantic partner?",
      "category": "Relationships"
    },
    {
      "question": "How do you typically show affection in a relationship?",
      "category": "Relationships"
    },
    {
      "question": "What is the most important thing you look for in a relationship?",
      "category": "Relationships"
    },
    {
      "question": "How do you handle conflicts or disagreements in a relationship?",
      "category": "Relationships"
    },
    {
      "question": "What is your love language (words of affirmation, acts of service, receiving gifts, quality time, physical touch)?",
      "category": "Relationships"
    },
    {
      "question": "How do you feel about public displays of affection?",
      "category": "Relationships"
    },
    {
      "question": "What are your views on sharing responsibilities in a relationship?",
      "category": "Relationships"
    },
    {
      "question": "How important is communication to you in a relationship?",
      "category": "Relationships"
    },
    {
      "question": "What are your thoughts on long-distance relationships?",
      "category": "Relationships"
    },
    {
      "question": "What is your ideal date night?",
      "category": "Relationships"
    }
  ];  

  for (const question of questions) {
    await prisma.question.create({
      data: question,
    });
  }

  // console.log('Questions added to the database.');
}

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
