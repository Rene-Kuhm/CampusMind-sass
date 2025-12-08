'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Heart,
  Reply,
  MoreHorizontal,
  Edit2,
  Trash2,
  X,
  User,
} from 'lucide-react';
import {
  CommentThread,
  Comment,
  getCommentsForResource,
  addComment,
  editComment,
  deleteComment,
  toggleLike,
  hasUserLiked,
  formatCommentTime,
  generateDemoComments,
} from '@/lib/comments';

interface CommentSectionProps {
  resourceId: string;
  currentUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function CommentSection({ resourceId, currentUser }: CommentSectionProps) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Default user for demo
  const user = currentUser || {
    id: 'demo-user',
    name: 'Usuario Demo',
  };

  useEffect(() => {
    // Generate demo comments if none exist
    generateDemoComments(resourceId);
    loadComments();
  }, [resourceId]);

  const loadComments = () => {
    const comments = getCommentsForResource(resourceId);
    setThreads(comments);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment(resourceId, newComment, user);
    setNewComment('');
    loadComments();
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    addComment(resourceId, replyContent, user, parentId);
    setReplyingTo(null);
    setReplyContent('');
    loadComments();
  };

  const handleEdit = (commentId: string) => {
    editComment(commentId, editContent, user.id);
    setEditingId(null);
    setEditContent('');
    loadComments();
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este comentario?')) {
      deleteComment(commentId, user.id);
      loadComments();
    }
    setOpenMenu(null);
  };

  const handleLike = (commentId: string) => {
    toggleLike(commentId, user.id);
    loadComments();
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setOpenMenu(null);
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwner = comment.userId === user.id;
    const isLiked = hasUserLiked(comment.id, user.id);

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12 mt-3' : ''}`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.userAvatar ? (
              <img
                src={comment.userAvatar}
                alt={comment.userName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {comment.userName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCommentTime(comment.createdAt)}
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      (editado)
                    </span>
                  )}
                </div>

                {/* Menu */}
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === comment.id ? null : comment.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenu === comment.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <button
                          onClick={() => startEdit(comment)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                  {comment.content}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-2 px-1">
              <button
                onClick={() => handleLike(comment.id)}
                className={`flex items-center gap-1 text-sm ${
                  isLiked
                    ? 'text-red-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </button>

              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                  className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500"
                >
                  <Reply className="h-4 w-4" />
                  Responder
                </button>
              )}
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply(comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim()}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-primary-500" />
        Comentarios ({threads.reduce((acc, t) => acc + 1 + t.replies.length, 0)})
      </h3>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-500" />
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Comentar
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {threads.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Sé el primero en comentar
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.comment.id}>
              {renderComment(thread.comment)}
              {thread.replies.map((reply) => renderComment(reply, true))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
