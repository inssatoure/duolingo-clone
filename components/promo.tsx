"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/use-locale";

export const Promo = () => {
  const { t } = useLocale();
  return (
    <div className="space-y-4 rounded-xl border-2 p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-x-2">
          <Image src="/unlimited.svg" alt="Pro" height={26} width={26} />

          <h3 className="text-lg font-bold">{t.promoTitle}</h3>
        </div>

        <p className="text-muted-foreground">{t.promoSubtitle}</p>
      </div>

      <Button variant="super" className="w-full" size="lg" asChild>
        <Link href="/shop" prefetch>
          {t.promoCta}
        </Link>
      </Button>
    </div>
  );
};
