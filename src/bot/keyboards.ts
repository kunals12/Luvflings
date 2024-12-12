// src/keyboards.ts
import { Markup } from "telegraf";
import {
  StartMenu,
  SettingsMenu,
  StoriesMenu,
  MainMenu,
  SendGift,
  Profile,
  SearchSetting,
  UserLocationSetting,
  Wallet,
  ConnectWalletInlineKeyboard,
  PublishStorySetting,
  StoryFilter,
} from "../enums/botEnums"; // Adjust the import path as needed

export const mainMenu = (id?: number) =>
  Markup.keyboard([
    [MainMenu.STORIES, MainMenu.START],
    // [MainMenu.MATCHES, MainMenu.LIKES_YOU],
    [
      Markup.button.webApp(
        "Matches",
        `${process.env.TMA_URL}/matches?id=${id}`
      ),
      MainMenu.LIKES_YOU,
    ],
    [MainMenu.SETTINGS, MainMenu.WALLET],
  ]).resize();

export const settingsMenu = Markup.keyboard([
  [SettingsMenu.SEARCH_SETTING, SettingsMenu.PROFILE],
  [SettingsMenu.BOOST, SettingsMenu.VIP],
  [SettingsMenu.MAIN_MENU],
]).resize();

export const storiesMenu = Markup.keyboard([
  [StoriesMenu.FILTERS, StoriesMenu.MY_STORIES],
  [StoriesMenu.NEXT, StoriesMenu.MAIN_MENU],
  [StoriesMenu.PUBLISH_STORY],
]).resize();

export const startMenu = Markup.keyboard([
  [StartMenu.LIKE, StartMenu.UNLIKE],
  [StartMenu.VIEW, StartMenu.SEND_GIFT],
  [StartMenu.MAIN_MENU],
]).resize();

export const sendGiftMenu = Markup.keyboard([
  [SendGift.FLOWERS, SendGift.CANDIES],
  [SendGift.DESSERT, SendGift.SOFT_TOY],
  [StartMenu.MAIN_MENU],
]).resize();

// export const profileMenuWithMarkup = Markup.keyboard([
//   [Profile.NAME, Profile.ABOUT],
//   [Profile.DATE_OF_BIRTH, Profile.PHOTO],
//   [Profile.LOCATION, Profile.GENDER],
//   [Profile.BACK],
// ]).resize().reply_markup;

export const profileMenu = Markup.keyboard([
  [Profile.NAME, Profile.ABOUT, Profile.PHOTO],
  [Profile.DATE_OF_BIRTH, Profile.LOCATION, Profile.PRODILE_GENDER],
  [Profile.BACK],
]).resize();

export const searchSettingMenu = Markup.keyboard([
  [SearchSetting.LOCATION, SearchSetting.SEARCH_GENDER],
  [SearchSetting.AGE, SearchSetting.BACK],
  [SearchSetting.MAIN_MENU],
]).resize();

export const storyFilterMenu = Markup.keyboard([
  [StoryFilter.LOCATION, StoryFilter.STORY_FILTER_GENDER],
  [StoryFilter.AGE, StoryFilter.BACK],
]);

export const userLocationSettingMenu = Markup.keyboard([
  [UserLocationSetting.CITY, UserLocationSetting.STATE],
  [UserLocationSetting.COUNTRY, UserLocationSetting.BACK],
  [UserLocationSetting.MAIN_MENU],
]).resize();

export const publishStoryBackBtn = Markup.keyboard([
  [PublishStorySetting.PUBLISH_BACK],
]).resize();

// export const selectPreferredGenderMenu = Markup.keyboard([
//   [SearchSetting.MALE, SearchSetting.FEMALE],
//   [SearchSetting.OTHER, SearchSetting.BACK],
// ]).resize();

export const balanceMenuForDisconnectedWallet = Markup.inlineKeyboard([
  [Wallet.CONNECT_WALLET],
  // [Wallet.FIFTY_K_COINS, Wallet.TWENTY_FIVE_K_COINS],
  // [Wallet.TEN_K_COINS, Wallet.FIVE_K_COINS],
]);

export const balanceMenuForConnectedWallet = Markup.inlineKeyboard([
  [Wallet.GOLD_PLAN],
  [Wallet.SILVER_PLAN],
  [Wallet.BRONZE_PLAN],
  [Wallet.DISCONNECT_WALLET],
]);

export const connectWalletMenu = Markup.inlineKeyboard([
  [ConnectWalletInlineKeyboard.CHOOSE_WALLET],
]);

export const disconnectWalletMenu = Markup.inlineKeyboard([
  [Wallet.DISCONNECT_WALLET],
]);
