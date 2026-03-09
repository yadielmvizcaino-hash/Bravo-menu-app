
/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitizes a string to prevent basic XSS and injection attacks.
 * Note: React already escapes content in JSX, but this is useful for 
 * data that might be used in other contexts or for extra safety.
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

/**
 * Validates an email address
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validates a phone number (basic format)
 */
export const isValidPhone = (phone: string): boolean => {
  const re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
  return phone.length >= 8 && re.test(phone);
};

/**
 * Validates a URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Prevents rapid repeated calls to a function (basic rate limiting / debouncing)
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
