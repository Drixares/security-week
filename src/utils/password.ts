import { Role, User } from "../db/schema";

export const hashPassword = async (password: string) => {
	return Bun.password.hash(password, "bcrypt");
};

export const comparePassword = async (password: string, hash: string) => {
	return Bun.password.verify(password, hash, "bcrypt");
};

export const checkPasswordChanged = ({
	foundUser,
	iat,
	onError,
}: {
	foundUser: Partial<User> & {
		role: Role | null;
	};
	iat: number | undefined;
	onError: () => void;
}) => {
	if (foundUser.passwordChangedAt && iat) {
		const passwordChangedAtTimestamp = foundUser.passwordChangedAt.getTime();

		// If password was changed after token was issued, token is invalid
		// Convert iat from seconds to milliseconds for comparison
		if (passwordChangedAtTimestamp > iat * 1000) {
			onError();
		}
	}
};
