
export const hashPassword = async (password: string) => {
  return Bun.password.hash(password, "bcrypt");
};

export const comparePassword = async (password: string, hash: string) => {
  return Bun.password.verify(password, hash, "bcrypt");
};