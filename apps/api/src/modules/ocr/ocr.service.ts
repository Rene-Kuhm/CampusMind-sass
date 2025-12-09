import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

interface OcrResult {
  text: string;
  confidence: number;
  formulas?: string[];
}

@Injectable()
export class OcrService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async processImage(
    userId: string,
    dto: {
      title: string;
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      subjectId?: string;
      language?: string;
    },
  ) {
    // Validate subject if provided
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    // Create OCR document record
    const ocrDoc = await this.prisma.ocrDocument.create({
      data: {
        userId,
        subjectId: dto.subjectId,
        title: dto.title,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        language: dto.language || 'es',
        status: 'PROCESSING',
      },
    });

    // Process asynchronously
    this.processOcrAsync(ocrDoc.id, dto.fileUrl, dto.language || 'es');

    return ocrDoc;
  }

  private async processOcrAsync(docId: string, fileUrl: string, language: string) {
    try {
      // Use Google Cloud Vision API or Tesseract
      const result = await this.performOcr(fileUrl, language);

      // Enhance with AI (format and extract formulas)
      const enhanced = await this.enhanceWithAI(result.text);

      await this.prisma.ocrDocument.update({
        where: { id: docId },
        data: {
          extractedText: result.text,
          confidence: result.confidence,
          formattedText: enhanced.formattedText,
          summary: enhanced.summary,
          hasFormulas: enhanced.formulas.length > 0,
          formulas: enhanced.formulas,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.ocrDocument.update({
        where: { id: docId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'OCR processing failed',
        },
      });
    }
  }

  private async performOcr(fileUrl: string, language: string): Promise<OcrResult> {
    const googleApiKey = this.config.get('GOOGLE_CLOUD_API_KEY');

    if (googleApiKey) {
      // Use Google Cloud Vision
      return this.googleVisionOcr(fileUrl, googleApiKey, language);
    }

    // Fallback: Use free OCR.space API
    return this.ocrSpaceOcr(fileUrl, language);
  }

  private async googleVisionOcr(
    fileUrl: string,
    apiKey: string,
    language: string,
  ): Promise<OcrResult> {
    try {
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          requests: [
            {
              image: { source: { imageUri: fileUrl } },
              features: [
                { type: 'TEXT_DETECTION' },
                { type: 'DOCUMENT_TEXT_DETECTION' },
              ],
              imageContext: {
                languageHints: [language],
              },
            },
          ],
        },
      );

      const textAnnotation = response.data.responses[0]?.fullTextAnnotation;
      if (!textAnnotation) {
        return { text: '', confidence: 0 };
      }

      // Calculate average confidence
      const pages = textAnnotation.pages || [];
      let totalConfidence = 0;
      let blockCount = 0;

      pages.forEach((page: any) => {
        page.blocks?.forEach((block: any) => {
          if (block.confidence) {
            totalConfidence += block.confidence;
            blockCount++;
          }
        });
      });

      return {
        text: textAnnotation.text,
        confidence: blockCount > 0 ? totalConfidence / blockCount : 0.8,
      };
    } catch (error) {
      console.error('Google Vision OCR error:', error);
      throw new Error('Google Vision OCR failed');
    }
  }

  private async ocrSpaceOcr(fileUrl: string, language: string): Promise<OcrResult> {
    const apiKey = this.config.get('OCR_SPACE_API_KEY') || 'helloworld'; // Free tier key

    const langMap: Record<string, string> = {
      es: 'spa',
      en: 'eng',
      pt: 'por',
      fr: 'fre',
      de: 'ger',
    };

    try {
      const response = await axios.post(
        'https://api.ocr.space/parse/imageurl',
        null,
        {
          params: {
            apikey: apiKey,
            url: fileUrl,
            language: langMap[language] || 'spa',
            isOverlayRequired: false,
            OCREngine: 2,
          },
        },
      );

      const result = response.data;
      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
      }

      const parsedText = result.ParsedResults?.[0]?.ParsedText || '';
      return {
        text: parsedText,
        confidence: 0.85, // OCR.space doesn't provide confidence
      };
    } catch (error) {
      console.error('OCR.space error:', error);
      throw new Error('OCR processing failed');
    }
  }

  private async enhanceWithAI(text: string): Promise<{
    formattedText: string;
    summary: string;
    formulas: string[];
  }> {
    // Use the existing LLM service if available
    const llmApiKey = this.config.get('OPENAI_API_KEY') || this.config.get('GOOGLE_AI_API_KEY');

    if (!llmApiKey || !text.trim()) {
      return {
        formattedText: text,
        summary: '',
        formulas: [],
      };
    }

    try {
      const prompt = `Analiza el siguiente texto extraído por OCR y:
1. Corrige errores de OCR obvios
2. Formatea el texto de manera legible
3. Identifica y extrae fórmulas matemáticas en formato LaTeX
4. Genera un breve resumen (2-3 oraciones)

Texto OCR:
${text.substring(0, 4000)}

Responde en JSON con este formato:
{
  "formattedText": "texto corregido y formateado",
  "summary": "resumen breve",
  "formulas": ["formula1 en LaTeX", "formula2 en LaTeX"]
}`;

      // Use OpenAI or Gemini
      if (this.config.get('OPENAI_API_KEY')) {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${this.config.get('OPENAI_API_KEY')}`,
            },
          },
        );

        const content = response.data.choices[0]?.message?.content;
        return JSON.parse(content);
      }

      // Fallback to Gemini
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.get('GOOGLE_AI_API_KEY')}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        },
      );

      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      return JSON.parse(content);
    } catch (error) {
      console.error('AI enhancement error:', error);
      return {
        formattedText: text,
        summary: '',
        formulas: [],
      };
    }
  }

  async findAll(userId: string, subjectId?: string) {
    return this.prisma.ocrDocument.findMany({
      where: {
        userId,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const doc = await this.prisma.ocrDocument.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    if (!doc) {
      throw new NotFoundException('OCR document not found');
    }

    return doc;
  }

  async delete(userId: string, id: string) {
    const doc = await this.prisma.ocrDocument.findFirst({
      where: { id, userId },
    });

    if (!doc) {
      throw new NotFoundException('OCR document not found');
    }

    await this.prisma.ocrDocument.delete({ where: { id } });
    return { success: true };
  }

  async reprocess(userId: string, id: string) {
    const doc = await this.prisma.ocrDocument.findFirst({
      where: { id, userId },
    });

    if (!doc) {
      throw new NotFoundException('OCR document not found');
    }

    await this.prisma.ocrDocument.update({
      where: { id },
      data: { status: 'PROCESSING', error: null },
    });

    this.processOcrAsync(id, doc.fileUrl, doc.language);

    return { success: true, message: 'Reprocessing started' };
  }
}
