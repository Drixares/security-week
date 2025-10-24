CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"key" varchar(255) NOT NULL,
	"user_id" text NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_name_unique" UNIQUE("name"),
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"shopify_id" varchar(255) NOT NULL,
	"created_by" text NOT NULL,
	"sales_count" integer DEFAULT 0 NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_shopify_id_unique" UNIQUE("shopify_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"can_post_login" boolean DEFAULT true NOT NULL,
	"can_get_my_user" boolean DEFAULT true NOT NULL,
	"can_get_users" boolean DEFAULT false NOT NULL,
	"can_post_products" boolean DEFAULT false NOT NULL,
	"can_post_products_with_image" boolean DEFAULT false NOT NULL,
	"can_get_bestsellers" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role_id" text,
	"password_changed_at" timestamp,
	"last_login_attempt" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;