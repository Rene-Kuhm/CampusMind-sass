// Flashcard Import System - Anki, Quizlet, CSV support

export interface ImportedFlashcard {
  front: string;
  back: string;
  tags?: string[];
}

export interface ImportResult {
  success: boolean;
  flashcards: ImportedFlashcard[];
  errors: string[];
  source: 'anki' | 'quizlet' | 'csv' | 'text';
  originalCount: number;
}

// Parse Anki .txt export (tab-separated)
export function parseAnkiExport(content: string): ImportResult {
  const lines = content.trim().split('\n');
  const flashcards: ImportedFlashcard[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    // Skip empty lines and comments
    if (!line.trim() || line.startsWith('#')) return;

    // Anki uses tab separation: front<tab>back<tab>tags (optional)
    const parts = line.split('\t');

    if (parts.length >= 2) {
      const front = parts[0].trim();
      const back = parts[1].trim();
      const tags = parts[2] ? parts[2].split(' ').filter(t => t) : [];

      if (front && back) {
        flashcards.push({ front, back, tags });
      } else {
        errors.push(`Línea ${index + 1}: Frente o reverso vacío`);
      }
    } else {
      errors.push(`Línea ${index + 1}: Formato inválido (se esperaba: frente<tab>reverso)`);
    }
  });

  return {
    success: flashcards.length > 0,
    flashcards,
    errors,
    source: 'anki',
    originalCount: lines.filter(l => l.trim() && !l.startsWith('#')).length,
  };
}

// Parse Anki .apkg file (ZIP containing SQLite)
export async function parseAnkiPackage(file: File): Promise<ImportResult> {
  // Note: Full .apkg parsing requires JSZip and sql.js libraries
  // This is a simplified version that handles exported text
  const errors: string[] = ['El formato .apkg requiere exportar desde Anki como texto primero'];

  return {
    success: false,
    flashcards: [],
    errors,
    source: 'anki',
    originalCount: 0,
  };
}

