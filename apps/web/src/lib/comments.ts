// Comments System for Resources

export interface Comment {
  id: string;
  resourceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // For replies
  likes: number;
  likedBy: string[];
  isEdited: boolean;
}

export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}

const STORAGE_KEY = 'campusmind-comments';

// Get all comments
function getAllComments(): Comment[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored).map((c: Comment) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
      }));
    } catch {
      return [];
    }
  }
  return [];
}

// Save comments
function saveComments(comments: Comment[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
}

// Get comments for a resource
export function getCommentsForResource(resourceId: string): CommentThread[] {
  const allComments = getAllComments();
  const resourceComments = allComments.filter(c => c.resourceId === resourceId);

  // Organize into threads
  const rootComments = resourceComments.filter(c => !c.parentId);
  const threads: CommentThread[] = rootComments.map(comment => ({
    comment,
    replies: resourceComments
      .filter(c => c.parentId === comment.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  }));

  // Sort threads by newest first
  return threads.sort((a, b) => b.comment.createdAt.getTime() - a.comment.createdAt.getTime());
}

// Get comment count for a resource
export function getCommentCount(resourceId: string): number {
  const allComments = getAllComments();
  return allComments.filter(c => c.resourceId === resourceId).length;
}

// Add a comment
export function addComment(
  resourceId: string,
  content: string,
  user: { id: string; name: string; avatar?: string },
  parentId?: string
): Comment {
  const allComments = getAllComments();

  const newComment: Comment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    resourceId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: content.trim(),
    createdAt: new Date(),
    parentId,
    likes: 0,
    likedBy: [],
    isEdited: false,
  };

  allComments.push(newComment);
  saveComments(allComments);

  return newComment;
}

// Edit a comment
export function editComment(
  commentId: string,
  newContent: string,
  userId: string
): Comment | null {
  const allComments = getAllComments();
  const commentIndex = allComments.findIndex(c => c.id === commentId);

  if (commentIndex === -1) return null;

  const comment = allComments[commentIndex];

  // Only allow editing own comments
  if (comment.userId !== userId) return null;

  comment.content = newContent.trim();
  comment.updatedAt = new Date();
  comment.isEdited = true;

  saveComments(allComments);
  return comment;
}

// Delete a comment
export function deleteComment(commentId: string, userId: string): boolean {
  const allComments = getAllComments();
  const comment = allComments.find(c => c.id === commentId);

  if (!comment || comment.userId !== userId) return false;

  // Delete the comment and all its replies
  const updatedComments = allComments.filter(
    c => c.id !== commentId && c.parentId !== commentId
  );

  saveComments(updatedComments);
  return true;
}

// Toggle like on a comment
export function toggleLike(commentId: string, userId: string): Comment | null {
  const allComments = getAllComments();
  const commentIndex = allComments.findIndex(c => c.id === commentId);

  if (commentIndex === -1) return null;

  const comment = allComments[commentIndex];
  const likedIndex = comment.likedBy.indexOf(userId);

  if (likedIndex === -1) {
    // Add like
    comment.likedBy.push(userId);
    comment.likes++;
  } else {
    // Remove like
    comment.likedBy.splice(likedIndex, 1);
    comment.likes--;
  }

  saveComments(allComments);
  return comment;
}

// Check if user liked a comment
export function hasUserLiked(commentId: string, userId: string): boolean {
  const allComments = getAllComments();
  const comment = allComments.find(c => c.id === commentId);
  return comment ? comment.likedBy.includes(userId) : false;
}

// Get recent comments (for activity feed)
export function getRecentComments(limit: number = 10): Comment[] {
  const allComments = getAllComments();
  return allComments
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// Format relative time
export function formatCommentTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  if (weeks < 4) return `Hace ${weeks} sem`;
  if (months < 12) return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
  return date.toLocaleDateString();
}

// Generate demo comments
export function generateDemoComments(resourceId: string): void {
  const existingComments = getCommentsForResource(resourceId);
  if (existingComments.length > 0) return;

  const demoUsers = [
    { id: 'user-1', name: 'María García', avatar: undefined },
    { id: 'user-2', name: 'Carlos López', avatar: undefined },
    { id: 'user-3', name: 'Ana Martínez', avatar: undefined },
  ];

  const demoComments = [
    '¡Excelente recurso! Me ayudó mucho con el examen.',
    '¿Alguien tiene más material sobre este tema?',
    'Gracias por compartir, muy útil.',
  ];

  demoComments.forEach((content, index) => {
    const user = demoUsers[index % demoUsers.length];
    addComment(resourceId, content, user);
  });
}
