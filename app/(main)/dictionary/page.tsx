import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import dictionaryData from "@/seeds/dictionary.json";

import { DictionaryList, type DictionaryEntry } from "./dictionary-list";

const DictionaryPage = async () => {
  await auth.protect();

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : "fr";

  return (
    <div className="mx-auto h-full max-w-[912px] px-3 pb-10">
      <h1 className="text-2xl font-bold text-sahel">
        {locale === "wo"
          ? "Baatukaay"
          : locale === "fr"
            ? "Dictionnaire wolof"
            : "Wolof dictionary"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {locale === "wo"
          ? `${dictionaryData.length} baat ak waxin ci cours bi`
          : locale === "fr"
            ? `${dictionaryData.length} mots et expressions du parcours`
            : `${dictionaryData.length} words and phrases from the course`}
      </p>

      <DictionaryList
        entries={dictionaryData as DictionaryEntry[]}
        locale={locale}
      />
    </div>
  );
};

export default DictionaryPage;
