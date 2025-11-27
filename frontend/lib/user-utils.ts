export function getUserSpokenName(user: { name: string; name_pronunciation?: string | null }): string {
  return user.name_pronunciation?.trim() || user.name;
}

export function getUserDisplayName(user: { name: string }): string {
  return user.name;
}
