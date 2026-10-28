export const ADMIN_PIN = '57290';
const STORAGE_KEY = 'vtv_admin_pin_authenticated';

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

export function setAdminAuthenticated(val: boolean): void {
  if (typeof window === 'undefined') return;
  if (val) {
    sessionStorage.setItem(STORAGE_KEY, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function verifyAdminPin(pin: string): boolean {
  return pin.trim() === ADMIN_PIN;
}
