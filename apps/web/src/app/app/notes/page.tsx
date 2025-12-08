'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  MoreVertical,
  FileText,
  Tag,
  Calendar,
  Edit3,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Heading1,
  Heading2,
  Quote,
  Code,
  Palette,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Note,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  toggleNotePin,
  searchNotes,
  NOTE_COLORS,
  getNoteColorClass,
} from '@/lib/notes';

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editColor, setEditColor] = useState<string | undefined>(undefined);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTag, setNewTag] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Load notes
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const allNotes = searchQuery ? searchNotes(searchQuery) : getNotes();
    // Sort: pinned first, then by updatedAt
    const sorted = allNotes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    setNotes(sorted);
  };

  useEffect(() => {
    loadNotes();
  }, [searchQuery]);

  const handleCreateNote = () => {
    const note = createNote({
      title: 'Nota sin título',
      content: '',
      tags: [],
      pinned: false,
    });
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags);
    setEditColor(note.color);
    setIsEditing(true);
    loadNotes();
  };

  const handleSelectNote = (note: Note) => {
    if (isEditing && selectedNote) {
      handleSaveNote();
    }
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags);
    setEditColor(note.color);
    setIsEditing(false);
  };

  const handleSaveNote = () => {
    if (!selectedNote) return;
    const updated = updateNote(selectedNote.id, {
      title: editTitle || 'Nota sin título',
      content: editContent,
      tags: editTags,
      color: editColor,
    });
    if (updated) {
      setSelectedNote(updated);
      setIsEditing(false);
      loadNotes();
    }
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      deleteNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
      loadNotes();
    }
  };

  const handleTogglePin = (id: string) => {
    toggleNotePin(id);
    loadNotes();
    if (selectedNote?.id === id) {
      setSelectedNote(prev => prev ? { ...prev, pinned: !prev.pinned } : null);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  // Rich text formatting
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - Note List */}
      <div className="w-80 border-r border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-secondary-900 dark:text-white">Notas</h1>
            <button
              onClick={handleCreateNote}
              className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-sm text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-secondary-400 dark:text-secondary-500">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No hay notas</p>
              <button
                onClick={handleCreateNote}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700"
              >
                Crear primera nota
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl transition-all',
                    getNoteColorClass(note.color),
                    'border border-secondary-200 dark:border-secondary-700',
                    selectedNote?.id === note.id
                      ? 'ring-2 ring-primary-500 border-transparent'
                      : 'hover:border-secondary-300 dark:hover:border-secondary-600'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {note.pinned && (
                          <Pin className="h-3 w-3 text-primary-500 flex-shrink-0" />
                        )}
                        <h3 className="font-medium text-secondary-900 dark:text-white truncate text-sm">
                          {note.title}
                        </h3>
                      </div>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2">
                        {note.content.replace(/<[^>]*>/g, '').slice(0, 100) || 'Sin contenido'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-secondary-400">
                          {formatDate(note.updatedAt)}
                        </span>
                        {note.tags.length > 0 && (
                          <span className="text-xs text-secondary-400">
                            {note.tags.length} etiqueta{note.tags.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Editor */}
      <div className="flex-1 bg-secondary-50 dark:bg-secondary-950 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título de la nota"
                    className="text-xl font-semibold bg-transparent border-none outline-none text-secondary-900 dark:text-white placeholder:text-secondary-400"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    {selectedNote.title}
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveNote}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditTitle(selectedNote.title);
                        setEditContent(selectedNote.content);
                        setEditTags(selectedNote.tags);
                        setEditColor(selectedNote.color);
                      }}
                      className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    Editar
                  </button>
                )}
                <button
                  onClick={() => handleTogglePin(selectedNote.id)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    selectedNote.pinned
                      ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                  )}
                  title={selectedNote.pinned ? 'Desfijar' : 'Fijar'}
                >
                  <Pin className="h-5 w-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                    title="Color"
                  >
                    <Palette className="h-5 w-5" />
                  </button>
                  {showColorPicker && (
                    <div className="absolute right-0 top-full mt-2 p-2 bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 z-10">
                      <div className="flex gap-2">
                        {NOTE_COLORS.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => {
                              setEditColor(color.value);
                              if (!isEditing && selectedNote) {
                                updateNote(selectedNote.id, { color: color.value });
                                setSelectedNote({ ...selectedNote, color: color.value });
                                loadNotes();
                              }
                              setShowColorPicker(false);
                            }}
                            className={cn(
                              'w-6 h-6 rounded-full border-2',
                              color.value
                                ? `bg-${color.value}-200`
                                : 'bg-white dark:bg-secondary-700',
                              editColor === color.value
                                ? 'border-primary-500'
                                : 'border-secondary-200 dark:border-secondary-600'
                            )}
                            style={{
                              backgroundColor: color.value
                                ? `var(--tw-colors-${color.value}-200, ${color.value})`
                                : undefined,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="p-2 rounded-lg text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Toolbar (when editing) */}
            {isEditing && (
              <div className="px-4 py-2 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => execCommand('bold')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Negrita"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  onClick={() => execCommand('italic')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Cursiva"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => execCommand('underline')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Subrayado"
                >
                  <Underline className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-secondary-200 dark:bg-secondary-700 mx-1" />
                <button
                  onClick={() => execCommand('formatBlock', 'h1')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Título 1"
                >
                  <Heading1 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => execCommand('formatBlock', 'h2')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Título 2"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-secondary-200 dark:bg-secondary-700 mx-1" />
                <button
                  onClick={() => execCommand('insertUnorderedList')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Lista"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => execCommand('insertOrderedList')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Lista numerada"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
                <button
                  onClick={() => execCommand('formatBlock', 'blockquote')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Cita"
                >
                  <Quote className="h-4 w-4" />
                </button>
                <button
                  onClick={() => execCommand('formatBlock', 'pre')}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Código"
                >
                  <Code className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-secondary-200 dark:bg-secondary-700 mx-1" />
                <button
                  onClick={() => {
                    const url = prompt('Ingresa la URL del enlace:');
                    if (url) execCommand('createLink', url);
                  }}
                  className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                  title="Enlace"
                >
                  <Link2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Tags (when editing) */}
            {isEditing && (
              <div className="px-4 py-2 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-secondary-400" />
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-primary-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Agregar etiqueta..."
                    className="px-2 py-1 bg-transparent border-none outline-none text-sm text-secondary-900 dark:text-secondary-100 placeholder:text-secondary-400"
                  />
                </div>
              </div>
            )}

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
              <div className={cn('min-h-full p-6', getNoteColorClass(selectedNote.color))}>
                {isEditing ? (
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setEditContent(e.currentTarget.innerHTML)}
                    className="min-h-[300px] prose dark:prose-invert prose-sm max-w-none focus:outline-none"
                    dangerouslySetInnerHTML={{ __html: editContent }}
                  />
                ) : (
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    {selectedNote.content ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedNote.content }} />
                    ) : (
                      <p className="text-secondary-400 italic">
                        Esta nota está vacía. Haz clic en &quot;Editar&quot; para agregar contenido.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            {!isEditing && (
              <div className="px-4 py-2 border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 flex items-center justify-between text-xs text-secondary-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Creada: {formatDate(selectedNote.createdAt)}
                  </span>
                  <span>Modificada: {formatDate(selectedNote.updatedAt)}</span>
                </div>
                {selectedNote.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    {selectedNote.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary-400">
            <FileText className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg mb-2">Selecciona una nota</p>
            <p className="text-sm mb-4">o crea una nueva para comenzar</p>
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Nueva nota
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
