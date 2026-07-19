import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

import { getCourses, getUserProgress } from "@/db/queries";
import { DICT, LOCALE_COOKIE, isLocale } from "@/lib/i18n";

import { List } from "./list";

const CoursesPage = async () => {
  await auth.protect();

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const t = DICT[isLocale(cookieLocale) ? cookieLocale : "fr"];

  const coursesData = getCourses();
  const userProgressData = getUserProgress();

  const [courses, userProgress] = await Promise.all([
    coursesData,
    userProgressData,
  ]);

  return (
    <div className="mx-auto h-full max-w-[912px] px-3">
      <h1 className="text-2xl font-bold text-sahel">{t.coursesTitle}</h1>

      <List courses={courses} activeCourseId={userProgress?.activeCourseId} />
    </div>
  );
};

export default CoursesPage;
