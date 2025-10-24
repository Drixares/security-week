import { base } from "../../context";
import { ORPCError } from "@orpc/server";
import { db } from "../../db";
import { products } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import {
	verifyShopifyWebhook,
	type ShopifyOrderWebhook,
} from "../../utils/shopify-webhook.js";

export const webhooksRouter = base.router({
	shopifySales: base
		.route({ method: "POST", path: "/webhooks/shopify-sales" })
		.handler(async ({ context }) => {
			try {
				const rawBody = context.rawBody;

				if (!rawBody) {
					throw new ORPCError("BAD_REQUEST", {
						message: "Missing request body",
					});
				}

				const request = context.honoContext.req.raw;
				const hmacHeader = request.headers.get("X-Shopify-Hmac-SHA256");
				const isValid = verifyShopifyWebhook(rawBody, hmacHeader);

				if (!isValid) {
					console.error("Invalid HMAC signature for Shopify webhook");
					throw new ORPCError("FORBIDDEN", {
						message: "Invalid webhook signature",
					});
				}

				let orderData: ShopifyOrderWebhook;
				try {
					orderData = JSON.parse(rawBody) as ShopifyOrderWebhook;
				} catch (error) {
					console.error("Error parsing webhook payload:", error);
					throw new ORPCError("BAD_REQUEST", {
						message: "Invalid JSON payload",
					});
				}

				if (!orderData.line_items || orderData.line_items.length === 0) {
					console.log("No line items in order");
					return {
						success: true,
						message: "No products to process",
						processedProducts: 0,
					};
				}

				let processedCount = 0;
				const errors: string[] = [];

				for (const lineItem of orderData.line_items) {
					if (!lineItem.product_id) {
						continue;
					}

					const shopifyProductId = lineItem.product_id.toString();
					const quantity = lineItem.quantity;

					try {
						const [product] = await db
							.select()
							.from(products)
							.where(eq(products.shopifyId, shopifyProductId))
							.limit(1);

						if (!product) {
							console.warn(
								`Product with Shopify ID ${shopifyProductId} not found in database`,
							);
							errors.push(`Product ${shopifyProductId} not found`);
							continue;
						}

						await db
							.update(products)
							.set({
								salesCount: sql`${products.salesCount} + ${quantity}`,
							})
							.where(eq(products.id, product.id));

						processedCount++;
					} catch (error) {
						console.error(
							`Error processing product ${shopifyProductId}:`,
							error,
						);
						errors.push(`Error updating product ${shopifyProductId}`);
					}
				}

				// Log des erreurs s'il y en a eu
				if (errors.length > 0) {
					console.warn(
						`Webhook processed with ${errors.length} errors:`,
						errors,
					);
				}

				return {
					success: true,
					message: `Webhook processed successfully. Updated ${processedCount} product(s).`,
					processedProducts: processedCount,
				};
			} catch (error) {
				if (error instanceof ORPCError) {
					throw error;
				}

				console.error("Unexpected error processing webhook:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to process webhook",
				});
			}
		}),
});
