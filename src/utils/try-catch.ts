export async function tryCatch<T>(
	promise: Promise<T>,
): Promise<[undefined, T] | [Error, undefined]> {
	try {
		const data = await promise;
		return [undefined, data] as [undefined, T];
	} catch (error) {
		return [
			error instanceof Error ? error : new Error(String(error)),
			undefined,
		];
	}
}
