import { Markup } from "telegraf";

export enum MainMenu {
  STORIES = "🔞 Stories",
  START = "🔎 Start",
  MATCHES = "💝 Matches",
  LIKES_YOU = "💞 Likes you",
  SETTINGS = "⚙️ Set My Profile",
  HELP = "❓ Help",
  ABOUT = "📝 About",
  WALLET = "💰 Wallets",
}

export enum SettingsMenu {
  SEARCH_SETTING = "🔎 Search Setting",
  PROFILE = "👤 Profile",
  BOOST = "🚀 Boost",
  MAIN_MENU = "⏮️ Main menu",
  VIP = "👑 VIP",
}

export enum StoriesMenu {
  FIRE_EMOJI = "🔥",
  LAUGHING_EMOJI = "😂",
  SAD_EMOJI = "😔",
  LOVE_EMOJI = "😍",
  SHOCKED_EMOJI = "😱",
  FILTERS = "🔎 Filters",
  NEXT = "⏭️ Next",
  MAIN_MENU = "⏮️ Main menu",
  MY_STORIES = "My stories",
  PUBLISH_STORY = "+ Publish story",
}

export enum StartMenu {
  LIKE = "💜",
  UNLIKE = "❌",
  VIEW = "View",
  SEND_GIFT = "🎁 Send gift",
  MAIN_MENU = "⏮️ Main menu",
}

export enum SendGift {
  FLOWERS = "💐 Flowers",
  CANDIES = "🍫 Candies",
  DESSERT = "🧁 Dessert",
  SOFT_TOY = "🧸 Soft toy",
}

export enum SendGiftAmount {
  FLOWERS = 10,
  CANDIES = 15,
  DESSERT = 20,
  SOFT_TOY = 25,
}

export enum Profile {
  NAME = "Name",
  ABOUT = "About",
  DATE_OF_BIRTH = "Date of birth",
  PHOTO = "Photo",
  LANGUAGE = "Language",
  LOCATION = "📍 Location",
  MAIN_MENU = "⏮️ Main menu",
  PRODILE_GENDER = "👤 Gender",
  BACK = "⬅️ Back",
}

export enum SearchSetting {
  LOCATION = "Location",
  SEARCH_GENDER = "Gender",
  AGE = "Age",
  MAIN_MENU = "⏮️ Main menu",
  BACK = "⬅️ Back",
}

export enum StoryFilter {
  LOCATION = "Location 📍",
  STORY_FILTER_GENDER = "Gender ♀",
  AGE = "Age 🎂",
  MAIN_MENU = "Main menu ⏮",
  BACK = "Back ⬅",
}

export enum UserLocationSetting {
  CITY = "City",
  STATE = "State",
  COUNTRY = "Country",
  MAIN_MENU = "⏮️ Main menu",
  BACK = "⬅️ Back",
}

export enum PublishStorySetting {
  PUBLISH_BACK = "⬅ Back",
}

export enum VipPlansPrices {
  GOLD = "1000000",
  SILVER = "500000000",
  BRONZE = "100000000",
}

// Define the buttons
export const Wallet = {
  CONNECT_WALLET: Markup.button.callback("Connect Wallet", "connect_wallet"),

  DISCONNECT_WALLET: Markup.button.callback(
    "Disconnect Wallet",
    "disconnect_wallet"
  ),
  GOLD_PLAN: Markup.button.callback("5000 coins", "gold_plan"),
  SILVER_PLAN: Markup.button.callback("2500 coins", "silver_plan"),
  BRONZE_PLAN: Markup.button.callback("1000 coins", "bronze_plan"),
  // FIVE_K_COINS: Markup.button.callback("5000 coins", "buy_5000_coins"),
};

export const ConnectWalletInlineKeyboard = {
  CHOOSE_WALLET: Markup.button.callback("Choose a Wallet", "choose_wallet"),
};