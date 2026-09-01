import path from 'path';

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.txt'
]);

// Explicitly blocked dangerous extensions (executables, scripts, macro-enabled dangerous formats)
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.js', '.jsx', '.ts', '.tsx',
  '.vbs', '.vbe', '.wsf', '.wsh', '.msc', '.jar', '.com', '.scr', '.hta',
  '.cpl', '.msi', '.msp', '.php', '.phtml', '.py', '.rb', '.pl', '.asp',
  '.aspx', '.xhtml', '.svg', '.html', '.htm'
]);

/**
 * Sanitize original filename to prevent path traversal and script execution
 */
export function sanitizeFilename(filename: string): string {
  // Remove null bytes and control characters
  let safe = filename.replace(/[\x00-\x1F\x7F]/g, '');
  // Remove path traversal characters (/, \, ..)
  safe = path.basename(safe);
  // Replace spaces and unusual characters with underscores, keeping dots, dashes, alphanumeric
  safe = safe.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  // Trim leading/trailing dots or spaces
  safe = safe.replace(/^[.\s]+|[.\s]+$/g, '');
  
  if (!safe) {
    safe = 'document';
  }
  return safe;
}

/**
 * Validate whether an extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return false;
  }
  return ALLOWED_EXTENSIONS.has(ext);
}

/**
 * Get MIME type category for UI display & preview selection
 */
export function getFileTypeCategory(mimeType: string, filename: string): 'pdf' | 'image' | 'text' | 'document' | 'other' {
  const ext = path.extname(filename).toLowerCase();
  if (mimeType.includes('pdf') || ext === '.pdf') return 'pdf';
  if (mimeType.includes('image') || ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'image';
  if (mimeType.includes('text') || ext === '.txt') return 'text';
  if (['.doc', '.docx', '.ppt', '.pptx'].includes(ext)) return 'document';
  return 'other';
}
