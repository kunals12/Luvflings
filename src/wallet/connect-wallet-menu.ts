// // src/connect-wallet-menu.ts
import QRCode from "qrcode";
import fs from "fs";
import { getConnector, getWalletInfo, getWallets } from "./wallet";
import { Context, Markup, Telegraf } from "telegraf";
import {
  CHAIN,
  toUserFriendlyAddress,
  UserRejectsError,
} from "@tonconnect/sdk";
export const pTimeoutException = Symbol();
import TonWeb from "tonweb";
const { Cell, BitString } = TonWeb.boc;
const tonweb = new TonWeb();
import { UserService } from "../backend/user.service";
import { VipPlansPrices } from "../enums/botEnums";
import { PremiumMonths } from "@prisma/client";
import redisClient from "../backend/redisClient";
import { disconnectWalletMenu } from "../bot/keyboards";

// import { getWallets } from "./wallet";

// async function onChooseWalletClick(query: CallbackQuery, _: string): Promise<void> {
//     const wallets = await getWallets();

//     await bot.editMessageReplyMarkup(
//         {
//             inline_keyboard: [
//                 wallets.map(wallet => ({
//                     text: wallet.name,
//                     callback_data: JSON.stringify({ method: 'select_wallet', data: wallet.appName })
//                 })),
//                 [
//                     {
//                         text: '« Back',
//                         callback_data: JSON.stringify({
//                             method: 'universal_qr'
//                         })
//                     }
//                 ]
//             ]
//         },
//         {
//             message_id: query.message!.message_id,
//             chat_id: query.message!.chat.id
//         }
//     );
// }

export async function editQR(
  ctx: any,
  message: any,
  link: string
): Promise<void> {
  try {
    const buffer = await QRCode.toBuffer(link);

    await ctx.editMessageMedia(
      {
        type: "photo",
        media: { source: buffer },
      },
      {
        message_id: message?.message_id,
        chat_id: message?.chat.id,
      }
    );
  } catch (error) {
    // console.log("Error editing QR code:", error);
  }
}

export async function onOpenUniversalQRClick(
  ctx: Context,
  callbackQuery: any
): Promise<void> {
  const chatId = callbackQuery.from.id; // Get chatId from callback query's sender

  const wallets = await getWallets();

  const connector = getConnector(chatId);

  const link = connector.connect(wallets);
  await editQR(ctx, callbackQuery.message!, link);
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [
      [
        Markup.button.callback("Connect Wallet", "choose_wallet"),
        Markup.button.url(
          "Open Link",
          `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
            link
          )}`
        ),
      ],
    ],
  });
}

export async function onWalletClick(
  ctx: Context,
  query: any,
  data: string
): Promise<void> {
  const chatId = query.message!.chat.id;
  const connector = getConnector(chatId);

  const selectedWallet = await getWalletInfo(data);
  if (!selectedWallet) {
    return;
  }

  const link = connector.connect({
    bridgeUrl: selectedWallet.bridgeUrl,
    universalLink: selectedWallet.universalLink,
  });

  await editQR(ctx, query.message!, link);

  await ctx.editMessageReplyMarkup({
    inline_keyboard: [
      [
        Markup.button.callback("« Back", "choose_wallet"),
        Markup.button.url(`Open ${selectedWallet.name}`, link),
      ],
    ],
  });
}

