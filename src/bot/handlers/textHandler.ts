import createError from "http-errors";
import { UserService } from "../../backend/user.service";
import { Gender } from "@prisma/client";
import { gender as genderEnum } from "../../common/constant";
import { userStates } from "../bot";
import prisma from "../../common/prisma";
import StartService from "../../backend/start.service";

const validGenders = Object.values(genderEnum);

export class ProfileUpdater {
  private userService: UserService;
  private startService: StartService;

  constructor(private ctx: any, private userState: any) {
    this.userService = new UserService();
    this.startService = new StartService();
  }

  async handleTextConditions() {
    const userId = this.ctx.message.from.id;
    const inputText = this.ctx.message.text;

    switch (this.userState?.waitingFor) {
      case "name":
        await this.updateName(userId, inputText);
        break;

      case "about":
        await this.updateAbout(userId, inputText);
        break;

      case "dob":
        await this.updateDob(userId, inputText);
        break;

      case "search-location":
        await this.handleSearchSettingLocationUpdate(userId, inputText);
        break;

      case "search-gender":
        await this.handleSearchSettingGenderUpdate(userId, inputText);
        break;

      case "search-age":
        await this.handleSearchSettingAgeUpdate(userId, inputText);
        break;

      case "user-city":
        await this.handleUserCityUpdate(userId, inputText);
        break;

      case "user-country":
        await this.handleUserCountryUpdate(userId, inputText);
        break;

      case "user-state":
        await this.handleUserStateUpdate(userId, inputText);
        break;
      case "msg-reply":
        await this.ctx.reply(userId, inputText);
      default:
        // Handle dynamic question responses
        if (this.userState?.waitingFor?.startsWith("question_")) {
          const questionId = parseInt(this.userState.waitingFor.split("_")[1]);

          // Save the answer to the database
          await prisma.userResponse.create({
            data: {
              userId: userId,
              questionId: questionId,
              response: inputText,
            },
          });

          userStates.delete(userId);
          await this.startService.showRecommendations(this.ctx, userId);
        } else {
          await this.ctx.reply("Input Not Accepted");
        }
        break;
    }
  }

  private async updateName(userId: number, newName: string) {
    try {
      await this.userService.updateProfile(userId, { firstName: newName });
      await this.ctx.reply(`Your name has been updated to ${newName}`);
    } catch (error) {
      await this.ctx.reply("Failed to update your name. Please try again.");
    }
  }

  private async updateAbout(userId: number, newAbout: string) {
    try {
      await this.userService.updateProfile(userId, { about: newAbout });
      await this.ctx.reply(`Your about information has been updated.`);
    } catch (error) {
      await this.ctx.reply(
        "Failed to update your about information. Please try again."
      );
    }
  }

  private async updateDob(userId: number, newDob: string) {
    const [yearStr, monthStr, dayStr] = newDob.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JavaScript months are 0-based
    const day = parseInt(dayStr, 10);

    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      year < 1920 ||
      year > new Date().getFullYear() ||
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31
    ) {
      await this.ctx.reply(
        "Invalid date format. Please use YYYY-MM-DD with a valid date."
      );
      return;
    }

    const date = new Date(Date.UTC(year, month, day));

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      await this.ctx.reply("Invalid date. Please ensure the date is correct.");
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDifference = today.getMonth() - date.getMonth();
    const dayDifference = today.getDate() - date.getDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age--;
    }

    try {
      await this.userService.updateProfile(userId, { dob: date, age });
      await this.ctx.reply(
        `Your date of birth has been updated to ${newDob}. You are ${age} years old.`
      );
    } catch (error) {
      await this.ctx.reply(
        "Failed to update your date of birth. Please try again."
      );
    }
  }

  private async handleSearchSettingLocationUpdate(
    userId: number,
    location: string
  ) {
    try {
      await this.userService.updateSearchSetting(userId, { location });
      await this.ctx.reply("Your location has been updated.");
    } catch (error) {
      await this.ctx.reply("Failed to update your location. Please try again.");
    }
  }

  private normalizeGender(input: string): Gender | null {
    const lowerCaseInput = input.toLowerCase();

    switch (lowerCaseInput) {
      case genderEnum.MALE:
        return Gender.MALE;
      case genderEnum.FEMALE:
        return Gender.FEMALE;
      case genderEnum.OTHER:
        return Gender.OTHER;
      default:
        return null;
    }
  }

  private async handleSearchSettingGenderUpdate(
    userId: number,
    inputText: string
  ) {
    const normalizedGender = this.normalizeGender(inputText);

    if (!normalizedGender) {
      await this.ctx.reply(
        "Invalid gender. Please use 'male', 'female', or 'other'."
      );
      return;
    }
    try {
      await this.userService.updateSearchSetting(userId, {
        gender: normalizedGender,
      });
      await this.ctx.reply(`Your search preference has been updated`);
    } catch (error) {
      await this.ctx.reply("Failed to update your gender. Please try again.");
    }
  }

  private async handleSearchSettingAgeUpdate(userId: number, age: string) {
    try {
      const ageInt = parseInt(age, 10);

      if (isNaN(ageInt)) {
        await this.ctx.reply("Invalid age. Please provide a valid number.");
        return;
      }

      if (ageInt < 10 || ageInt > 60) {
        await this.ctx.reply("Invalid age. Age must be between 10 to 60");
        return;
      }

      await this.userService.updateSearchSetting(userId, { age: ageInt });
      await this.ctx.reply("Your age preference has been updated.");
    } catch (error) {
      await this.ctx.reply(
        "Failed to update your age preference. Please try again."
      );
    }
  }

  private async handleUserCityUpdate(userId: number, inputText: string) {
    try {
      await this.userService.updateProfileLocation(userId, { city: inputText });
      await this.ctx.reply(`Your city has been updated to ${inputText}`);
    } catch (error) {
      await this.ctx.reply("Failed to update your city. Please try again.");
    }
  }

  private async handleUserCountryUpdate(userId: number, inputText: string) {
    try {
      await this.userService.updateProfileLocation(userId, {
        country: inputText,
      });
      await this.ctx.reply(`Your country has been updated to ${inputText}`);
    } catch (error) {
      await this.ctx.reply("Failed to update your country. Please try again.");
    }
  }

  private async handleUserStateUpdate(userId: number, inputText: string) {
    try {
      await this.userService.updateProfileLocation(userId, {
        state: inputText,
      });
      await this.ctx.reply(`Your state has been updated to ${inputText}`);
    } catch (error) {
      await this.ctx.reply("Failed to update your state. Please try again.");
    }
  }
}
