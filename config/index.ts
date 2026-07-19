import type { Metadata } from "next";

export const siteConfig: Metadata = {
  title: "WolofLingo",
  description:
    "Learn Wolof from French or English — and French or English from Wolof. Interactive lessons, quizzes, gamification and progress tracking.",
  keywords: [
    "wolof",
    "senegal",
    "learn-wolof",
    "apprendre-wolof",
    "jang-wolof",
    "language-learning",
    "woloflingo",
    "nextjs",
    "react",
    "typescript",
    "postgresql",
    "drizzle",
    "clerk",
    "tailwindcss",
  ] as Array<string>,
  authors: {
    name: "Issa Touré",
    url: "https://www.issatoure.com",
  },
  creator: "Issa Touré",
} as const;

export const links = {
  sourceCode: "https://github.com/inssatoure/duolingo-clone",
  website: "https://www.issatoure.com",
  linkedin: "https://sn.linkedin.com/in/01issatoure",
  instagram: "https://www.instagram.com/inssa_tourei",
  email: "apsfdsn@gmail.com",
} as const;
