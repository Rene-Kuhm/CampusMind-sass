'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { tools, FormulaSheet, Formula, CodeSnippet, subjects as subjectsApi, Subject } from '@/lib/api';
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
  Calculator,
  Code,
  Plus,
  Trash2,
  Copy,
  Play,
  Eye,
  Loader2,
  FileText,
  Hash,
  Braces,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'formulas' | 'code';

export default function ToolsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('formulas');
  const [formulaSheets, setFormulaSheets] = useState<FormulaSheet[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<FormulaSheet | null>(null);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Forms
  const [sheetForm, setSheetForm] = useState({ title: '', description: '', category: '', subjectId: '' });
  const [formulaForm, setFormulaForm] = useState({ name: '', latex: '', description: '', example: '' });
  const [snippetForm, setSnippetForm] = useState({ title: '', code: '', language: 'javascript', description: '', subjectId: '' });

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [sheets, snippets] = await Promise.all([
        tools.getFormulaSheets(token),
        tools.getCodeSnippets(token),
      ]);
      setFormulaSheets(sheets);
      setCodeSnippets(snippets);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(data => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
      loadData();
    }
  }, [token, loadData]);

  // Create formula sheet
  const handleCreateSheet = async () => {
    if (!token || !sheetForm.title) return;
    try {
      const sheet = await tools.createFormulaSheet(token, {
        title: sheetForm.title,
        description: sheetForm.description || undefined,
        category: sheetForm.category || undefined,
        subjectId: sheetForm.subjectId || undefined,
      });
      setFormulaSheets(prev => [sheet, ...prev]);
      setIsSheetModalOpen(false);
      setSheetForm({ title: '', description: '', category: '', subjectId: '' });
    } catch (error) {
      console.error('Error creating sheet:', error);
    }
  };

  // Add formula to sheet
  const handleAddFormula = async () => {
    if (!token || !selectedSheet || !formulaForm.name || !formulaForm.latex) return;
    try {
      await tools.addFormula(token, selectedSheet.id, {
        name: formulaForm.name,
        latex: formulaForm.latex,
        description: formulaForm.description || undefined,
        example: formulaForm.example || undefined,
        tags: [],
      });
      const updated = await tools.getFormulaSheet(token, selectedSheet.id);
      setSelectedSheet(updated);
      setFormulaSheets(prev => prev.map(s => s.id === updated.id ? updated : s));
      setIsFormulaModalOpen(false);
      setFormulaForm({ name: '', latex: '', description: '', example: '' });
    } catch (error) {
      console.error('Error adding formula:', error);
    }
  };

  // Create code snippet
  const handleCreateSnippet = async () => {
    if (!token || !snippetForm.title || !snippetForm.code) return;
    try {
      const snippet = await tools.createCodeSnippet(token, {
        title: snippetForm.title,
        code: snippetForm.code,
        language: snippetForm.language,
        description: snippetForm.description || undefined,
        subjectId: snippetForm.subjectId || undefined,
      });
      setCodeSnippets(prev => [snippet, ...prev]);
      setIsSnippetModalOpen(false);
      setSnippetForm({ title: '', code: '', language: 'javascript', description: '', subjectId: '' });
    } catch (error) {
      console.error('Error creating snippet:', error);
    }
  };

  // Delete
  const handleDeleteSheet = async (id: string) => {
    if (!token) return;
    try {
      await tools.deleteFormulaSheet(token, id);
      setFormulaSheets(prev => prev.filter(s => s.id !== id));
      if (selectedSheet?.id === id) setSelectedSheet(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleDeleteSnippet = async (id: string) => {
    if (!token) return;
    try {
      await tools.deleteCodeSnippet(token, id);
      setCodeSnippets(prev => prev.filter(s => s.id !== id));
      if (selectedSnippet?.id === id) setSelectedSnippet(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
  ];

  // Detail views
  if (selectedSheet) {
    return (
      <div className="min-h-screen">
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button onClick={() => setSelectedSheet(null)} className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4">
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Calculator className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedSheet.title}</h1>
                  {selectedSheet.description && <p className="text-secondary-500">{selectedSheet.description}</p>}
                </div>
              </div>
              <Button variant="gradient" onClick={() => setIsFormulaModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Fórmula
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {selectedSheet.formulas && selectedSheet.formulas.length > 0 ? (
              <div className="space-y-4">
                {selectedSheet.formulas.map(formula => (
                  <Card key={formula.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary-900">{formula.name}</h3>
                          <div className="mt-2 p-4 bg-secondary-50 rounded-lg font-mono text-lg text-center">
                            {formula.latex}
                          </div>
                          {formula.description && (
                            <p className="text-sm text-secondary-500 mt-2">{formula.description}</p>
                          )}
                          {formula.example && (
                            <p className="text-sm text-secondary-600 mt-1">
                              <strong>Ejemplo:</strong> {formula.example}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(formula.latex)}>
                          {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Hash className="h-8 w-8" />}
                title="Sin fórmulas"
                description="Agrega tu primera fórmula a esta hoja"
                action={
                  <Button variant="gradient" onClick={() => setIsFormulaModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Fórmula
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Add Formula Modal */}
        <Modal isOpen={isFormulaModalOpen} onClose={() => setIsFormulaModalOpen(false)} title="Nueva Fórmula" size="md">
          <div className="space-y-4">
            <Input placeholder="Nombre (ej: Teorema de Pitágoras)" value={formulaForm.name} onChange={(e) => setFormulaForm(prev => ({ ...prev, name: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Fórmula (LaTeX)</label>
              <Input placeholder="a^2 + b^2 = c^2" value={formulaForm.latex} onChange={(e) => setFormulaForm(prev => ({ ...prev, latex: e.target.value }))} />
            </div>
            <Input placeholder="Descripción" value={formulaForm.description} onChange={(e) => setFormulaForm(prev => ({ ...prev, description: e.target.value }))} />
            <Input placeholder="Ejemplo de uso" value={formulaForm.example} onChange={(e) => setFormulaForm(prev => ({ ...prev, example: e.target.value }))} />
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsFormulaModalOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleAddFormula} disabled={!formulaForm.name || !formulaForm.latex}>
                <Plus className="h-4 w-4 mr-2" />Agregar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (selectedSnippet) {
    return (
      <div className="min-h-screen">
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button onClick={() => setSelectedSnippet(null)} className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4">
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Code className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedSnippet.title}</h1>
                  <Badge variant="secondary">{selectedSnippet.language}</Badge>
                </div>
              </div>
              <Button variant="ghost" onClick={() => handleCopy(selectedSnippet.code)}>
                {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{copied ? 'Copiado!' : 'Copiar'}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {selectedSnippet.description && (
              <p className="text-secondary-600 mb-4">{selectedSnippet.description}</p>
            )}
            <Card>
              <CardContent className="p-0">
                <pre className="p-4 bg-secondary-900 text-secondary-100 rounded-xl overflow-x-auto font-mono text-sm">
                  <code>{selectedSnippet.code}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Braces className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-emerald-500">
                  Herramientas
                </span>
              </h1>
              <p className="text-secondary-500 mt-0.5">Fórmulas y snippets de código</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('formulas')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === 'formulas' ? "bg-white shadow-sm text-amber-600" : "text-secondary-600 hover:bg-white/50"
              )}
            >
              <Calculator className="h-4 w-4" />
              Fórmulas
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === 'code' ? "bg-white shadow-sm text-emerald-600" : "text-secondary-600 hover:bg-white/50"
              )}
            >
              <Code className="h-4 w-4" />
              Código
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : activeTab === 'formulas' ? (
            <>
              <div className="flex justify-end mb-4">
                <Button variant="gradient" onClick={() => setIsSheetModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Hoja
                </Button>
              </div>
              {formulaSheets.length === 0 ? (
                <EmptyState
                  icon={<Calculator className="h-8 w-8" />}
                  title="Sin hojas de fórmulas"
                  description="Crea tu primera hoja de fórmulas"
                  action={
                    <Button variant="gradient" onClick={() => setIsSheetModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />Nueva Hoja
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formulaSheets.map(sheet => (
                    <Card key={sheet.id} className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden" onClick={() => setSelectedSheet(sheet)}>
                      <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Calculator className="h-6 w-6 text-white" />
                          </div>
                          {sheet.category && <Badge variant="secondary">{sheet.category}</Badge>}
                        </div>
                        <h3 className="font-semibold text-secondary-900 mb-1">{sheet.title}</h3>
                        {sheet.description && <p className="text-sm text-secondary-500 line-clamp-2">{sheet.description}</p>}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-secondary-100">
                          <span className="text-sm text-secondary-500">{sheet.formulas?.length || 0} fórmulas</span>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteSheet(sheet.id); }}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button variant="gradient" onClick={() => setIsSnippetModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Snippet
                </Button>
              </div>
              {codeSnippets.length === 0 ? (
                <EmptyState
                  icon={<Code className="h-8 w-8" />}
                  title="Sin snippets"
                  description="Guarda tu primer snippet de código"
                  action={
                    <Button variant="gradient" onClick={() => setIsSnippetModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />Nuevo Snippet
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {codeSnippets.map(snippet => (
                    <Card key={snippet.id} className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden" onClick={() => setSelectedSnippet(snippet)}>
                      <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <Code className="h-6 w-6 text-white" />
                          </div>
                          <Badge variant="secondary">{snippet.language}</Badge>
                        </div>
                        <h3 className="font-semibold text-secondary-900 mb-1">{snippet.title}</h3>
                        {snippet.description && <p className="text-sm text-secondary-500 line-clamp-2">{snippet.description}</p>}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-secondary-100">
                          <span className="text-xs text-secondary-400">{new Date(snippet.createdAt).toLocaleDateString()}</span>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id); }}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Sheet Modal */}
      <Modal isOpen={isSheetModalOpen} onClose={() => setIsSheetModalOpen(false)} title="Nueva Hoja de Fórmulas" size="md">
        <div className="space-y-4">
          <Input placeholder="Título *" value={sheetForm.title} onChange={(e) => setSheetForm(prev => ({ ...prev, title: e.target.value }))} />
          <Input placeholder="Descripción" value={sheetForm.description} onChange={(e) => setSheetForm(prev => ({ ...prev, description: e.target.value }))} />
          <Input placeholder="Categoría (ej: Física, Matemáticas)" value={sheetForm.category} onChange={(e) => setSheetForm(prev => ({ ...prev, category: e.target.value }))} />
          <Select value={sheetForm.subjectId} onChange={(e) => setSheetForm(prev => ({ ...prev, subjectId: e.target.value }))} options={[{ value: '', label: 'Sin materia' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSheetModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleCreateSheet} disabled={!sheetForm.title}><Plus className="h-4 w-4 mr-2" />Crear</Button>
          </div>
        </div>
      </Modal>

      {/* Create Snippet Modal */}
      <Modal isOpen={isSnippetModalOpen} onClose={() => setIsSnippetModalOpen(false)} title="Nuevo Snippet" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Título *" value={snippetForm.title} onChange={(e) => setSnippetForm(prev => ({ ...prev, title: e.target.value }))} />
            <Select value={snippetForm.language} onChange={(e) => setSnippetForm(prev => ({ ...prev, language: e.target.value }))} options={languages} />
          </div>
          <Input placeholder="Descripción" value={snippetForm.description} onChange={(e) => setSnippetForm(prev => ({ ...prev, description: e.target.value }))} />
          <textarea
            className="w-full h-48 p-3 border border-secondary-200 rounded-lg font-mono text-sm resize-none"
            placeholder="// Tu código aquí..."
            value={snippetForm.code}
            onChange={(e) => setSnippetForm(prev => ({ ...prev, code: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSnippetModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleCreateSnippet} disabled={!snippetForm.title || !snippetForm.code}><Plus className="h-4 w-4 mr-2" />Crear</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
