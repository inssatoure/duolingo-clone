CREATE TABLE "user_pins" (
	"user_id" text PRIMARY KEY NOT NULL,
	"pin_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
