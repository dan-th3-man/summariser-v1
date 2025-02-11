import { PrivyClient } from "@privy-io/server-auth";

interface SocialAccount {
  userId: string;
  username: string;
  platform: "telegram" | "discord";
}

interface WalletInfo {
  username: string;
  platform: "telegram" | "discord";
  walletAddress: string | null;
  error?: string;
}

const privyClient = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function getSocialAccountWallet(account: SocialAccount): Promise<WalletInfo> {
  try {
    if (!account.username) {
      return {
        username: account.username,
        platform: account.platform,
        walletAddress: null,
        error: "No username found for this user."
      };
    }

    let user;
    if (account.platform === "telegram") {
      user = await privyClient.getUserByTelegramUsername(account.username);
    } else {
      user = await privyClient.getUserByDiscordUsername(account.username);
    }

    if (!user) {
      return {
        username: account.username,
        platform: account.platform,
        walletAddress: null,
        error: `No Privy account found for ${account.platform} user ${account.username}. Create one at https://ai-agent-privy.vercel.app/`
      };
    }

    const walletAccount = user.linkedAccounts.find(acc => acc.type === "wallet");

    if (!walletAccount?.address) {
      return {
        username: account.username,
        platform: account.platform,
        walletAddress: null,
        error: `User ${account.username} has not connected a wallet to their Privy account. Connect one at https://ai-agent-privy.vercel.app/`
      };
    }

    return {
      username: account.username,
      platform: account.platform,
      walletAddress: walletAccount.address
    };
  } catch (error) {
    return {
      username: account.username,
      platform: account.platform,
      walletAddress: null,
      error: `Error getting wallet info: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 