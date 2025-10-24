import { protectedProcedure } from "../../procedures/protected.procedure";
import { createProductSchema } from "../../validators/schemas";
import { db } from "../../db";
import { products } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import { createShopifyProduct } from "../../utils/shopify";
import { ORPCError } from "@orpc/server";
import { base } from "../../context";

export const productsRouter = base.router({
	createProduct: protectedProcedure
		.route({ method: "POST", path: "/products" })
		.meta({ roles: ["ADMIN", "PREMIUM"] })
		.input(createProductSchema)
		.handler(async ({ input, context }) => {
			const { name, price, image } = input;
			const user = context.user;

			if (!user) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "User not authenticated",
				});
			}

			if (!user.role?.canPostProducts) {
				throw new ORPCError("FORBIDDEN", {
					message: "You do not have permission to create products",
				});
			}

			if (image && !user.role?.canPostProductsWithImage) {
				throw new ORPCError("FORBIDDEN", {
					message: "You need a PREMIUM account to add images to products",
				});
			}

			try {
				const shopifyId = await createShopifyProduct(name, price);

				const [newProduct] = await db
					.insert(products)
					.values({
						shopifyId: shopifyId,
						createdBy: user.id,
						salesCount: 0,
						image: image || null,
					})
					.returning();

				return {
					id: newProduct.id,
					shopifyId: newProduct.shopifyId,
					message: "Product created successfully",
				};
			} catch (error) {
				console.error("Error creating product:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create product",
				});
			}
		}),

	getProducts: protectedProcedure
		.route({ method: "GET", path: "/products" })
		.handler(async () => {
			try {
				const allProducts = await db.query.products.findMany({
					with: {
						creator: {
							columns: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
					orderBy: desc(products.createdAt),
				});

				return allProducts;
			} catch (error) {
				console.error("Error fetching products:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch products",
				});
			}
		}),

	getMyProducts: protectedProcedure
		.route({ method: "GET", path: "/my-products" })
		.handler(async ({ context }) => {
			const user = context.user;

			if (!user) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "User not authenticated",
				});
			}

			try {
				const userProducts = await db.query.products.findMany({
					where: eq(products.createdBy, user.id),
					orderBy: desc(products.createdAt),
				});

				return userProducts;
			} catch (error) {
				console.error("Error fetching user products:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch your products",
				});
			}
		}),

	getMyBestsellers: protectedProcedure
		.route({ method: "GET", path: "/my-bestsellers" })
		.meta({ roles: ["PREMIUM"] })
		.handler(async ({ context }) => {
			const user = context.user;

			if (!user) {
				throw new ORPCError("UNAUTHORIZED", {
					message: "User not authenticated",
				});
			}

			if (!user.role?.canGetBestsellers) {
				throw new ORPCError("FORBIDDEN", {
					message: "You need a PREMIUM account to access bestsellers",
				});
			}

			try {
				const userBestsellers = await db.query.products.findMany({
					where: eq(products.createdBy, user.id),
					orderBy: desc(products.salesCount),
				});

				return userBestsellers;
			} catch (error) {
				console.error("Error fetching bestsellers:", error);
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to fetch your bestsellers",
				});
			}
		}),
});
