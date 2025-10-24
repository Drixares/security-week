import { ORPCError } from "@orpc/server";
import { env } from "../../env";
import { tryCatch } from "./try-catch";

interface ShopifyProduct {
	product: {
		title: string;
		variants: Array<{
			price: string;
		}>;
	};
}

interface ShopifyProductResponse {
	product: {
		id: number;
		title: string;
		variants: Array<{
			id: number;
			price: string;
		}>;
	};
}

export async function createShopifyProduct(
	name: string,
	price: number,
): Promise<string> {
	const shopifyUrl = `https://${env.SHOPIFY_SHOP_NAME}.myshopify.com/admin/api/2025-10/products.json`;

	const productData: ShopifyProduct = {
		product: {
			title: name,
			variants: [
				{
					price: price.toString(),
				},
			],
		},
	};

	const [error, response] = await tryCatch(
		fetch(shopifyUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Shopify-Access-Token": env.SHOPIFY_ACCESS_TOKEN,
			},
			body: JSON.stringify(productData),
		}),
	);

	if (error) {
		console.error("Error creating product in Shopify:", error);
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Failed to create product in Shopify",
		});
	}

	if (!response.ok) {
		const errorData = await response.json();
		console.error("Shopify API error:", errorData);
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: `Failed to create product in Shopify: ${response.statusText}`,
		});
	}

	const data = (await response.json()) as ShopifyProductResponse;

	if (!data.product || !data.product.id) {
		console.error("Invalid Shopify response:", data);
		throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Invalid response from Shopify API",
		});
	}

	return data.product.id.toString();
}
