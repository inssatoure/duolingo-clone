"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { getUserProgress } from "@/db/queries";
import { userProgress, shopItems, userPurchases } from "@/db/schema";

export const purchaseShopItem = async (itemId: number) => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized.");

  const currentUserProgress = await getUserProgress();

  if (!currentUserProgress) throw new Error("User progress not found.");

  // Get the shop item
  const shopItem = await db.query.shopItems.findFirst({
    where: eq(shopItems.id, itemId),
  });

  if (!shopItem) throw new Error("Shop item not found.");
  if (!shopItem.active) throw new Error("Shop item is not available.");

  // Check if user has enough CFA
  if (currentUserProgress.cfaBalance < shopItem.price) {
    throw new Error("Not enough CFA balance.");
  }

  // Check if user already purchased this item (for one-time items)
  const existingPurchase = await db.query.userPurchases.findFirst({
    where: eq(userPurchases.itemId, itemId),
  });

  if (existingPurchase && shopItem.type !== "currency_boost") {
    throw new Error("You already own this item.");
  }

  // Process the purchase
  await db.transaction(async (tx) => {
    // Deduct CFA from user balance
    await tx
      .update(userProgress)
      .set({
        cfaBalance: currentUserProgress.cfaBalance - shopItem.price,
      })
      .where(eq(userProgress.userId, userId));

    // Add to purchase history
    await tx.insert(userPurchases).values({
      userId,
      itemId,
    });

    // Apply item effects
    switch (shopItem.type) {
      case "hearts_refill":
        await tx
          .update(userProgress)
          .set({ hearts: 5 })
          .where(eq(userProgress.userId, userId));
        break;
      case "currency_boost":
        await tx
          .update(userProgress)
          .set({
            cfaBalance: currentUserProgress.cfaBalance - shopItem.price + 1000,
          })
          .where(eq(userProgress.userId, userId));
        break;
      // streak_freeze and bonus_xp are handled through their respective actions
      default:
        break;
    }
  });

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/quests");
  revalidatePath("/leaderboard");
};

export const getShopItems = async () => {
  const data = await db.query.shopItems.findMany({
    where: eq(shopItems.active, true),
  });

  return data;
};

export const getUserPurchases = async () => {
  const { userId } = await auth();

  if (!userId) return [];

  const data = await db.query.userPurchases.findMany({
    where: eq(userPurchases.userId, userId),
    with: {
      item: true,
    },
  });

  return data;
};
