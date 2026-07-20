import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WoLingo",
    short_name: "WoLingo",
    description:
      "Apprends le wolof depuis le français ou l'anglais, et le français/anglais depuis le wolof.",
    start_url: "/learn",
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#D35400",
    icons: [
      { src: "/icon1.png", sizes: "32x32", type: "image/png" },
      { src: "/icon2.png", sizes: "180x180", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
