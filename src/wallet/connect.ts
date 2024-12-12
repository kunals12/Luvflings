import TonConnect, { CHAIN, toUserFriendlyAddress } from "@tonconnect/sdk";
import { getConnector, getWalletInfo, getWallets } from "./wallet";
import { TonConnectStorage } from "./storage";
import QRCode from "qrcode";
import { Context, Markup } from "telegraf";
import { userBalanceMsg } from "../common/messages";

let newConnectRequestListenersMap = new Map<number, () => void>();

class ConnectWallet {
  async connect(chatId: number, ctx: Context) {
    // console.log({ chatId });
    let messageWasDeleted = false;

    newConnectRequestListenersMap.get(chatId)?.();

    const connector = getConnector(chatId, () => {
      unsubscribe();
      newConnectRequestListenersMap.delete(chatId);
      deleteMessage();
    });

    await connector.restoreConnection();
    if (connector.connected) {
      const connectedName =
        (await getWalletInfo(connector.wallet!.device.appName))?.name ||
        connector.wallet!.device.appName;

      await ctx.reply(
        `You have already connect ${connectedName} wallet\nYour address: ${toUserFriendlyAddress(
          connector.wallet!.account.address,
          connector.wallet!.account.chain === CHAIN.TESTNET
        )}\n\n Disconnect wallet firstly to connect a new one`
      );

      return;
    }

    const unsubscribe = connector.onStatusChange(async (wallet) => {
      if (wallet) {
        await deleteMessage();

        const walletName =
          (await getWalletInfo(wallet.device.appName))?.name ||
          wallet.device.appName;
        // await ctx.reply(`${walletName} wallet connected successfully`);
        unsubscribe();
        newConnectRequestListenersMap.delete(chatId);
        await userBalanceMsg(ctx);
      }
    });

    const wallets = await getWallets();

    const link = connector.connect(wallets);
    const image = await QRCode.toBuffer(link);

    await ctx.telegram.sendPhoto(
      chatId,
      { source: image },
      {
        caption: "Scan this QR code to connect your wallet.",
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback("Choose a Wallet", "choose_wallet"),
              Markup.button.url(
                "Open Link",
                `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
                  link
                )}`
              ),
            ],
          ],
        },
      }
    );

    const deleteMessage = async (): Promise<void> => {
      if (!messageWasDeleted) {
        messageWasDeleted = true;
        if (ctx.message && ctx.message.message_id) {
          await ctx.deleteMessage(ctx.message.message_id);
        }
      }
    };

    newConnectRequestListenersMap.set(chatId, async () => {
      unsubscribe();

      await deleteMessage();

      newConnectRequestListenersMap.delete(chatId);
    });
  }
}

export default ConnectWallet;
