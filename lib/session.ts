const USER_KEY = 'familyUserId';

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_KEY);
}

export function setStoredUserId(userId: string) {
  localStorage.setItem(USER_KEY, userId);
}

export function clearStoredUserId() {
  localStorage.removeItem(USER_KEY);
}
