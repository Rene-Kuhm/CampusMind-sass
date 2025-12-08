// Resource Sharing Library
// Generates shareable links and manages shared resources

export interface SharedResource {
  id: string;
  type: 'note' | 'flashcard-deck' | 'quiz' | 'mindmap';
  resourceId: string;
  title: string;
  description?: string;
  sharedBy: string;
  shareCode: string;
  createdAt: Date;
  expiresAt?: Date;
  viewCount: number;
  isPublic: boolean;
  allowCopy: boolean;
  password?: string;
}

export interface ShareOptions {
  isPublic: boolean;
  allowCopy: boolean;
  expiresIn?: number; // hours
  password?: string;
}

const STORAGE_KEY = 'campusmind-shared-resources';

// Generate unique share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get all shared resources
export function getSharedResources(): SharedResource[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const resources = JSON.parse(stored);
    return resources.map((r: SharedResource) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      expiresAt: r.expiresAt ? new Date(r.expiresAt) : undefined,
    }));
  } catch {
    return [];
  }
}

// Get shared resource by code
export function getSharedByCode(code: string): SharedResource | null {
  const resources = getSharedResources();
  const resource = resources.find(r => r.shareCode === code);

  if (!resource) return null;

  // Check expiration
  if (resource.expiresAt && new Date(resource.expiresAt) < new Date()) {
    return null;
  }

  return resource;
}

// Create share link
export function createShare(
  type: SharedResource['type'],
  resourceId: string,
  title: string,
  description: string | undefined,
  sharedBy: string,
  options: ShareOptions
): SharedResource {
  const resources = getSharedResources();

  const newShare: SharedResource = {
    id: generateId(),
    type,
    resourceId,
    title,
    description,
    sharedBy,
    shareCode: generateShareCode(),
    createdAt: new Date(),
    expiresAt: options.expiresIn
      ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
      : undefined,
    viewCount: 0,
    isPublic: options.isPublic,
    allowCopy: options.allowCopy,
    password: options.password,
  };

  resources.push(newShare);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));

  return newShare;
}

// Update share
export function updateShare(
  shareCode: string,
  updates: Partial<Omit<SharedResource, 'id' | 'shareCode' | 'createdAt'>>
): SharedResource | null {
  const resources = getSharedResources();
  const index = resources.findIndex(r => r.shareCode === shareCode);

  if (index === -1) return null;

  resources[index] = { ...resources[index], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));

  return resources[index];
}

// Delete share
export function deleteShare(shareCode: string): boolean {
  const resources = getSharedResources();
  const index = resources.findIndex(r => r.shareCode === shareCode);

  if (index === -1) return false;

  resources.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));

  return true;
}

// Increment view count
export function incrementViewCount(shareCode: string): void {
  const resources = getSharedResources();
  const resource = resources.find(r => r.shareCode === shareCode);

  if (resource) {
    resource.viewCount++;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  }
}

// Generate share URL
export function getShareUrl(shareCode: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/shared/${shareCode}`;
}

// Get my shares
export function getMyShares(userId: string = 'user-1'): SharedResource[] {
  const resources = getSharedResources();
  return resources.filter(r => r.sharedBy === userId);
}

// Copy to clipboard utility
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Resource type labels
export const RESOURCE_TYPE_LABELS: Record<SharedResource['type'], string> = {
  'note': 'Nota',
  'flashcard-deck': 'Deck de Flashcards',
  'quiz': 'Quiz',
  'mindmap': 'Mapa Mental',
};

// Resource type icons (for reference in UI)
export const RESOURCE_TYPE_COLORS: Record<SharedResource['type'], string> = {
  'note': 'from-yellow-500 to-amber-500',
  'flashcard-deck': 'from-pink-500 to-rose-500',
  'quiz': 'from-indigo-500 to-purple-500',
  'mindmap': 'from-cyan-500 to-blue-500',
};
