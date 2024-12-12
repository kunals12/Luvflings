import { PrismaClient, Gender, PremiumMonths } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import { numberToString } from '../../common/constant';

const prisma = new PrismaClient();

const NUM_USERS = 30; // Number of users to create

const randomGender = (): Gender => {
  const genders = [Gender.MALE, Gender.FEMALE, Gender.OTHER];
  return genders[Math.floor(Math.random() * genders.length)];
};

const randomPremiumMonths = (): PremiumMonths => {
  const premiumMonths = [
    PremiumMonths.NONE,
    PremiumMonths.THREE_MONTHS,
    PremiumMonths.SIX_MONTHS,
    PremiumMonths.TWELVE_MONTHS,
  ];
  return premiumMonths[Math.floor(Math.random() * premiumMonths.length)];
};

const generateUserData = () => {
  const id = Math.floor(Math.random() * 1000000); // Random numeric id for `Int`
  const gender = randomGender();

  // Generate story data
  const stories = Array.from({ length: 3 }, () => ({
    id: uuidv4(),
    imgUrl: `https://avatars.githubusercontent.com/u/${faker.number.int({ min: 10000, max: 99999 })}?v=4`,
    content: faker.lorem.sentence(),
    createdAt: faker.date.recent(),
  }));

  return {
    id: numberToString(id),
    username: faker.internet.userName(),
    firstName: faker.name.firstName(),
    dob: faker.date.past(30),
    age: faker.number.int({ min: 18, max: 60 }),
    gender,
    about: faker.lorem.sentence(),
    profilePhoto: `https://avatars.githubusercontent.com/u/${faker.number.int({ min: 10000, max: 99999 })}?v=4`,
    photos: Array.from({ length: 3 }, () => `https://avatars.githubusercontent.com/u/${faker.number.int({ min: 10000, max: 99999 })}?v=4`),
    isVerified: faker.datatype.boolean(),
    likesYou: [], // empty array
    balance: faker.number.int({ min: 0, max: 1000 }),
    gifts: faker.number.int({ min: 0, max: 100 }),
    isPremium: faker.datatype.boolean(),
    premiumMonths: randomPremiumMonths(),
    premiumExpirationDate:
      randomPremiumMonths() !== PremiumMonths.NONE
        ? faker.date.future()
        : null, // Only set if the user is premium
    address: {
      create: {
        id: uuidv4(),
        line1: faker.location.streetAddress(),
        line2: faker.location.secondaryAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        zip: faker.location.zipCode(),
      },
    },
    searchSetting: {
      create: {
        id: uuidv4(),
        gender: randomGender(),
        age: faker.number.int({ min: 18, max: 60 }),
        location: faker.location.city(),
      },
    },
    stories: {
      create: stories,
    },
  };
};

const seed = async () => {
  // console.log('Start seeding...');

  for (let i = 0; i < NUM_USERS; i++) {
    const userData = generateUserData();
    await prisma.user.create({
      data: userData,
    });
  }

  // console.log('Seeding finished.');
};

seed()
  .catch((e) => {
    // console.log(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
