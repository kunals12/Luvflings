import { PremiumMonths, PrismaClient, User } from "@prisma/client";
import createError from "http-errors";
import {
  CreateUser,
  SearchDtoPartial,
  UpdateUserPartial,
  UserLocationDtoPartial,
} from "../dto/user.dto";
import { addMonths as addMonthsToDate } from "date-fns";
import { Context } from "telegraf";
import redisClient from "./redisClient";
import { v4 as uuidv4 } from "uuid";
import { numberToString } from "../common/constant";

const prisma = new PrismaClient();

export class UserService {
  private prisma: PrismaClient = prisma;

  async createUser(dto: CreateUser) {
    const { username, firstName, id } = dto;

    const cacheKey = `user:${id}`;

    try {
      // // Check if the user is cached in Redis
      const cachedUser = await redisClient.get(cacheKey);

      if (cachedUser) {
        return JSON.parse(cachedUser);
      }

      // Check if the user exists in the database
      const existingUser = await this.prisma.user.findUnique({
        where: {
          id: numberToString(id),
        },
      });

      if (!existingUser) {
        
        // Create a new user if not found in the database
        const newUser = await this.prisma.user.create({
          data: {
            id: numberToString(id),
            username,
            firstName,
          },
          select: {
            username: true,
            firstName: true,
          },
        });

        if (!newUser) {
          throw new createError.InternalServerError("Failed to create user");
        }

        // Cache the new user data
        await redisClient.set(cacheKey, JSON.stringify(newUser), {
          EX: 3600, // Cache for 1 hour
        });

        return newUser;
      }

      if (existingUser) {
        // Cache the user data
        await redisClient.set(cacheKey, JSON.stringify(existingUser), {
          EX: 3600, // Cache for 1 hour
        });
        return existingUser;
      }
    } catch (error) {
      // console.log({error});

      throw new createError.InternalServerError(
        "An error occurred while creating the user"
      );
    }
  }

  private async getUserFromCachedData(id: number) {
    const cacheKey = `user:${id}`;
    const cachedUser = await redisClient.get(cacheKey);

    if (cachedUser) {
      // console.log("returning from cached data");
      return JSON.parse(cachedUser);
    }

    return null;
  }

