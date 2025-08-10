// Utility functions for the Weave OS

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format date to readable format
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than 1 week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // More than 1 week, show actual date
  return d.toLocaleDateString();
};

/**
 * Format date to short format (for UI)
 */
export const formatDateShort = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * Get MIME type icon class based on file type
 */
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'file-image';
  if (mimeType.startsWith('video/')) return 'file-video';
  if (mimeType.startsWith('audio/')) return 'file-audio';
  if (mimeType.startsWith('text/')) return 'file-text';
  if (mimeType === 'application/pdf') return 'file-pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'file-spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'file-presentation';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'file-document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'file-archive';
  return 'file';
};

/**
 * Validate file name
 */
export const isValidFileName = (filename: string): boolean => {
  if (!filename || filename.trim().length === 0) return false;
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) return false;
  
  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(filename.toUpperCase())) return false;
  
  // Check for names that end with a period or space
  if (filename.endsWith('.') || filename.endsWith(' ')) return false;
  
  return true;
};

/**
 * Generate a unique filename if a file with the same name exists
 */
export const generateUniqueFileName = (filename: string, existingFiles: string[]): string => {
  if (!existingFiles.includes(filename)) return filename;
  
  const extension = getFileExtension(filename);
  const nameWithoutExt = extension ? filename.slice(0, -(extension.length + 1)) : filename;
  
  let counter = 1;
  let newFilename;
  
  do {
    newFilename = extension 
      ? `${nameWithoutExt} (${counter}).${extension}`
      : `${nameWithoutExt} (${counter})`;
    counter++;
  } while (existingFiles.includes(newFilename));
  
  return newFilename;
};

/**
 * Parse path to get parent directory and filename
 */
export const parsePath = (path: string): { parent: string; filename: string } => {
  const normalizedPath = path.replace(/\/+/g, '/').replace(/\/$/, '');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  
  if (lastSlashIndex === -1) {
    return { parent: '/', filename: normalizedPath };
  }
  
  const parent = normalizedPath.slice(0, lastSlashIndex) || '/';
  const filename = normalizedPath.slice(lastSlashIndex + 1);
  
  return { parent, filename };
};

/**
 * Join path segments
 */
export const joinPath = (...segments: string[]): string => {
  return segments
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
};

/**
 * Check if user has permission for an action
 */
export const hasPermission = (permissions: any, action: string): boolean => {
  if (!permissions) return false;
  return permissions[action] === true;
};

/**
 * Get storage usage percentage
 */
export const getStorageUsagePercent = (used: number, quota: number): number => {
  if (quota === 0) return 0;
  return Math.round((used / quota) * 100);
};

/**
 * Get storage usage color based on percentage
 */
export const getStorageUsageColor = (percentage: number): string => {
  if (percentage < 50) return 'text-green-400';
  if (percentage < 80) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};
