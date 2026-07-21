"use client";

import { useTransition } from "react";

import Image from "next/image";
import { toast } from "sonner";

import { refillHearts } from "@/actions/user-progress";
import { createStripeUrl } from "@/actions/user-subscription";
import { purchaseShopItem } from "@/actions/purchase-item";
import { activateStreakFreeze } from "@/actions/streaks";
import { Button } from "@/components/ui/button";
import { MAX_HEARTS, POINTS_TO_REFILL } from "@/constants";
import { useLocale } from "@/lib/use-locale";
import {
  CFA_BOOST_ITEM_ID,
  STREAK_FREEZE_PRICE,
  CFA_BOOST_PRICE,
} from "@/lib/shop-items";

type ItemsProps = {
  hearts: number;
  points: number;
  hasActiveSubscription: boolean;
  cfaBalance: number;
};

export const Items = ({
  hearts,
  points,
  hasActiveSubscription,
  cfaBalance,
}: ItemsProps) => {
  const [pending, startTransition] = useTransition();
  const { t } = useLocale();

  const onRefillHearts = () => {
    if (pending || hearts === MAX_HEARTS || points < POINTS_TO_REFILL) return;

    startTransition(() => {
      refillHearts().catch(() => toast.error(t.somethingWrong));
    });
  };

  const onUpgrade = () => {
    toast.loading(t.redirecting);
    startTransition(() => {
      createStripeUrl()
        .then((response) => {
          if (response.data) window.location.href = response.data;
        })
        .catch(() => toast.error(t.somethingWrong));
    });
  };

  const onPurchaseStreakFreeze = () => {
    if (pending || cfaBalance < STREAK_FREEZE_PRICE) return;

    startTransition(() => {
      activateStreakFreeze()
        .then(() => toast.success(t.streakFreezeActivated))
        .catch(() => toast.error(t.somethingWrong));
    });
  };

  const onPurchaseCFABoost = () => {
    if (pending || cfaBalance < CFA_BOOST_PRICE) return;

    startTransition(() => {
      purchaseShopItem(CFA_BOOST_ITEM_ID)
        .then(() => toast.success(t.cfaBoostAdded))
        .catch(() => toast.error(t.somethingWrong));
    });
  };

  // Temporary: the whole app is free right now (see FREE_MODE in
  // db/queries.ts), so hearts never run out and there's nothing to buy or
  // upgrade here - hide these two rows instead of showing a "Settings"
  // button that would try to open a real Stripe checkout.
  if (hasActiveSubscription) {
    return (
      <ul className="w-full">
        <div className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gold/20 text-3xl">
            ❄️
          </div>

          <div className="flex-1">
            <p className="text-base font-bold text-sahel lg:text-xl">
              {t.streakFreeze}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.streakFreezeDesc}
            </p>
          </div>

          <Button
            onClick={onPurchaseStreakFreeze}
            disabled={pending || cfaBalance < STREAK_FREEZE_PRICE}
            aria-disabled={pending || cfaBalance < STREAK_FREEZE_PRICE}
            className="bg-gold hover:bg-gold/90"
          >
            <div className="flex items-center">
              <span className="mr-1">{STREAK_FREEZE_PRICE}</span>
              <span className="text-xs">CFA</span>
            </div>
          </Button>
        </div>

        <div className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-mangrove/20 text-3xl">
            💰
          </div>

          <div className="flex-1">
            <p className="text-base font-bold text-mangrove lg:text-xl">
              {t.cfaBoost}
            </p>
            <p className="text-xs text-muted-foreground">{t.cfaBoostDesc}</p>
          </div>

          <Button
            onClick={onPurchaseCFABoost}
            disabled={pending || cfaBalance < CFA_BOOST_PRICE}
            aria-disabled={pending || cfaBalance < CFA_BOOST_PRICE}
            className="bg-mangrove hover:bg-mangrove/90"
          >
            <div className="flex items-center">
              <span className="mr-1">{CFA_BOOST_PRICE}</span>
              <span className="text-xs">CFA</span>
            </div>
          </Button>
        </div>
      </ul>
    );
  }

  return (
    <ul className="w-full">
      <div className="flex w-full items-center gap-x-4 border-t-2 p-4">
        <Image src="/heart.svg" alt="Heart" height={60} width={60} />

        <div className="flex-1">
          <p className="text-base font-bold text-neutral-700 lg:text-xl">
            {t.refillHearts}
          </p>
        </div>

        <Button
          onClick={onRefillHearts}
          disabled={
            pending || hearts === MAX_HEARTS || points < POINTS_TO_REFILL
          }
          aria-disabled={
            pending || hearts === MAX_HEARTS || points < POINTS_TO_REFILL
          }
        >
          {hearts === MAX_HEARTS ? (
            t.full
          ) : (
            <div className="flex items-center">
              <Image src="/points.svg" alt="Points" height={20} width={20} />

              <p>{POINTS_TO_REFILL}</p>
            </div>
          )}
        </Button>
      </div>

      <div className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8">
        <Image src="/unlimited.svg" alt="Unlimited" height={60} width={60} />

        <div className="flex-1">
          <p className="text-base font-bold text-neutral-700 lg:text-xl">
            {t.unlimitedHearts}
          </p>
        </div>

        <Button onClick={onUpgrade} disabled={pending} aria-disabled={pending}>
          {t.upgrade}
        </Button>
      </div>

      <div className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gold/20 text-3xl">
          ❄️
        </div>

        <div className="flex-1">
          <p className="text-base font-bold text-sahel lg:text-xl">
            {t.streakFreeze}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.streakFreezeDesc}
          </p>
        </div>

        <Button
          onClick={onPurchaseStreakFreeze}
          disabled={pending || cfaBalance < STREAK_FREEZE_PRICE}
          aria-disabled={pending || cfaBalance < STREAK_FREEZE_PRICE}
          className="bg-gold hover:bg-gold/90"
        >
          <div className="flex items-center">
            <span className="mr-1">{STREAK_FREEZE_PRICE}</span>
            <span className="text-xs">CFA</span>
          </div>
        </Button>
      </div>

      <div className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-mangrove/20 text-3xl">
          💰
        </div>

        <div className="flex-1">
          <p className="text-base font-bold text-mangrove lg:text-xl">
            {t.cfaBoost}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.cfaBoostDesc}
          </p>
        </div>

        <Button
          onClick={onPurchaseCFABoost}
          disabled={pending || cfaBalance < CFA_BOOST_PRICE}
          aria-disabled={pending || cfaBalance < CFA_BOOST_PRICE}
          className="bg-mangrove hover:bg-mangrove/90"
        >
          <div className="flex items-center">
            <span className="mr-1">{CFA_BOOST_PRICE}</span>
            <span className="text-xs">CFA</span>
          </div>
        </Button>
      </div>
    </ul>
  );
};
