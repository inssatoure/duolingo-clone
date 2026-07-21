-- NOTE: production DBs may already have a `recordings` table created at
-- runtime by the old lib/recordings.ts CREATE TABLE IF NOT EXISTS DDL (which
-- already included the UNIQUE(text_key, lang) constraint but not `voice`).
-- Use IF NOT EXISTS / conditional DDL here so this migration is safe to run
-- against both a fresh DB and one that already has the runtime-created table.
CREATE TABLE IF NOT EXISTS "recordings" (
	"id" serial PRIMARY KEY NOT NULL,
	"text_key" text NOT NULL,
	"lang" text NOT NULL,
	"mime" text NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recordings" ADD COLUMN IF NOT EXISTS "voice" text;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "recordings" ADD CONSTRAINT "recordings_text_key_lang_key" UNIQUE("text_key","lang");
EXCEPTION
	WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_active_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "user_image_src" SET DEFAULT '/mascot.png';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_text_key_idx" ON "recordings" USING btree ("text_key");--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_active_course_id_courses_id_fk" FOREIGN KEY ("active_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenge_options_challenge_id_idx" ON "challenge_options" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_progress_user_id_idx" ON "challenge_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_progress_user_id_challenge_id_key" ON "challenge_progress" USING btree ("user_id","challenge_id");--> statement-breakpoint
CREATE INDEX "challenges_lesson_id_idx" ON "challenges" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "friendships_requester_id_idx" ON "friendships" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friendships_receiver_id_idx" ON "friendships" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "lessons_unit_id_idx" ON "lessons" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "units_course_id_idx" ON "units" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "user_league_participation_user_id_idx" ON "user_league_participation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_league_participation_league_id_idx" ON "user_league_participation" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "user_league_participation_league_week_idx" ON "user_league_participation" USING btree ("league_id","week_start");--> statement-breakpoint
CREATE INDEX "user_progress_active_course_id_idx" ON "user_progress" USING btree ("active_course_id");--> statement-breakpoint
CREATE INDEX "user_progress_league_id_idx" ON "user_progress" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "user_progress_points_idx" ON "user_progress" USING btree ("points" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_purchases_user_id_idx" ON "user_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_purchases_item_id_idx" ON "user_purchases" USING btree ("item_id");