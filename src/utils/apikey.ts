import crypto from "node:crypto";

/**
 * Generate a secure random API key
 * Format: ak_<random_hex_string>
 */
export function generateApiKey(): string {
	const randomBytes = crypto.randomBytes(32);
	const key = `ak_${randomBytes.toString("hex")}`;
	return key;
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
	return crypto.createHash("sha256").update(apiKey).digest("hex");
}
