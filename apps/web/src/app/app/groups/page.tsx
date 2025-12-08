'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Share2,
  Settings,
  ChevronRight,
  Copy,
  Check,
  X,
  Send,
  FileText,
  Link as LinkIcon,
  Globe,
  Lock,
  UserPlus,
  LogOut,
  MoreVertical,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  StudyGroup,
  GroupMessage,
  SharedResource,
  getStudyGroups,
  createStudyGroup,
  addGroupMessage,
  addGroupResource,
  joinStudyGroup,
  leaveStudyGroup,
  getGroupByInviteCode,
  DEMO_USER,
  GROUP_GRADIENTS,
} from '@/lib/study-groups';

type TabType = 'chat' | 'resources' | 'members';

export default function StudyGroupsPage() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Load groups
  useEffect(() => {
    setGroups(getStudyGroups());
  }, []);

  // Filter groups
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Send message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedGroup) return;

    const message = addGroupMessage(selectedGroup.id, {
      authorId: DEMO_USER.id,
      authorName: DEMO_USER.name,
      content: messageInput,
      type: 'text',
    });

    if (message) {
      setSelectedGroup({
        ...selectedGroup,
        messages: [...selectedGroup.messages, message],
      });
      setGroups(getStudyGroups());
    }

    setMessageInput('');
  };

  // Copy invite code
  const handleCopyCode = () => {
    if (!selectedGroup) return;
    navigator.clipboard.writeText(selectedGroup.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Leave group
  const handleLeaveGroup = () => {
    if (!selectedGroup) return;
    if (leaveStudyGroup(selectedGroup.id)) {
      setGroups(getStudyGroups());
      setSelectedGroup(null);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left Sidebar - Group List */}
      <div className="w-80 border-r border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-secondary-900 dark:text-white">
              Grupos de Estudio
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinModal(true)}
                className="p-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg"
                title="Unirse a grupo"
              >
                <UserPlus className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                title="Crear grupo"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar grupos..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
              <p className="text-secondary-500 dark:text-secondary-400">
                No hay grupos todavía
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-primary-500 hover:text-primary-600 font-medium"
              >
                Crear el primero
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    'w-full p-3 rounded-xl text-left transition-colors',
                    selectedGroup?.id === group.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
                      : 'bg-secondary-50 dark:bg-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-700 border-2 border-transparent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br',
                      group.coverGradient
                    )}>
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-secondary-900 dark:text-white truncate">
                        {group.name}
                      </h3>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400 truncate">
                        {group.members.length} miembros
                      </p>
                      {group.messages.length > 0 && (
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1 truncate">
                          {group.messages[group.messages.length - 1].content}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-secondary-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Selected Group */}
      {selectedGroup ? (
        <div className="flex-1 flex flex-col bg-secondary-50 dark:bg-secondary-950">
          {/* Group Header */}
          <div className="bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br',
                  selectedGroup.coverGradient
                )}>
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
                    {selectedGroup.name}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-secondary-500 dark:text-secondary-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedGroup.members.length} miembros
                    </span>
                    <span className="flex items-center gap-1">
                      {selectedGroup.isPublic ? (
                        <>
                          <Globe className="h-4 w-4" />
                          Público
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Privado
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-700"
                >
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {selectedGroup.inviteCode}
                </button>
                <button
                  onClick={handleLeaveGroup}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Salir del grupo"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4">
              {[
                { id: 'chat', label: 'Chat', icon: MessageCircle },
                { id: 'resources', label: 'Recursos', icon: FileText },
                { id: 'members', label: 'Miembros', icon: Users },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabType)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === id
                      ? 'bg-primary-500 text-white'
                      : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <div className="h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedGroup.messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
                      <p className="text-secondary-500 dark:text-secondary-400">
                        No hay mensajes todavía
                      </p>
                      <p className="text-sm text-secondary-400 dark:text-secondary-500">
                        Sé el primero en escribir
                      </p>
                    </div>
                  ) : (
                    selectedGroup.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.authorId === DEMO_USER.id && 'flex-row-reverse'
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium">
                            {message.authorName[0]}
                          </span>
                        </div>
                        <div className={cn(
                          'max-w-[70%] rounded-2xl p-3',
                          message.authorId === DEMO_USER.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white'
                        )}>
                          <p className={cn(
                            'text-xs mb-1 font-medium',
                            message.authorId === DEMO_USER.id
                              ? 'text-primary-100'
                              : 'text-secondary-500 dark:text-secondary-400'
                          )}>
                            {message.authorName}
                          </p>
                          <p>{message.content}</p>
                          <p className={cn(
                            'text-xs mt-1',
                            message.authorId === DEMO_USER.id
                              ? 'text-primary-200'
                              : 'text-secondary-400 dark:text-secondary-500'
                          )}>
                            {new Date(message.createdAt).toLocaleTimeString('es', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 px-4 py-3 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white">
                    Recursos compartidos
                  </h3>
                  <button className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                    <Plus className="h-4 w-4" />
                    Compartir recurso
                  </button>
                </div>

                {selectedGroup.resources.length === 0 ? (
                  <div className="text-center py-12">
                    <Share2 className="h-12 w-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
                    <p className="text-secondary-500 dark:text-secondary-400">
                      No hay recursos compartidos
                    </p>
                    <p className="text-sm text-secondary-400 dark:text-secondary-500">
                      Comparte notas, flashcards o enlaces útiles
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {selectedGroup.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="bg-white dark:bg-secondary-800 rounded-xl p-4 border border-secondary-200 dark:border-secondary-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            {resource.type === 'link' ? (
                              <LinkIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            ) : resource.type === 'flashcard' ? (
                              <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-secondary-900 dark:text-white">
                              {resource.title}
                            </h4>
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">
                              Compartido por {resource.sharedBy}
                            </p>
                            {resource.description && (
                              <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-2">
                                {resource.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="p-4">
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-4">
                  {selectedGroup.members.length} miembros
                </h3>

                <div className="space-y-2">
                  {selectedGroup.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-secondary-800 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {member.name[0]}
                            </span>
                          </div>
                          {member.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-secondary-800 rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900 dark:text-white">
                            {member.name}
                            {member.id === DEMO_USER.id && (
                              <span className="text-secondary-400"> (tú)</span>
                            )}
                          </p>
                          <p className="text-sm text-secondary-500 dark:text-secondary-400 capitalize">
                            {member.role === 'admin' ? 'Administrador' :
                              member.role === 'moderator' ? 'Moderador' : 'Miembro'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No Group Selected */
        <div className="flex-1 flex items-center justify-center bg-secondary-50 dark:bg-secondary-950">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
              Selecciona un grupo
            </h2>
            <p className="text-secondary-500 dark:text-secondary-400 mb-6">
              O crea uno nuevo para empezar a colaborar
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Crear grupo
            </button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(group) => {
            setGroups(getStudyGroups());
            setSelectedGroup(group);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onJoined={(group) => {
            setGroups(getStudyGroups());
            setSelectedGroup(group);
            setShowJoinModal(false);
          }}
        />
      )}
    </div>
  );
}

// Create Group Modal Component
function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (group: StudyGroup) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedGradient, setSelectedGradient] = useState(GROUP_GRADIENTS[0]);
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const group = createStudyGroup({
      name: name.trim(),
      description: description.trim(),
      subject: subject.trim() || undefined,
      coverGradient: selectedGradient,
      isPublic,
      maxMembers: 20,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    onCreated(group);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-secondary-900 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Crear nuevo grupo
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Color selector */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Color del grupo
            </label>
            <div className="flex gap-2 flex-wrap">
              {GROUP_GRADIENTS.map((gradient) => (
                <button
                  key={gradient}
                  type="button"
                  onClick={() => setSelectedGradient(gradient)}
                  className={cn(
                    'w-10 h-10 rounded-lg bg-gradient-to-br transition-transform',
                    gradient,
                    selectedGradient === gradient && 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Nombre del grupo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cálculo Diferencial"
              className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿De qué trata este grupo?"
              rows={3}
              className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Materia
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Matemáticas"
              className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: cálculo, integrales, universidad"
              className="w-full px-4 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors',
                isPublic ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
              )}
            >
              <span className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                isPublic ? 'left-6' : 'left-1'
              )} />
            </button>
            <div>
              <p className="font-medium text-secondary-900 dark:text-white">
                {isPublic ? 'Grupo público' : 'Grupo privado'}
              </p>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {isPublic ? 'Cualquiera puede encontrar y unirse' : 'Solo con código de invitación'}
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium hover:bg-secondary-50 dark:hover:bg-secondary-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Join Group Modal Component
function JoinGroupModal({
  onClose,
  onJoined,
}: {
  onClose: () => void;
  onJoined: (group: StudyGroup) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const group = getGroupByInviteCode(code.trim().toUpperCase());
    if (!group) {
      setError('Código de invitación no válido');
      return;
    }

    const joined = joinStudyGroup(group.id);
    if (joined) {
      onJoined(joined);
    } else {
      setError('No se pudo unir al grupo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-secondary-900 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Unirse a un grupo
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Código de invitación
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Ej: ABC123"
              className="w-full px-4 py-3 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl font-mono tracking-widest"
              maxLength={6}
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center">
            Pide el código de invitación al administrador del grupo
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium hover:bg-secondary-50 dark:hover:bg-secondary-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!code.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unirse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
