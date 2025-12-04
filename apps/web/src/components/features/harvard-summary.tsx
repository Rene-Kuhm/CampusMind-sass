'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  Spinner,
} from '@/components/ui';
import { rag, HarvardSummary } from '@/lib/api';
import {
  FileText,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  CheckSquare,
  Quote,
  Copy,
  Check,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HarvardSummaryViewProps {
  resourceId: string;
  resourceTitle: string;
  token: string;
  isIndexed: boolean;
}

export function HarvardSummaryView({
  resourceId,
  resourceTitle,
  token,
  isIndexed,
}: HarvardSummaryViewProps) {
  const [summary, setSummary] = useState<HarvardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depth, setDepth] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['context', 'keyIdeas', 'definitions'])
  );
  const [copied, setCopied] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!isIndexed) {
      setError('El recurso debe estar indexado para generar el resumen');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await rag.generateSummary(token, resourceId, depth);
      setSummary(result);
    } catch (err) {
      setError('Error al generar el resumen. Intenta de nuevo.');
      console.error('Error generating summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;

    const text = formatSummaryAsText(summary, resourceTitle);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summary) return;

    const text = formatSummaryAsText(summary, resourceTitle);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-${resourceTitle.slice(0, 30).replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const depthOptions = [
    { value: 'basic', label: 'Básico' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' },
  ];

  if (!summary) {
    return (
      <Card>
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Resumen Harvard-Style
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-secondary-600 mb-4">
            Genera un resumen académico estructurado con contexto teórico, ideas clave,
            definiciones, ejemplos y checklist de repaso.
          </p>

          {!isIndexed && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              El recurso debe estar indexado antes de generar el resumen.
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-end gap-4">
            <Select
              label="Nivel de profundidad"
              options={depthOptions}
              value={depth}
              onChange={(e) => setDepth(e.target.value as typeof depth)}
              className="w-48"
            />
            <Button
              onClick={handleGenerate}
              isLoading={isLoading}
              disabled={!isIndexed}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Generar resumen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Resumen Harvard-Style
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Descargar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSummary(null)}
            >
              Regenerar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-4">
        {/* Contexto Teórico */}
        <SummarySection
          title="Contexto Teórico"
          icon={<BookOpen className="h-4 w-4" />}
          isExpanded={expandedSections.has('context')}
          onToggle={() => toggleSection('context')}
        >
          <p className="text-secondary-700 whitespace-pre-wrap">
            {summary.theoreticalContext}
          </p>
        </SummarySection>

        {/* Ideas Clave */}
        {summary.keyIdeas.length > 0 && (
          <SummarySection
            title="Ideas Clave"
            icon={<Lightbulb className="h-4 w-4" />}
            badge={summary.keyIdeas.length}
            isExpanded={expandedSections.has('keyIdeas')}
            onToggle={() => toggleSection('keyIdeas')}
          >
            <ul className="space-y-2">
              {summary.keyIdeas.map((idea, i) => (
                <li key={i} className="flex items-start gap-2 text-secondary-700">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {idea}
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {/* Definiciones */}
        {summary.definitions.length > 0 && (
          <SummarySection
            title="Definiciones Importantes"
            icon={<FileText className="h-4 w-4" />}
            badge={summary.definitions.length}
            isExpanded={expandedSections.has('definitions')}
            onToggle={() => toggleSection('definitions')}
          >
            <dl className="space-y-3">
              {summary.definitions.map((def, i) => (
                <div key={i} className="border-l-2 border-primary-200 pl-3">
                  <dt className="font-medium text-secondary-900">{def.term}</dt>
                  <dd className="text-secondary-600 text-sm mt-1">{def.definition}</dd>
                </div>
              ))}
            </dl>
          </SummarySection>
        )}

        {/* Ejemplos */}
        {summary.examples.length > 0 && (
          <SummarySection
            title="Ejemplos Aplicados"
            icon={<Lightbulb className="h-4 w-4" />}
            badge={summary.examples.length}
            isExpanded={expandedSections.has('examples')}
            onToggle={() => toggleSection('examples')}
          >
            <ul className="space-y-2">
              {summary.examples.map((example, i) => (
                <li key={i} className="flex items-start gap-2 text-secondary-700">
                  <span className="text-green-500 mt-1">→</span>
                  {example}
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {/* Errores Comunes */}
        {summary.commonMistakes.length > 0 && (
          <SummarySection
            title="Errores Típicos en Exámenes"
            icon={<AlertTriangle className="h-4 w-4" />}
            badge={summary.commonMistakes.length}
            variant="warning"
            isExpanded={expandedSections.has('mistakes')}
            onToggle={() => toggleSection('mistakes')}
          >
            <ul className="space-y-2">
              {summary.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex items-start gap-2 text-secondary-700">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  {mistake}
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {/* Checklist de Repaso */}
        {summary.reviewChecklist.length > 0 && (
          <SummarySection
            title="Checklist de Repaso"
            icon={<CheckSquare className="h-4 w-4" />}
            badge={summary.reviewChecklist.length}
            variant="success"
            isExpanded={expandedSections.has('checklist')}
            onToggle={() => toggleSection('checklist')}
          >
            <ul className="space-y-2">
              {summary.reviewChecklist.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-secondary-700">
                  <input
                    type="checkbox"
                    className="rounded border-secondary-300 text-green-600 focus:ring-green-500"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </SummarySection>
        )}

        {/* Referencias */}
        {summary.references.length > 0 && (
          <SummarySection
            title="Referencias"
            icon={<Quote className="h-4 w-4" />}
            badge={summary.references.length}
            isExpanded={expandedSections.has('references')}
            onToggle={() => toggleSection('references')}
          >
            <ul className="space-y-1 text-sm text-secondary-600">
              {summary.references.map((ref, i) => (
                <li key={i}>[{i + 1}] {ref}</li>
              ))}
            </ul>
          </SummarySection>
        )}
      </CardContent>
    </Card>
  );
}

interface SummarySectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: number;
  variant?: 'default' | 'warning' | 'success';
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SummarySection({
  title,
  icon,
  badge,
  variant = 'default',
  isExpanded,
  onToggle,
  children,
}: SummarySectionProps) {
  const variantStyles = {
    default: 'border-secondary-200',
    warning: 'border-yellow-200 bg-yellow-50/50',
    success: 'border-green-200 bg-green-50/50',
  };

  return (
    <div className={cn('border rounded-lg overflow-hidden', variantStyles[variant])}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-secondary-500">{icon}</span>
          <span className="font-medium text-secondary-900">{title}</span>
          {badge !== undefined && (
            <Badge variant="default" size="sm">
              {badge}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-secondary-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-secondary-400" />
        )}
      </button>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function formatSummaryAsText(summary: HarvardSummary, title: string): string {
  let text = `RESUMEN HARVARD-STYLE\n`;
  text += `${'='.repeat(50)}\n`;
  text += `Recurso: ${title}\n`;
  text += `Fecha: ${new Date().toLocaleDateString('es-AR')}\n`;
  text += `${'='.repeat(50)}\n\n`;

  text += `CONTEXTO TEÓRICO\n${'-'.repeat(30)}\n`;
  text += `${summary.theoreticalContext}\n\n`;

  if (summary.keyIdeas.length > 0) {
    text += `IDEAS CLAVE\n${'-'.repeat(30)}\n`;
    summary.keyIdeas.forEach((idea, i) => {
      text += `${i + 1}. ${idea}\n`;
    });
    text += '\n';
  }

  if (summary.definitions.length > 0) {
    text += `DEFINICIONES IMPORTANTES\n${'-'.repeat(30)}\n`;
    summary.definitions.forEach((def) => {
      text += `• ${def.term}: ${def.definition}\n`;
    });
    text += '\n';
  }

  if (summary.examples.length > 0) {
    text += `EJEMPLOS APLICADOS\n${'-'.repeat(30)}\n`;
    summary.examples.forEach((ex, i) => {
      text += `${i + 1}. ${ex}\n`;
    });
    text += '\n';
  }

  if (summary.commonMistakes.length > 0) {
    text += `ERRORES TÍPICOS EN EXÁMENES\n${'-'.repeat(30)}\n`;
    summary.commonMistakes.forEach((m) => {
      text += `⚠ ${m}\n`;
    });
    text += '\n';
  }

  if (summary.reviewChecklist.length > 0) {
    text += `CHECKLIST DE REPASO\n${'-'.repeat(30)}\n`;
    summary.reviewChecklist.forEach((item) => {
      text += `☐ ${item}\n`;
    });
    text += '\n';
  }

  if (summary.references.length > 0) {
    text += `REFERENCIAS\n${'-'.repeat(30)}\n`;
    summary.references.forEach((ref, i) => {
      text += `[${i + 1}] ${ref}\n`;
    });
  }

  return text;
}