export async function handleSendTXCommand(
  ctx: Context,
  msg: any,
  amount: VipPlansPrices,
): Promise<void> {
  const chatId = msg.chat.id;

  const connector = getConnector(chatId);

  await connector.restoreConnection();
  if (!connector.connected) {
    await ctx.reply("Connect wallet to send transaction", disconnectWalletMenu);
    return;
  }

  // const boc = 'te6cckEBAgEAqQAB4YgAsQjA2dSiv7+2Q/eCfJrr/aSa3bLGWEog395cImGyf4gG/jjNo2cvj88UopAz41BaH5PmG1De03r6ilsPZMWuNweHhvZaIaT1nuELopILXB71Jq3SCuV6OCituT8jg8u4AU1NGLs1WT4AAAAAEAAcAQBmQgBCT7v8SJj4KxP6AVipK9+OTfCez1iduzpuNusViF2O1Rh6EgAAAAAAAAAAAAAAAAAA9SOP8g=='

  // const decodedBoc = TonWeb.boc.Cell.fromBoc(boc);
  // // console.log({decodedBoc});
  
  
pTimeout(
    connector.sendTransaction({
      validUntil: Math.round(
        (Date.now() + Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS)) /
          1000
      ),
      messages: [
        {
          amount: amount,
          address: "UQBYhGBs6lFf39sh-8E-TXX-0k1u2WMsJRBv7y4RMNk_xDnk",
        },
      ],
    }),
    Number(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS)
  )
    .then(async (txData) => {
      // console.log({txData});      
      await ctx.reply(`Transaction sent successfully`);

      let months:PremiumMonths= PremiumMonths.NONE;

      if(amount === VipPlansPrices.GOLD){
        months = PremiumMonths.TWELVE_MONTHS;
      } else if(amount === VipPlansPrices.SILVER){
        months = PremiumMonths.SIX_MONTHS;
      } else if(amount === VipPlansPrices.BRONZE){
        months = PremiumMonths.THREE_MONTHS;
      }

      const userService = new UserService();
      await userService.updatePremiumPurchase(ctx, months);
      await redisClient.del(`user:${chatId}`);
    })
    .catch((e) => {
      if (e === pTimeoutException) {
        ctx.reply(`Transaction was not confirmed`);
        return;
      }

      if (e instanceof UserRejectsError) {
        ctx.reply(`You rejected the transaction`);
        return;
      }

      ctx.reply(`Unknown error happened`);
    })
    .finally(() => connector.pauseConnection());

  let deeplink = "";
  const walletInfo = await getWalletInfo(connector.wallet!.device.appName);
  if (walletInfo) {
    deeplink = walletInfo.universalLink;
  }

  await ctx.reply(
    `Open ${
      walletInfo?.name || connector.wallet!.device.appName
    } and confirm transaction`,
    {
      reply_markup: {
        inline_keyboard: [[Markup.button.url("Open Wallet", deeplink)]],
      },
    }
  );
}

export async function handleDisconnectCommand(
  ctx: Context,
  msg: any
): Promise<void> {
  const chatId = msg.chat.id;

  const connector = getConnector(chatId);

  await connector.restoreConnection();
  if (!connector.connected) {
    await ctx.reply("You didn't connect a wallet");
    return;
  }

  await connector.disconnect();

  await ctx.replyWithMarkdownV2("*Wallet has been disconnected*");
}

export async function handleShowMyWalletCommand(
  ctx: Context,
  msg: any
): Promise<void> {
  const chatId = msg.chat.id;

  const connector = getConnector(chatId);
  await connector.restoreConnection();
  if (!connector.connected) {
    await ctx.reply("You didn't connect a wallet");
    return;
  }

  const walletName =
    (await getWalletInfo(connector.wallet!.device.appName))?.name ||
    connector.wallet!.device.appName;

  // console.log({ walletName });

  await ctx.replyWithMarkdownV2(
    `*${walletName} address*: \n${toUserFriendlyAddress(
      connector.wallet!.account.address,
      connector.wallet!.account.chain === CHAIN.TESTNET
    )}`
  );
}

function pTimeout<T>(
  promise: Promise<T>,
  time: number,
  exception: unknown = pTimeoutException
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise((_r, rej) => (timer = setTimeout(rej, time, exception))),
  ]).finally(() => clearTimeout(timer)) as Promise<T>;
}

// Example function to decode a BOC and extract information
// export async function decodeBOC(bocBase64:any) {
//   try {
//       // Decode the base64 BOC string to a buffer
//       const bocBuffer = Buffer.from(bocBase64, 'base64');

//       // Parse the BOC to get the root cell
//       const cells = Cell.fromBoc(bocBuffer);
//       if (cells.length === 0) {
//           throw new Error('No cells found in BOC');
//       }

      

//       const rootCell = cells[0];
      
//       // Extract hash from the cell
//       const transactionHash = await rootCell.hash().then(buffer => buffer.toString());
      
//       // console.log({transactionHash});
      
      
//   } catch (error) {
//       // console.log('Error decoding BOC:', error);
//       throw error;
//   }
// }