import "dotenv/config";
import { db } from "./index";
import { roles } from "./schema";

async function seed() {
	try {
		console.log("🌱 Starting database seeding...");

		await db.insert(roles).values({
			name: "ADMIN",
			canPostLogin: true,
			canGetMyUser: true,
			canGetUsers: true,
			canPostProducts: true,
			canPostProductsWithImage: true,
			canGetBestsellers: true,
		});
		console.log("✅ ADMIN role created");

		await db.insert(roles).values({
			name: "PREMIUM",
			canPostLogin: true,
			canGetMyUser: true,
			canGetUsers: false,
			canPostProducts: true,
			canPostProductsWithImage: true,
			canGetBestsellers: true,
		});
		console.log("✅ PREMIUM role created");

		await db.insert(roles).values({
			name: "USER",
			canPostLogin: true,
			canGetMyUser: true,
			canGetUsers: false,
			canPostProducts: false,
			canPostProductsWithImage: false,
			canGetBestsellers: false,
		});
		console.log("✅ USER role created");

		await db.insert(roles).values({
			name: "BAN",
			canPostLogin: false,
			canGetMyUser: false,
			canGetUsers: false,
			canPostProducts: false,
			canPostProductsWithImage: false,
			canGetBestsellers: false,
		});
		console.log("✅ BAN role created");

		console.log("🎉 Database seeding completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		process.exit(1);
	}
}

seed();
