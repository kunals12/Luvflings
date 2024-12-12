import { Context } from "telegraf";
import { getConnector, getWalletInfo, getWallets } from "../wallet/wallet";
import { CHAIN, toUserFriendlyAddress } from "@tonconnect/sdk";
import { balanceMenuForConnectedWallet, balanceMenuForDisconnectedWallet, disconnectWalletMenu } from "../bot/keyboards";
import {UserService} from "../backend/user.service";
import { formatDistanceToNow } from 'date-fns';
import { PremiumMonths } from "@prisma/client";

const userService = new UserService();
export const userProfileMsg = (profile: any) => {
  return `
${profile.firstName ? `👤 Name: ${profile.firstName}` : ""}
${profile.age ? `🎂 Age: ${profile.age}` : ""}
${profile.gender ? `👤 Gender: ${profile.gender}` : ""}
${profile.address?.city ? `🏙️ City: ${profile.address.city}` : ""}
${profile.address?.country ? `🌍 Country: ${profile.address.country}` : ""}
`.trim();
};

const escapeMarkdownV2 = (text: string) => {
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
};

export const userBalanceMsg = async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    throw new Error("Chat ID not found");
  }

  const user = await ctx.state.user;

  const loaderMessage = await ctx.reply("⏳");
  const connector = getConnector(chatId);
  await connector.restoreConnection();

  if (!connector.connected) {
    if (user.isPremium && user.premiumMonths !== PremiumMonths.NONE) {
      await ctx.replyWithMarkdownV2(`💎 *You are a VIP member\\!*`.trim(), balanceMenuForDisconnectedWallet);
      return;
    } else {
      await ctx.replyWithMarkdownV2(`    
        ✨ Coin Packages ✨
        ⭐ 5000 coins \\= 25 TON 
        ⭐ 2500 coins \\= 15 TON
        ⭐ 1200 coins \\= 10 TON
                
        💎 Want to save money? Become a VIP member right now\\!
      `.trim(), balanceMenuForDisconnectedWallet);
    }
  } else {
    const walletName =
      (await getWalletInfo(connector.wallet!.device.appName))?.name ||
      connector.wallet!.device.appName;

    const address = toUserFriendlyAddress(
      connector.wallet!.account.address,
      connector.wallet!.account.chain === CHAIN.TESTNET
    );

    // console.log({ walletName, address });

    
    const userBalance = user.balance;

    if (user.isPremium) {
      await ctx.replyWithMarkdownV2(`*${walletName} address* : \n\`${address}\`\n\n💰 You have *${userBalance}* coins\n`, disconnectWalletMenu);
    } else {
      await ctx.replyWithMarkdownV2(`*${walletName} address* : \n\`${address}\``);
    
      await ctx.replyWithMarkdownV2(`
        💰 You have *${userBalance}* coins
        
        ✨ *Coin Packages* ✨
        ⭐ 5000 coins \\= 25 TON 
        ⭐ 2500 coins \\= 15 TON
        ⭐ 1200 coins \\= 10 TON
        
        👇 *How many coins do you want to get?*
        
        💎 *Want to save money? Become a VIP member right now\\!*
      `.trim(), balanceMenuForConnectedWallet);
    }
  }
  await ctx.deleteMessage(loaderMessage.message_id); // Delete the loader message
};

export const sendGiftMsg = `
Want to stand out from the crowd?
Give to your sympathy a gift!

There are 100 coins on your balance.
💐 — 10 coins
🍫 — 15 coins
🧁 — 20 coins
🧸 — 25 coins

👇Choose a gift👇
`;

export const likedYouMsg = (userWhoLikedYou: any) => {
  return `💕 ${userWhoLikedYou} liked you! Open the "Likes you" section and start chatting right now!`;
}

export const noOneLikesYouMsg = `
There are no users who liked you and you haven’t rated them yet.

Increase your chances now:
👉 Write something good about you
👉 Activate Boost feature
👉 Upload a better selfie
`
export const recommendationMsg = (randomRecommendation:any) => {
  return `
${randomRecommendation.firstName}, ${randomRecommendation.age ? `, ${randomRecommendation.age}` : ""}
${randomRecommendation.address ? `📍${randomRecommendation.address.state}, ${randomRecommendation.address.country}` : ""}
${randomRecommendation.gifts ? `🎁: ${randomRecommendation.gifts} gifts` : ""}
⏱ last seen ${formatDistanceToNow(new Date(randomRecommendation.lastSeen))} ago
`.trim();
}

export const vipAdvertisement = `
Your VIP status is not activated

With VIP you will get:
✅  See who likes you
✅  Unlimited access to all profiles
✅  Access to “Stories” filters
✅  Get matches faster
✅  1,000 coins each month
✅  Personal support
✅  No ads
`