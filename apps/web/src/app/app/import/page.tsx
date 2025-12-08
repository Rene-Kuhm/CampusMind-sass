'use client';

import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ImportResult,
  ImportedFlashcard,
  autoDetectAndParse,
  parseAnkiExport,
  parseQuizletExport,
  parseCSV,
  validateImportedFlashcards,
  IMPORT_TEMPLATES,
} from '@/lib/flashcard-import';

type ImportSource = 'anki' | 'quizlet' | 'csv' | 'text';

export default function ImportPage() {
  const [source, setSource] = useState<ImportSource>('anki');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sources: { id: ImportSource; name: string; description: string }[] = [
    {
      id: 'anki',
      name: 'Anki',
      description: 'Archivo de texto exportado desde Anki',
    },
    {
      id: 'quizlet',
      name: 'Quizlet',
      description: 'Texto copiado o exportado de Quizlet',
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Archivo CSV con columnas frente, reverso',
    },
    {
      id: 'text',
      name: 'Texto',
      description: 'Texto plano con formato personalizado',
    },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      parseContent(text, file.name);
    };
    reader.readAsText(file);
  };

  const parseContent = (text: string, filename?: string) => {
    let parseResult: ImportResult;

    switch (source) {
      case 'anki':
        parseResult = parseAnkiExport(text);
        break;
      case 'quizlet':
        parseResult = parseQuizletExport(text);
        break;
      case 'csv':
        parseResult = parseCSV(text);
        break;
      case 'text':
      default:
        parseResult = autoDetectAndParse(text, filename);
    }

    setResult(parseResult);
  };

  const handleParse = () => {
    if (!content.trim()) return;
    parseContent(content);
  };

  const handleImport = async () => {
    if (!result?.flashcards.length) return;

    setImporting(true);

    // Simulate import delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, this would save to the database
    // For now, save to localStorage
    const existing = JSON.parse(localStorage.getItem('imported-flashcards') || '[]');
    const newCards = result.flashcards.map((card, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      ...card,
      createdAt: new Date().toISOString(),
      source: result.source,
    }));
    localStorage.setItem('imported-flashcards', JSON.stringify([...existing, ...newCards]));

    setImporting(false);
    setImported(true);
  };

  const loadTemplate = () => {
    const template = IMPORT_TEMPLATES[source] || IMPORT_TEMPLATES.anki;
    setContent(template);
    setShowTemplate(false);
  };

  const copyTemplate = () => {
    const template = IMPORT_TEMPLATES[source] || IMPORT_TEMPLATES.anki;
    navigator.clipboard.writeText(template);
  };

  const resetImport = () => {
    setContent('');
    setResult(null);
    setImported(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const { valid, invalid } = result
    ? validateImportedFlashcards(result.flashcards)
    : { valid: [], invalid: [] };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Upload className="h-8 w-8 text-primary-500" />
            Importar Flashcards
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Importa tus tarjetas desde Anki, Quizlet, CSV u otros formatos
          </p>
        </div>

        {imported ? (
          // Success State
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Importación Exitosa
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Se importaron {valid.length} flashcards correctamente
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetImport}
                className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Importar Más
              </button>
              <a
                href="/app/subjects"
                className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                Ver Materias
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Source Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                1. Selecciona el Origen
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sources.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSource(s.id);
                      setResult(null);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      source === s.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {s.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {s.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  2. Sube o Pega el Contenido
                </h2>
                <button
                  onClick={() => setShowTemplate(!showTemplate)}
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  Ver plantilla
                  {showTemplate ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {/* Template Preview */}
              {showTemplate && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Plantilla {sources.find(s => s.id === source)?.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={copyTemplate}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Copiar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={loadTemplate}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Usar plantilla"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
                    {IMPORT_TEMPLATES[source] || IMPORT_TEMPLATES.anki}
                  </pre>
                </div>
              )}

              {/* File Upload */}
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-primary-500">Haz clic para subir</span> o arrastra un archivo
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      .txt, .csv, .tsv
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".txt,.csv,.tsv"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Text Area */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">o pega el contenido:</span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Pega aquí el contenido de ${sources.find(s => s.id === source)?.name}...`}
                  className="w-full h-48 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              {/* Parse Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleParse}
                  disabled={!content.trim()}
                  className="px-6 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Analizar
                </button>
              </div>
            </div>

            {/* Preview Results */}
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  3. Vista Previa
                </h2>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {result.originalCount}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total detectadas
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {valid.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Válidas
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.errors.length + invalid.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Con errores
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {(result.errors.length > 0 || invalid.length > 0) && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowErrors(!showErrors)}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {result.errors.length + invalid.length} errores encontrados
                      {showErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showErrors && (
                      <ul className="mt-2 space-y-1 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        {result.errors.map((error, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            {error}
                          </li>
                        ))}
                        {invalid.map((item, idx) => (
                          <li key={`invalid-${idx}`} className="flex items-start gap-2">
                            <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            {item.reason}: &quot;{item.card.front.slice(0, 30)}...&quot;
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Preview Cards */}
                {valid.length > 0 && (
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {valid.slice(0, 10).map((card, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Frente
                            </div>
                            <div className="text-gray-900 dark:text-white">
                              {card.front}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Reverso
                            </div>
                            <div className="text-gray-900 dark:text-white">
                              {card.back}
                            </div>
                          </div>
                        </div>
                        {card.tags && card.tags.length > 0 && (
                          <div className="mt-2 flex gap-1">
                            {card.tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {valid.length > 10 && (
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        ...y {valid.length - 10} tarjetas más
                      </p>
                    )}
                  </div>
                )}

                {/* Import Button */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={resetImport}
                    className="px-6 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={valid.length === 0 || importing}
                    className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Importar {valid.length} Tarjetas
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