// Parse Quizlet export (various formats)
export function parseQuizletExport(content: string, separator: 'tab' | 'comma' | 'custom' = 'tab', customSeparator?: string): ImportResult {
  const lines = content.trim().split('\n');
  const flashcards: ImportedFlashcard[] = [];
  const errors: string[] = [];

  const sep = separator === 'custom' && customSeparator ? customSeparator : (separator === 'tab' ? '\t' : ',');

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    // Quizlet format: term<sep>definition
    const parts = line.split(sep);

    if (parts.length >= 2) {
      const front = parts[0].trim().replace(/^["']|["']$/g, '');
      const back = parts.slice(1).join(sep).trim().replace(/^["']|["']$/g, '');

      if (front && back) {
        flashcards.push({ front, back });
      } else {
        errors.push(`Línea ${index + 1}: Término o definición vacía`);
      }
    } else {
      errors.push(`Línea ${index + 1}: Formato inválido`);
    }
  });

  return {
    success: flashcards.length > 0,
    flashcards,
    errors,
    source: 'quizlet',
    originalCount: lines.filter(l => l.trim()).length,
  };
}

// Parse CSV file
export function parseCSV(content: string, hasHeader: boolean = true): ImportResult {
  const lines = content.trim().split('\n');
  const flashcards: ImportedFlashcard[] = [];
  const errors: string[] = [];

  const startIndex = hasHeader ? 1 : 0;

  lines.slice(startIndex).forEach((line, index) => {
    if (!line.trim()) return;

    // Handle CSV with possible quoted values
    const parts = parseCSVLine(line);

    if (parts.length >= 2) {
      const front = parts[0].trim();
      const back = parts[1].trim();
      const tags = parts[2] ? parts[2].split(',').map(t => t.trim()).filter(t => t) : [];

      if (front && back) {
        flashcards.push({ front, back, tags });
      } else {
        errors.push(`Línea ${index + startIndex + 1}: Frente o reverso vacío`);
      }
    } else {
      errors.push(`Línea ${index + startIndex + 1}: Se necesitan al menos 2 columnas`);
    }
  });

  return {
    success: flashcards.length > 0,
    flashcards,
    errors,
    source: 'csv',
    originalCount: lines.length - startIndex,
  };
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Parse plain text with custom delimiter
export function parseTextWithDelimiter(
  content: string,
  cardDelimiter: string = '\n\n',
  sideDelimiter: string = '\n'
): ImportResult {
  const cards = content.split(cardDelimiter);
  const flashcards: ImportedFlashcard[] = [];
  const errors: string[] = [];

  cards.forEach((card, index) => {
    const trimmed = card.trim();
    if (!trimmed) return;

    const parts = trimmed.split(sideDelimiter);

    if (parts.length >= 2) {
      const front = parts[0].trim();
      const back = parts.slice(1).join(sideDelimiter).trim();

      if (front && back) {
        flashcards.push({ front, back });
      } else {
        errors.push(`Tarjeta ${index + 1}: Frente o reverso vacío`);
      }
    } else {
      errors.push(`Tarjeta ${index + 1}: No se encontró el delimitador de lados`);
    }
  });

  return {
    success: flashcards.length > 0,
    flashcards,
    errors,
    source: 'text',
    originalCount: cards.filter(c => c.trim()).length,
  };
}

// Auto-detect format and parse
export function autoDetectAndParse(content: string, filename?: string): ImportResult {
  // Check file extension if provided
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();

    if (ext === 'csv') {
      return parseCSV(content);
    }
  }

  // Try to auto-detect format
  const lines = content.trim().split('\n').slice(0, 5);

  // Check for tab-separated (Anki/Quizlet)
  const hasTabSeparation = lines.some(line => line.includes('\t'));
  if (hasTabSeparation) {
    // Could be Anki or Quizlet, try Anki first
    const ankiResult = parseAnkiExport(content);
    if (ankiResult.success && ankiResult.errors.length === 0) {
      return ankiResult;
    }
    return parseQuizletExport(content, 'tab');
  }

  // Check for comma-separated
  const hasCommaSeparation = lines.some(line => line.includes(','));
  if (hasCommaSeparation) {
    return parseCSV(content, lines[0].toLowerCase().includes('front') || lines[0].toLowerCase().includes('term'));
  }

  // Try double newline separation (card separator)
  if (content.includes('\n\n')) {
    return parseTextWithDelimiter(content);
  }

  // Default: try simple line-by-line with some delimiter
  return parseQuizletExport(content, 'tab');
}

// Export flashcards to various formats
export function exportToAnki(flashcards: ImportedFlashcard[]): string {
  return flashcards
    .map(card => {
      const tags = card.tags?.join(' ') || '';
      return `${card.front}\t${card.back}${tags ? '\t' + tags : ''}`;
    })
    .join('\n');
}

export function exportToCSV(flashcards: ImportedFlashcard[]): string {
  const escapeCSV = (str: string) => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = 'front,back,tags';
  const rows = flashcards.map(card => {
    const tags = card.tags?.join(';') || '';
    return `${escapeCSV(card.front)},${escapeCSV(card.back)},${escapeCSV(tags)}`;
  });

  return [header, ...rows].join('\n');
}

export function exportToQuizlet(flashcards: ImportedFlashcard[]): string {
  return flashcards
    .map(card => `${card.front}\t${card.back}`)
    .join('\n');
}

// Sample templates for users
export const IMPORT_TEMPLATES = {
  anki: `# Ejemplo de formato Anki (tab-separado)
# frente<tab>reverso<tab>tags (opcional)
¿Cuál es la capital de Francia?	París	geografía europa
¿Cuántos planetas hay en el sistema solar?	8 planetas	ciencia astronomía
Mitocondria	Orgánulo celular que genera energía (ATP)	biología célula`,

  quizlet: `# Ejemplo de formato Quizlet
# término<tab>definición
Célula	Unidad básica de la vida
ADN	Ácido desoxirribonucleico - material genético
Fotosíntesis	Proceso por el cual las plantas convierten luz en energía`,

  csv: `front,back,tags
"¿Qué es H2O?","Agua - Molécula formada por 2 átomos de hidrógeno y 1 de oxígeno","química"
"Teorema de Pitágoras","a² + b² = c² - Relación entre los lados de un triángulo rectángulo","matemáticas geometría"
"Primera ley de Newton","Un objeto en reposo permanece en reposo a menos que actúe una fuerza externa","física mecánica"`,

  text: `# Ejemplo de formato texto (separador automático)
# Usa tab, | o :: como separador entre frente y reverso
¿Cuál es la fórmula del agua?	H2O
Velocidad de la luz	299,792,458 m/s
ADN :: Ácido desoxirribonucleico`,
};

// Validation helpers
export function validateImportedFlashcards(flashcards: ImportedFlashcard[]): {
  valid: ImportedFlashcard[];
  invalid: { card: ImportedFlashcard; reason: string }[];
} {
  const valid: ImportedFlashcard[] = [];
  const invalid: { card: ImportedFlashcard; reason: string }[] = [];

  flashcards.forEach(card => {
    if (!card.front || card.front.trim().length === 0) {
      invalid.push({ card, reason: 'Frente vacío' });
    } else if (!card.back || card.back.trim().length === 0) {
      invalid.push({ card, reason: 'Reverso vacío' });
    } else if (card.front.length > 1000) {
      invalid.push({ card, reason: 'Frente demasiado largo (máx 1000 caracteres)' });
    } else if (card.back.length > 5000) {
      invalid.push({ card, reason: 'Reverso demasiado largo (máx 5000 caracteres)' });
    } else {
      valid.push(card);
    }
  });

  return { valid, invalid };
}
