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

  const onRefillHearts = () => {
    if (pending || hearts === MAX_HEARTS || points < POINTS_TO_REFILL) return;

    startTransition(() => {
      refillHearts().catch(() => toast.error("Something went wrong."));
    });
  };

  const onUpgrade = () => {
    toast.loading("Redirecting to checkout...");
    startTransition(() => {
      createStripeUrl()
        .then((response) => {
          if (response.data) window.location.href = response.data;
        })
        .catch(() => toast.error("Something went wrong."));
    });
  };

  const onPurchaseStreakFreeze = () => {
    if (pending || cfaBalance < 500) return;

    startTransition(() => {
      activateStreakFreeze()
        .then(() => toast.success("Streak freeze activé!"))
        .catch(() => toast.error("Something went wrong."));
    });
  };

  const onPurchaseCFABoost = () => {
    if (pending || cfaBalance < 100) return;

    startTransition(() => {
      purchaseShopItem(4) // Assuming CFA boost is item ID 4
        .then(() => toast.success("+1000 CFA ajoutés!"))
        .catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <ul className="w-full">
      <div className="flex w-full items-center gap-x-4 border-t-2 p-4">
        <Image src="/heart.svg" alt="Heart" height={60} width={60} />

        <div className="flex-1">
          <p className="text-base font-bold text-neutral-700 lg:text-xl">
            Refill hearts
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
            "full"
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
            Unlimited hearts
          </p>
        </div>

        <Button onClick={onUpgrade} disabled={pending} aria-disabled={pending}>
          {hasActiveSubscription ? "settings" : "upgrade"}
        </Button>
      </div>

      <div className="flex w-full items-center gap-x-4 border-t-2 p-4 pt-8">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gold/20 text-3xl">
          ❄️
        </div>

        <div className="flex-1">
          <p className="text-base font-bold text-sahel lg:text-xl">
            Streak Freeze
          </p>
          <p className="text-xs text-muted-foreground">
            Protège ta série pendant 24h
          </p>
        </div>

        <Button
          onClick={onPurchaseStreakFreeze}
          disabled={pending || cfaBalance < 500}
          aria-disabled={pending || cfaBalance < 500}
          className="bg-gold hover:bg-gold/90"
        >
          <div className="flex items-center">
            <span className="mr-1">500</span>
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
            CFA Boost
          </p>
          <p className="text-xs text-muted-foreground">
            +1000 CFA instantanés
          </p>
        </div>

        <Button
          onClick={onPurchaseCFABoost}
          disabled={pending || cfaBalance < 100}
          aria-disabled={pending || cfaBalance < 100}
          className="bg-mangrove hover:bg-mangrove/90"
        >
          <div className="flex items-center">
            <span className="mr-1">100</span>
            <span className="text-xs">CFA</span>
          </div>
        </Button>
      </div>
    </ul>
  );
};
