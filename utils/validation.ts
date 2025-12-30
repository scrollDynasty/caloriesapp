export function validateApiUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return parsed.protocol === 'http:';
    }
    
    const isLocalIP = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(parsed.hostname);
    if (isLocalIP) {
      return parsed.protocol === 'https:';
    }
    
    if (parsed.hostname === '10.0.2.2') {
      return parsed.protocol === 'http:';
    }
    
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '');
}

export function sanitizeUsername(username: string): string {
  if (typeof username !== 'string') {
    return '';
  }
  
  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 50);
}

export function sanitizeNumber(value: any, min: number = -Infinity, max: number = Infinity): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  
  if (!Number.isFinite(num)) {
    return null;
  }
  
  if (num < min || num > max) {
    return null;
  }
  
  return num;
}

export function sanitizeBarcode(barcode: string): string {
  if (typeof barcode !== 'string') {
    return '';
  }
  
  return barcode.trim().replace(/[^0-9]/g, '').slice(0, 50);
}

export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') {
    return 'file';
  }
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 255)
    .replace(/^\.+|\.+$/g, '');
}

export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