  private extractRelevantUserData(user: any) {
    return {
      firstName: user.firstName,
      age: user.age,
      gender: user.gender,
      gifts: user.gifts,
      address: {
        city: user.address?.city,
        country: user.address?.country,
      },
    };
  }

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: numberToString(id),
      },
      select: {
        firstName: true,
        id: true,
        gender: true,
        gifts: true,
        profilePhoto: true,
        photos: true,
        age: true,
        address: {
          select: {
            city: true,
            country: true,
          },
        },
        balance: true,
        isPremium: true,
      },
    });

    if (!user) {
      throw new createError.NotFound("User not found");
    }
    return user;
  }

  async getMatches(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: numberToString(id),
      },
      select: {
        id: true,
        username: true,
        matches: true,
      },
    });

    if (!user) {
      throw new createError.NotFound("User not found");
    }
    return user;
  }

  // async getUserById(id: number) {
  //   const user = await this.getUser(id);
  //   // console.log({ user });

  //   return {
  //     username: user.username,
  //     name: user.firstName,
  //     profilePhoto: user.profilePhoto,
  //     photos: user.photos,
  //     balance: user.balance,
  //     gifts:user.gifts,
  //     age: user.age,
  //     gender: user.gender,
  //     city: user.address?.city,
  //     country: user.address?.country,
  //   };
  // }

  async updateProfile(id: number, dto: UpdateUserPartial) {
    await this.getUser(id);

    // Construct the data object to be updated
    const updateData: UpdateUserPartial = {};

    // Check each property and add to updateData if it's provided
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.dob !== undefined) updateData.dob = dto.dob;
    if (dto.about !== undefined) updateData.about = dto.about;
    if (dto.age !== undefined) updateData.age = dto.age;
    if (dto.gender !== undefined) updateData.gender = dto.gender;

    // Update the user with the filtered data
    const updatedUser = await this.prisma.user.update({
      where: {
        id: numberToString(id),
      },
      data: updateData,
    });

    if (!updatedUser) {
      throw new createError.InternalServerError("Failed to update user");
    }

    return updatedUser;
  }

  async getUserProfilePic(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: numberToString(id),
      },
      select: {
        profilePhoto: true,
      },
    });

    if (!user) {
      throw new createError.NotFound("User not found");
    }

    return user.profilePhoto;
  }

  async updateUserImages(id: number, img: string) {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: numberToString(id),
      },
      data: {
        photos: {
          push: img,
        },
      },
    });
    // console.log({ updatedUser });

    if (!updatedUser) {
      throw new createError.InternalServerError("Failed to update user");
    }

    return updatedUser;
  }

  async removePhotoFromUser(userId: number, photoUrl: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: numberToString(userId),
        },
        select: {
          photos: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const updatedPhotos = user.photos.filter((photo) => photo !== photoUrl);
      await prisma.user.update({
        where: {
          id: numberToString(userId),
        },
        data: {
          photos: updatedPhotos,
        },
      });

      // // console.log(`Photo removed from user ${userId}'s photos array`);
    } catch (error) {
      // throw error;
      // console.log("Error removing photo from user:");
    }
  }

  async updateProfilePic(id: number, photo: string) {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: numberToString(id),
      },
      data: {
        profilePhoto: photo,
      },
    });
    if (!updatedUser) {
      throw new createError.InternalServerError("Failed to update user");
    }
    return updatedUser;
  }

  async uploadStory(id: number, photo: string) {
    const updatedUser = await this.prisma.story.create({
      data: {
        id: uuidv4(),
        userId: numberToString(id),
        imgUrl: photo,
      },
    });
    if (!updatedUser) {
      throw new createError.InternalServerError("Failed to create story");
    }
    return updatedUser;
  }

  async updateProfileLocation(id: number, locationDto: UserLocationDtoPartial) {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: numberToString(id),
      },
      data: {
        address: {
          upsert: {
            create: locationDto,
            update: locationDto,
          },
        },
      },
      include: {
        address: true,
      },
    });
    if (!updatedUser) {
      throw new createError.InternalServerError("Failed to update user");
    }
    return updatedUser.address;
  }

  async updateSearchSetting(id: number, searchDto: SearchDtoPartial) {
    const user = await this.prisma.user.findUnique({
      where: { id: numberToString(id) },
      select: {
        searchSetting: true,
      },
    });

    if (!user) {
      throw new createError.NotFound("User not found");
    }

    let updatedUser;
    if (user.searchSetting) {
      // Update the existing SearchSetting
      updatedUser = await this.prisma.user.update({
        where: { id: numberToString(id) },
        data: {
          searchSetting: {
            update: searchDto,
          },
        },
      });
    } else {
      // Create a new SearchSetting for the user
      updatedUser = await this.prisma.user.update({
        where: { id: numberToString(id) },
        data: {
          searchSetting: {
            create: searchDto,
          },
        },
      });
    }

    if (!updatedUser) {
      throw new createError.InternalServerError("Failed to update user");
    }
    return updatedUser;
  }

  async updatePremiumPurchase(ctx: Context, months: PremiumMonths) {
    const id = ctx.from?.id ? numberToString(ctx.from.id) : undefined;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        isPremium: true,
        premiumMonths: true,
        premiumExpirationDate: true,
        balance: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let newExpirationDate: Date | null = null;

    // Convert premiumExpirationDate to Date if it's a string
    const currentExpirationDate = user.premiumExpirationDate
      ? new Date(user.premiumExpirationDate)
      : null;

    if (user.isPremium && user.premiumMonths !== PremiumMonths.NONE) {
      // If the user is already premium, extend the current expiration date
      // newExpirationDate = addMonthsToDate(currentExpirationDate, this.getMonthsToAdd(months));
      await ctx.reply(
        `User already have premium purchase \nyour plan expiry date is ${currentExpirationDate}`
      );
      return;
    } else {
      // If the user is not premium, set the expiration date from now
      newExpirationDate = addMonthsToDate(
        new Date(),
        this.getMonthsToAdd(months)
      );
    }

    let newBalance: number = user.balance;
    const monthsInNum = this.getMonthsToAdd(months);

    if (monthsInNum === 3) {
      newBalance += 10000;
    } else if (monthsInNum === 6) {
      newBalance += 25000;
    } else if (monthsInNum === 12) {
      newBalance += 50000;
    }

    try {
      await prisma.user.update({
        where: { id },
        data: {
          isPremium: true,
          premiumMonths: months,
          balance: newBalance,
          premiumExpirationDate: newExpirationDate,
        },
      });
      await ctx.reply(
        `Premium purchase successful \n your plan expiry date is ${newExpirationDate}`
      );
      return;
    } catch (error) {
      await ctx.reply("Failed to update premium purchase");
      return;
    }
  }

  private getMonthsToAdd(months: PremiumMonths) {
    switch (months) {
      case PremiumMonths.THREE_MONTHS:
        return 3;
      case PremiumMonths.SIX_MONTHS:
        return 6;
      case PremiumMonths.TWELVE_MONTHS:
        return 12;
      default:
        return 0;
    }
  }
}
