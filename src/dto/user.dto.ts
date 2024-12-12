import { Address, Gender, SearchSetting } from "@prisma/client";

export type UserDto = {
  id: number;
  username: string;
  firstName: string;
  dob: Date;
  photos: string[];
  about: string;
  isPremium?: boolean;
  age: number;
  gender: Gender;
  address: Address;
  searchSetting: SearchSetting;
};

export type CreateUser = Pick<UserDto, "id" | "username" | "firstName">;
export type UpdateUser = Pick<UserDto, "firstName" | "dob" | "about"| "age"| "gender">

export type UpdateUserPartial = Partial<UpdateUser>;

// src/dtos/getUser.dto.ts
export type GetUserDto = {
  id: number;
  username: string;
  name: string;
};

export type SearchDto = {
  location: string;
  gender: Gender;
  age: number;
}

export type SearchDtoPartial = Partial<SearchDto>

export type UserLocationDto = {
  city: string;
  country: string;
  state: string;
}

export type UserLocationDtoPartial = Partial<UserLocationDto>
