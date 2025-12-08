// Notes storage and utilities

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  color?: string;
}

const STORAGE_KEY = 'campusmind-notes';

// Get all notes
export function getNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    const notes = JSON.parse(saved);
    return notes.map((n: Note) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }));
  } catch {
    return [];
  }
}

// Save notes
function saveNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Create a new note
export function createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
  const newNote: Note = {
    ...note,
    id: `note-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const notes = getNotes();
  saveNotes([newNote, ...notes]);
  return newNote;
}

// Update a note
export function updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Note | null {
  const notes = getNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) return null;

  const updatedNote = {
    ...notes[index],
    ...updates,
    updatedAt: new Date(),
  };
  notes[index] = updatedNote;
  saveNotes(notes);
  return updatedNote;
}

// Delete a note
export function deleteNote(id: string): boolean {
  const notes = getNotes();
  const filtered = notes.filter((n) => n.id !== id);
  if (filtered.length === notes.length) return false;
  saveNotes(filtered);
  return true;
}

// Get note by id
export function getNoteById(id: string): Note | null {
  const notes = getNotes();
  return notes.find((n) => n.id === id) || null;
}

// Get notes by subject
export function getNotesBySubject(subjectId: string): Note[] {
  const notes = getNotes();
  return notes.filter((n) => n.subjectId === subjectId);
}

// Search notes
export function searchNotes(query: string): Note[] {
  const notes = getNotes();
  const lowerQuery = query.toLowerCase();
  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(lowerQuery) ||
      n.content.toLowerCase().includes(lowerQuery) ||
      n.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// Toggle pin
export function toggleNotePin(id: string): Note | null {
  const note = getNoteById(id);
  if (!note) return null;
  return updateNote(id, { pinned: !note.pinned });
}

// Get recent notes
export function getRecentNotes(limit: number = 5): Note[] {
  const notes = getNotes();
  return notes
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

// Get pinned notes
export function getPinnedNotes(): Note[] {
  const notes = getNotes();
  return notes.filter((n) => n.pinned);
}

// Note colors
export const NOTE_COLORS = [
  { name: 'default', value: undefined, class: 'bg-white dark:bg-secondary-800' },
  { name: 'red', value: 'red', class: 'bg-red-50 dark:bg-red-900/20' },
  { name: 'orange', value: 'orange', class: 'bg-orange-50 dark:bg-orange-900/20' },
  { name: 'yellow', value: 'yellow', class: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { name: 'green', value: 'green', class: 'bg-green-50 dark:bg-green-900/20' },
  { name: 'blue', value: 'blue', class: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'purple', value: 'purple', class: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: 'pink', value: 'pink', class: 'bg-pink-50 dark:bg-pink-900/20' },
];

export function getNoteColorClass(color?: string): string {
  const found = NOTE_COLORS.find((c) => c.value === color);
  return found?.class || NOTE_COLORS[0].class;
}
