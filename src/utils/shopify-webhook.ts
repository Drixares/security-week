import { env } from "../../env";
import { createHmac, timingSafeEqual } from "crypto";

export function verifyShopifyWebhook(
	body: string,
	hmacHeader: string | null,
): boolean {
	if (!hmacHeader) {
		return false;
	}

	try {
		const hash = createHmac("sha256", env.SHOPIFY_WEBHOOK_SECRET)
			.update(body, "utf8")
			.digest("base64");

		const hmacBuffer = Buffer.from(hmacHeader);
		const hashBuffer = Buffer.from(hash);

		if (hmacBuffer.length !== hashBuffer.length) {
			return false;
		}

		return timingSafeEqual(hmacBuffer, hashBuffer);
	} catch (error) {
		console.error("Error verifying Shopify webhook signature:", error);
		return false;
	}
}

export interface ShopifyLineItem {
	id: number;
	product_id: number | null;
	variant_id: number;
	quantity: number;
	title: string;
	price: string;
}

export interface ShopifyOrderWebhook {
	id: number;
	email: string;
	created_at: string;
	updated_at: string;
	total_price: string;
	subtotal_price: string;
	line_items: ShopifyLineItem[];
	customer?: {
		id: number;
		email: string;
		first_name: string;
		last_name: string;
	};
}
