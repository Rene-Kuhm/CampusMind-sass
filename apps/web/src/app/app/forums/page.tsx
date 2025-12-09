'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { forums, ForumCategory, ForumThread, ForumReply } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
  ThumbsDown,
  Eye,
  MessageCircle,
  CheckCircle,
  Pin,
  Lock,
  Clock,
  User,
  Tag,
  Filter,
  ChevronLeft,
  Send,
  Loader2,
  TrendingUp,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForumsPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<(ForumThread & { replies: ForumReply[] }) | null>(null);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Modal states
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const [newThread, setNewThread] = useState({ title: '', content: '', categoryId: '', tags: '' });
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load categories
  useEffect(() => {
    if (token) {
      forums.getCategories(token).then(setCategories).catch(console.error);
      forums.getPopularTags(token, 10).then(setPopularTags).catch(console.error);
    }
  }, [token]);

  // Load threads
  const loadThreads = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await forums.getThreads(token, {
        categoryId: selectedCategory || undefined,
        search: searchQuery || undefined,
        sort: sortBy,
      });
      setThreads(result.threads);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Load thread details
  const loadThread = async (id: string) => {
    if (!token) return;
    try {
      const thread = await forums.getThread(token, id);
      setSelectedThread(thread);
    } catch (error) {
      console.error('Error loading thread:', error);
    }
  };

  // Create thread
  const handleCreateThread = async () => {
    if (!token || !newThread.title || !newThread.content || !newThread.categoryId) return;
    setIsSubmitting(true);
    try {
      const thread = await forums.createThread(token, {
        title: newThread.title,
        content: newThread.content,
        categoryId: newThread.categoryId,
        tags: newThread.tags ? newThread.tags.split(',').map(t => t.trim()) : undefined,
      });
      setThreads(prev => [thread, ...prev]);
      setIsNewThreadOpen(false);
      setNewThread({ title: '', content: '', categoryId: '', tags: '' });
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create reply
  const handleCreateReply = async () => {
    if (!token || !selectedThread || !newReply.trim()) return;
    setIsSubmitting(true);
    try {
      const reply = await forums.createReply(token, selectedThread.id, { content: newReply });
      setSelectedThread(prev => prev ? { ...prev, replies: [...prev.replies, reply] } : null);
      setNewReply('');
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vote
  const handleVoteThread = async (threadId: string, value: 1 | -1) => {
    if (!token) return;
    try {
      const result = await forums.voteThread(token, threadId, value);
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, voteScore: result.voteScore } : t));
      if (selectedThread?.id === threadId) {
        setSelectedThread(prev => prev ? { ...prev, voteScore: result.voteScore } : null);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleVoteReply = async (replyId: string, value: 1 | -1) => {
    if (!token) return;
    try {
      const result = await forums.voteReply(token, replyId, value);
      setSelectedThread(prev => prev ? {
        ...prev,
        replies: prev.replies.map(r => r.id === replyId ? { ...r, voteScore: result.voteScore } : r)
      } : null);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Accept reply
  const handleAcceptReply = async (replyId: string) => {
    if (!token) return;
    try {
      await forums.acceptReply(token, replyId);
      setSelectedThread(prev => prev ? {
        ...prev,
        isSolved: true,
        replies: prev.replies.map(r => r.id === replyId ? { ...r, isAccepted: true } : r)
      } : null);
    } catch (error) {
      console.error('Error accepting reply:', error);
    }
  };

  // Thread detail view
  if (selectedThread) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80">
          <div className="relative p-6">
            <button
              onClick={() => setSelectedThread(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al foro
            </button>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleVoteThread(selectedThread.id, 1)}
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <ThumbsUp className="h-5 w-5 text-secondary-400 hover:text-emerald-600" />
                </button>
                <span className={cn(
                  "font-bold text-lg",
                  selectedThread.voteScore > 0 ? "text-emerald-600" : selectedThread.voteScore < 0 ? "text-red-600" : "text-secondary-600"
                )}>
                  {selectedThread.voteScore}
                </span>
                <button
                  onClick={() => handleVoteThread(selectedThread.id, -1)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <ThumbsDown className="h-5 w-5 text-secondary-400 hover:text-red-600" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {selectedThread.isPinned && <Badge variant="warning"><Pin className="h-3 w-3 mr-1" />Fijado</Badge>}
                  {selectedThread.isLocked && <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Cerrado</Badge>}
                  {selectedThread.isSolved && <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Resuelto</Badge>}
                </div>
                <h1 className="text-2xl font-bold text-secondary-900 mb-2">{selectedThread.title}</h1>
                <div className="flex items-center gap-4 text-sm text-secondary-500">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedThread.author?.profile?.firstName} {selectedThread.author?.profile?.lastName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(selectedThread.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedThread.viewCount} vistas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Thread content */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="prose prose-secondary max-w-none">
                  <p className="whitespace-pre-wrap">{selectedThread.content}</p>
                </div>
                {selectedThread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-secondary-100">
                    {selectedThread.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Replies */}
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              {selectedThread.replies.length} Respuestas
            </h3>

            <div className="space-y-4 mb-6">
              {selectedThread.replies.map(reply => (
                <Card key={reply.id} className={cn(reply.isAccepted && "ring-2 ring-emerald-500")}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleVoteReply(reply.id, 1)}
                          className="p-1 hover:bg-emerald-100 rounded transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4 text-secondary-400 hover:text-emerald-600" />
                        </button>
                        <span className={cn(
                          "font-medium text-sm",
                          reply.voteScore > 0 ? "text-emerald-600" : reply.voteScore < 0 ? "text-red-600" : "text-secondary-600"
                        )}>
                          {reply.voteScore}
                        </span>
                        <button
                          onClick={() => handleVoteReply(reply.id, -1)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <ThumbsDown className="h-4 w-4 text-secondary-400 hover:text-red-600" />
                        </button>
                      </div>
                      <div className="flex-1">
                        {reply.isAccepted && (
                          <Badge variant="success" className="mb-2">
                            <CheckCircle className="h-3 w-3 mr-1" />Respuesta aceptada
                          </Badge>
                        )}
                        <p className="text-secondary-700 whitespace-pre-wrap">{reply.content}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-100">
                          <span className="text-sm text-secondary-500">
                            {reply.author?.profile?.firstName} {reply.author?.profile?.lastName} · {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                          {!selectedThread.isSolved && !reply.isAccepted && (
                            <Button variant="ghost" size="sm" onClick={() => handleAcceptReply(reply.id)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceptar respuesta
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Reply form */}
            {!selectedThread.isLocked && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-secondary-900 mb-3">Tu respuesta</h4>
                  <textarea
                    className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Escribe tu respuesta..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                  />
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="gradient"
                      onClick={handleCreateReply}
                      disabled={!newReply.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Responder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main forum view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                    Foros de Discusión
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Pregunta, aprende y ayuda a otros estudiantes
                </p>
              </div>
            </div>

            <Button variant="gradient" onClick={() => setIsNewThreadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Pregunta
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <Input
                placeholder="Buscar en el foro..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...categories.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'recent', label: 'Más recientes' },
                { value: 'popular', label: 'Más populares' },
                { value: 'unanswered', label: 'Sin responder' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main content */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : threads.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="h-8 w-8" />}
                  title="Sin discusiones"
                  description="Sé el primero en crear una pregunta"
                  action={
                    <Button variant="gradient" onClick={() => setIsNewThreadOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Pregunta
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {threads.map(thread => (
                    <Card
                      key={thread.id}
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => loadThread(thread.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center gap-1 text-center min-w-[50px]">
                            <span className={cn(
                              "font-bold",
                              thread.voteScore > 0 ? "text-emerald-600" : thread.voteScore < 0 ? "text-red-600" : "text-secondary-600"
                            )}>
                              {thread.voteScore}
                            </span>
                            <span className="text-xs text-secondary-400">votos</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 text-center min-w-[50px]">
                            <span className={cn(
                              "font-bold",
                              thread.isSolved ? "text-emerald-600" : "text-secondary-600"
                            )}>
                              {thread.replyCount}
                            </span>
                            <span className="text-xs text-secondary-400">resp.</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {thread.isPinned && <Pin className="h-4 w-4 text-amber-500" />}
                              {thread.isSolved && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                              {thread.isLocked && <Lock className="h-4 w-4 text-secondary-400" />}
                              <h3 className="font-medium text-secondary-900 truncate">{thread.title}</h3>
                            </div>
                            <p className="text-sm text-secondary-500 line-clamp-1 mb-2">{thread.content}</p>
                            <div className="flex items-center gap-3 text-xs text-secondary-400">
                              <span>{thread.author?.profile?.firstName} {thread.author?.profile?.lastName}</span>
                              <span>·</span>
                              <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />{thread.viewCount}
                              </span>
                            </div>
                            {thread.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {thread.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Categories */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3">Categorías</h3>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-lg transition-colors",
                          selectedCategory === cat.id ? "bg-primary-100 text-primary-700" : "hover:bg-secondary-100"
                        )}
                      >
                        <span className="text-sm">{cat.name}</span>
                        <Badge variant="secondary" className="text-xs">{cat.threadCount}</Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Popular Tags */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tags Populares
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(({ tag, count }) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary-200">
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      <Modal
        isOpen={isNewThreadOpen}
        onClose={() => setIsNewThreadOpen(false)}
        title="Nueva Pregunta"
        variant="glass"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Título *
            </label>
            <Input
              placeholder="¿Cuál es tu pregunta?"
              value={newThread.title}
              onChange={(e) => setNewThread(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Categoría *
            </label>
            <Select
              value={newThread.categoryId}
              onChange={(e) => setNewThread(prev => ({ ...prev, categoryId: e.target.value }))}
              options={[
                { value: '', label: 'Selecciona una categoría' },
                ...categories.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Descripción *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={6}
              placeholder="Describe tu pregunta en detalle..."
              value={newThread.content}
              onChange={(e) => setNewThread(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Tags (separados por coma)
            </label>
            <Input
              placeholder="matematicas, calculo, derivadas"
              value={newThread.tags}
              onChange={(e) => setNewThread(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsNewThreadOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreateThread}
              disabled={!newThread.title || !newThread.content || !newThread.categoryId || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publicar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
