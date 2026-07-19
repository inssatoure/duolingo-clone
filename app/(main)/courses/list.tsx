"use client";

import { useEffect, useRef, useTransition } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { upsertUserProgress } from "@/actions/user-progress";
import { courses, userProgress } from "@/db/schema";
import { courseMatchesLocale } from "@/lib/i18n";
import { readLocaleCookie, readTargetCookie } from "@/lib/use-locale";

import { Card } from "./card";

type ListProps = {
  courses: (typeof courses.$inferSelect)[];
  activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
};

export const List = ({ courses, activeCourseId }: ListProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const autoEnrolled = useRef(false);

  // Duolingo-style onboarding: a first-time user who picked their language on
  // the splash screen is enrolled straight into the matching Wolof course.
  useEffect(() => {
    if (activeCourseId || autoEnrolled.current) return;
    const locale = readLocaleCookie();
    if (!locale) return;
    const match = courses.find((c) =>
      courseMatchesLocale(c.title, locale, readTargetCookie())
    );
    if (!match) return;
    autoEnrolled.current = true;
    startTransition(() => {
      upsertUserProgress(match.id).catch(() => {
        autoEnrolled.current = false;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClick = (id: number) => {
    if (pending) return;

    if (id === activeCourseId) return router.push("/learn");

    startTransition(() => {
      upsertUserProgress(id).catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
      {courses.map((course) => (
        <Card
          key={course.id}
          id={course.id}
          title={course.title}
          imageSrc={course.imageSrc}
          onClick={onClick}
          disabled={pending}
          isActive={course.id === activeCourseId}
        />
      ))}
    </div>
  );
};
