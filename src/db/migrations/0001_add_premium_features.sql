-- Add new permissions to roles table for PREMIUM features
ALTER TABLE "roles" ADD COLUMN "can_post_products_with_image" boolean DEFAULT false NOT NULL;
ALTER TABLE "roles" ADD COLUMN "can_get_bestsellers" boolean DEFAULT false NOT NULL;

-- Add image column to products table
ALTER TABLE "products" ADD COLUMN "image" text;

