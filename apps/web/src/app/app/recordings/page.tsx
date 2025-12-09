'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { recordings, AudioRecording, subjects as subjectsApi, Subject } from '@/lib/api';
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
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Trash2,
  Bookmark,
  StickyNote,
  Upload,
  Clock,
  Calendar,
  Star,
  Loader2,
  Download,
  Volume2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RecordingsPage() {
  const { token } = useAuth();
  const [recordingsList, setRecordingsList] = useState<AudioRecording[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<AudioRecording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Form states
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subjectId: '',
    description: '',
    location: '',
    professorName: '',
    file: null as File | null,
  });

  const [bookmarkForm, setBookmarkForm] = useState({ label: '', color: '#3B82F6' });
  const [noteForm, setNoteForm] = useState({ content: '', addTimestamp: true });

  // Load data
  const loadRecordings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await recordings.list(token);
      setRecordingsList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading recordings:', error);
      setRecordingsList([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(setSubjects).catch(console.error);
      loadRecordings();
    }
  }, [token, loadRecordings]);

  // Audio controls
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Upload recording
  const handleUpload = async () => {
    if (!token || !uploadForm.file || !uploadForm.title) return;
    try {
      const fakeUrl = URL.createObjectURL(uploadForm.file);
      await recordings.create(token, {
        title: uploadForm.title,
        fileUrl: fakeUrl,
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        mimeType: uploadForm.file.type,
        duration: 0,
        subjectId: uploadForm.subjectId || undefined,
        description: uploadForm.description || undefined,
        location: uploadForm.location || undefined,
        professorName: uploadForm.professorName || undefined,
      });
      setIsUploadModalOpen(false);
      setUploadForm({ title: '', subjectId: '', description: '', location: '', professorName: '', file: null });
      loadRecordings();
    } catch (error) {
      console.error('Error uploading:', error);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string) => {
    if (!token) return;
    try {
      const updated = await recordings.toggleFavorite(token, id);
      setRecordingsList(prev => prev.map(r => r.id === id ? updated : r));
      if (selectedRecording?.id === id) setSelectedRecording(updated);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Add bookmark
  const handleAddBookmark = async () => {
    if (!token || !selectedRecording || !bookmarkForm.label) return;
    try {
      await recordings.addBookmark(token, selectedRecording.id, {
        timestamp: Math.floor(currentTime),
        label: bookmarkForm.label,
        color: bookmarkForm.color,
      });
      setIsBookmarkModalOpen(false);
      setBookmarkForm({ label: '', color: '#3B82F6' });
      const updated = await recordings.get(token, selectedRecording.id);
      setSelectedRecording(updated);
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!token || !selectedRecording || !noteForm.content) return;
    try {
      await recordings.addNote(token, selectedRecording.id, {
        content: noteForm.content,
        timestamp: noteForm.addTimestamp ? Math.floor(currentTime) : undefined,
      });
      setIsNoteModalOpen(false);
      setNoteForm({ content: '', addTimestamp: true });
      const updated = await recordings.get(token, selectedRecording.id);
      setSelectedRecording(updated);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  // Delete recording
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await recordings.delete(token, id);
      setRecordingsList(prev => prev.filter(r => r.id !== id));
      if (selectedRecording?.id === id) setSelectedRecording(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Detail view
  if (selectedRecording) {
    return (
      <div className="min-h-screen">
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button onClick={() => setSelectedRecording(null)} className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4">
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Mic className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedRecording.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{formatDuration(selectedRecording.duration)}</Badge>
                    <span className="text-sm text-secondary-500">{new Date(selectedRecording.recordedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleToggleFavorite(selectedRecording.id)}>
                  <Star className={cn("h-4 w-4", selectedRecording.isFavorite && "fill-amber-400 text-amber-400")} />
                </Button>
                <Button variant="outline" onClick={() => handleDelete(selectedRecording.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Audio Player */}
            <Card>
              <CardContent className="p-6">
                <audio
                  ref={audioRef}
                  src={selectedRecording.fileUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                {/* Progress Bar */}
                <div className="mb-4">
                  <div
                    className="h-2 bg-secondary-100 rounded-full cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = x / rect.width;
                      handleSeek(percentage * selectedRecording.duration);
                    }}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full relative"
                      style={{ width: `${(currentTime / selectedRecording.duration) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-rose-500" />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-secondary-500 mt-1">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(selectedRecording.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => handleSeek(Math.max(0, currentTime - 10))}>-10s</Button>
                  <Button
                    variant="gradient"
                    className="w-14 h-14 rounded-full p-0"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleSeek(Math.min(selectedRecording.duration, currentTime + 10))}>+10s</Button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => setIsBookmarkModalOpen(true)}>
                    <Bookmark className="h-4 w-4 mr-2" />
                    Marcador
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsNoteModalOpen(true)}>
                    <StickyNote className="h-4 w-4 mr-2" />
                    Nota
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bookmarks */}
            {selectedRecording.bookmarks && selectedRecording.bookmarks.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-rose-500" />
                    Marcadores
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecording.bookmarks.map(bookmark => (
                      <button
                        key={bookmark.id}
                        onClick={() => handleSeek(bookmark.timestamp)}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bookmark.color }} />
                        <span className="text-sm font-medium">{bookmark.label}</span>
                        <span className="text-xs text-secondary-500">{formatDuration(bookmark.timestamp)}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {selectedRecording.notes && selectedRecording.notes.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-pink-500" />
                    Notas
                  </h3>
                  <div className="space-y-2">
                    {selectedRecording.notes.map(note => (
                      <div key={note.id} className="p-3 bg-secondary-50 rounded-lg">
                        {note.timestamp && (
                          <button
                            onClick={() => handleSeek(note.timestamp!)}
                            className="text-xs text-rose-500 font-medium mb-1"
                          >
                            {formatDuration(note.timestamp)}
                          </button>
                        )}
                        <p className="text-sm text-secondary-700">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bookmark Modal */}
        <Modal isOpen={isBookmarkModalOpen} onClose={() => setIsBookmarkModalOpen(false)} title="Agregar Marcador" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-secondary-500">Tiempo: {formatDuration(Math.floor(currentTime))}</p>
            <Input placeholder="Etiqueta del marcador" value={bookmarkForm.label} onChange={(e) => setBookmarkForm(prev => ({ ...prev, label: e.target.value }))} />
            <input type="color" value={bookmarkForm.color} onChange={(e) => setBookmarkForm(prev => ({ ...prev, color: e.target.value }))} className="w-full h-10 rounded-lg" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBookmarkModalOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleAddBookmark}><Plus className="h-4 w-4 mr-2" />Agregar</Button>
            </div>
          </div>
        </Modal>

        {/* Note Modal */}
        <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="Agregar Nota" size="sm">
          <div className="space-y-4">
            <textarea
              placeholder="Escribe tu nota..."
              className="w-full h-32 p-3 border rounded-lg resize-none"
              value={noteForm.content}
              onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={noteForm.addTimestamp} onChange={(e) => setNoteForm(prev => ({ ...prev, addTimestamp: e.target.checked }))} />
              <span className="text-sm">Vincular al tiempo actual ({formatDuration(Math.floor(currentTime))})</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleAddNote}><Plus className="h-4 w-4 mr-2" />Agregar</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Mic className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500">Grabaciones de Clase</span>
                </h1>
                <p className="text-secondary-500 mt-0.5">Graba y organiza tus clases</p>
              </div>
            </div>
            <Button variant="gradient" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir Audio
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
          ) : recordingsList.length === 0 ? (
            <EmptyState
              icon={<Mic className="h-8 w-8" />}
              title="Sin grabaciones"
              description="Sube tu primera grabación de clase"
              action={<Button variant="gradient" onClick={() => setIsUploadModalOpen(true)}><Upload className="h-4 w-4 mr-2" />Subir Audio</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordingsList.map(recording => (
                <Card key={recording.id} className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden" onClick={() => setSelectedRecording(recording)}>
                  <div className="h-2 bg-gradient-to-r from-rose-500 to-pink-500" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                        <Volume2 className="h-6 w-6 text-white" />
                      </div>
                      {recording.isFavorite && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
                    </div>
                    <h3 className="font-semibold text-secondary-900 mb-1 truncate">{recording.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-secondary-500 mb-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(recording.duration)}</span>
                      <Calendar className="h-4 w-4 ml-2" />
                      <span>{new Date(recording.recordedAt).toLocaleDateString()}</span>
                    </div>
                    {recording.professorName && <Badge variant="secondary" className="text-xs">{recording.professorName}</Badge>}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-secondary-100">
                      <div className="flex items-center gap-2 text-xs text-secondary-400">
                        <Bookmark className="h-3 w-3" />{recording.bookmarks?.length || 0}
                        <StickyNote className="h-3 w-3 ml-2" />{recording.notes?.length || 0}
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(recording.id); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Subir Grabación" size="md">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-secondary-200 rounded-xl p-6 text-center hover:border-rose-400 transition-colors">
            <input type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadForm(prev => ({ ...prev, file: f, title: prev.title || f.name.replace(/\.[^/.]+$/, '') })); }} className="hidden" id="audio-upload" />
            <label htmlFor="audio-upload" className="cursor-pointer">
              {uploadForm.file ? (
                <div className="flex items-center justify-center gap-2"><Volume2 className="h-8 w-8 text-rose-500" /><span>{uploadForm.file.name}</span></div>
              ) : (
                <><Upload className="h-8 w-8 text-secondary-400 mx-auto mb-2" /><p className="text-secondary-500">Arrastra o haz clic para subir</p></>
              )}
            </label>
          </div>
          <Input placeholder="Título *" value={uploadForm.title} onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))} />
          <Select value={uploadForm.subjectId} onChange={(e) => setUploadForm(prev => ({ ...prev, subjectId: e.target.value }))} options={[{ value: '', label: 'Seleccionar materia' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} />
          <Input placeholder="Profesor" value={uploadForm.professorName} onChange={(e) => setUploadForm(prev => ({ ...prev, professorName: e.target.value }))} />
          <Input placeholder="Ubicación (aula, edificio)" value={uploadForm.location} onChange={(e) => setUploadForm(prev => ({ ...prev, location: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleUpload} disabled={!uploadForm.file || !uploadForm.title}><Upload className="h-4 w-4 mr-2" />Subir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
