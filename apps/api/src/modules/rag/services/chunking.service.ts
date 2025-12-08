import { Injectable } from "@nestjs/common";
import { TextChunk, ChunkMetadata } from "../interfaces/rag.interface";

interface ChunkingOptions {
  chunkSize?: number; // Target size in characters
  chunkOverlap?: number; // Overlap between chunks
  separator?: string;
}

@Injectable()
export class ChunkingService {
  private readonly defaultOptions: ChunkingOptions = {
    chunkSize: 1000,
    chunkOverlap: 200,
    separator: "\n\n",
  };

  /**
   * Divide un texto largo en chunks manejables para embeddings
   */
  chunkText(
    text: string,
    metadata: Omit<ChunkMetadata, "chunkIndex">,
    options?: ChunkingOptions,
  ): TextChunk[] {
    const opts = { ...this.defaultOptions, ...options };
    const chunks: TextChunk[] = [];

    // Limpiar el texto
    const cleanedText = this.cleanText(text);

    // Si el texto está vacío después de limpiar, no crear chunks
    if (!cleanedText) {
      return [];
    }

    if (cleanedText.length <= opts.chunkSize!) {
      // Texto pequeño, un solo chunk
      return [
        {
          content: cleanedText,
          metadata: { ...metadata, chunkIndex: 0 },
        },
      ];
    }

    // Dividir por separador principal (párrafos)
    const paragraphs = cleanedText.split(opts.separator!);

    let currentChunk = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      // Si el párrafo solo cabe en el chunk actual
      if (
        currentChunk.length + trimmedParagraph.length + 1 <=
        opts.chunkSize!
      ) {
        currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
      } else {
        // Guardar chunk actual si tiene contenido
        if (currentChunk) {
          chunks.push({
            content: currentChunk,
            metadata: { ...metadata, chunkIndex: chunkIndex++ },
          });

          // Mantener overlap del final del chunk anterior
          const words = currentChunk.split(" ");
          const overlapWords = Math.ceil(
            (opts.chunkOverlap! / opts.chunkSize!) * words.length,
          );
          currentChunk = words.slice(-overlapWords).join(" ");
        }

        // Si el párrafo es muy largo, dividirlo por oraciones
        if (trimmedParagraph.length > opts.chunkSize!) {
          const subChunks = this.chunkLongParagraph(
            trimmedParagraph,
            opts.chunkSize!,
            opts.chunkOverlap!,
          );

          for (const subChunk of subChunks) {
            chunks.push({
              content: subChunk,
              metadata: { ...metadata, chunkIndex: chunkIndex++ },
            });
          }
          currentChunk = "";
        } else {
          currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
        }
      }
    }

    // No olvidar el último chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk,
        metadata: { ...metadata, chunkIndex: chunkIndex },
      });
    }

    return chunks;
  }

  /**
   * Divide un párrafo largo en chunks más pequeños
   */
  private chunkLongParagraph(
    paragraph: string,
    chunkSize: number,
    overlap: number,
  ): string[] {
    const chunks: string[] = [];

    // Intentar dividir por oraciones
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];

    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();

      if (currentChunk.length + trimmedSentence.length <= chunkSize) {
        currentChunk += (currentChunk ? " " : "") + trimmedSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // Si la oración sola es muy larga, dividir por palabras
        if (trimmedSentence.length > chunkSize) {
          const wordChunks = this.chunkByWords(
            trimmedSentence,
            chunkSize,
            overlap,
          );
          chunks.push(...wordChunks);
          currentChunk = "";
        } else {
          currentChunk = trimmedSentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Último recurso: dividir por palabras
   */
  private chunkByWords(
    text: string,
    chunkSize: number,
    overlap: number,
  ): string[] {
    const words = text.split(" ");
    const chunks: string[] = [];
    let i = 0;

    while (i < words.length) {
      let chunk = "";
      const startIndex = i;

      while (
        i < words.length &&
        chunk.length + words[i].length + 1 <= chunkSize
      ) {
        chunk += (chunk ? " " : "") + words[i];
        i++;
      }

      if (chunk) {
        chunks.push(chunk);
      }

      // Retroceder para overlap (solo si no es el último chunk)
      if (i < words.length) {
        const overlapWords = Math.floor(
          (overlap / chunkSize) * (i - startIndex),
        );
        i = Math.max(startIndex + 1, i - overlapWords);
      }
    }

    return chunks;
  }

  /**
   * Limpia el texto de caracteres innecesarios
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, "\n") // Normalizar saltos de línea
      .replace(/\n{3,}/g, "\n\n") // Máximo 2 saltos seguidos
      .replace(/[ \t]+/g, " ") // Múltiples espacios a uno
      .replace(/^\s+|\s+$/gm, "") // Trim cada línea
      .trim();
  }

  /**
   * Estima el número de tokens (aproximación simple)
   */
  estimateTokens(text: string): number {
    // Aproximación: ~4 caracteres por token en inglés/español
    return Math.ceil(text.length / 4);
  }
}
