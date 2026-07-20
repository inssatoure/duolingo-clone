import { redirect } from "next/navigation";

// Leaderboard, Leagues and Quests are now a single tabbed page.
const QuestsPage = () => redirect("/leagues");

export default QuestsPage;
