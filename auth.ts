export function sanitizeUser(user: any) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function authenticateUser(users: any[], username: string, password: string) {
  const normalizedUsername = String(username ?? '').trim().toLowerCase();
  const normalizedPassword = String(password ?? '');

  if (!normalizedUsername || !normalizedPassword) {
    return null;
  }

  return users.find((user) => {
    const currentUsername = String(user?.username ?? '').trim().toLowerCase();
    const currentPassword = String(user?.password ?? '');
    return currentUsername === normalizedUsername && currentPassword === normalizedPassword;
  }) ?? null;
}
