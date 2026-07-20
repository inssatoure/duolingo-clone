import { redirect } from "next/navigation";

// Leaderboard, Leagues and Quests are now a single tabbed page.
const LeaderboardPage = () => redirect("/leagues");

export default LeaderboardPage;
