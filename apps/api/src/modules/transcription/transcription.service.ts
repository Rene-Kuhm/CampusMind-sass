import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

@Injectable()
export class TranscriptionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async createTranscription(
    userId: string,
    dto: {
      title: string;
      subjectId?: string;
      sourceType: 'UPLOAD' | 'YOUTUBE' | 'RECORDING' | 'URL';
      sourceUrl?: string;
      fileName?: string;
      language?: string;
    },
  ) {
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    const transcription = await this.prisma.transcription.create({
      data: {
        userId,
        subjectId: dto.subjectId,
        title: dto.title,
        sourceType: dto.sourceType,
        sourceUrl: dto.sourceUrl,
        fileName: dto.fileName,
        language: dto.language || 'es',
        status: 'PROCESSING',
      },
    });

    // Process asynchronously
    this.processTranscriptionAsync(transcription.id);

    return transcription;
  }

  private async processTranscriptionAsync(transcriptionId: string) {
    try {
      const transcription = await this.prisma.transcription.findFirst({
        where: { id: transcriptionId },
      });

      if (!transcription) return;

      let content = '';
      let segments: any[] = [];
      let duration = 0;

      // Process based on source type
      if (transcription.sourceType === 'YOUTUBE' && transcription.sourceUrl) {
        const result = await this.transcribeYouTube(transcription.sourceUrl);
        content = result.content;
        segments = result.segments;
        duration = result.duration;
      } else if (transcription.sourceUrl) {
        const result = await this.transcribeAudio(
          transcription.sourceUrl,
          transcription.language,
        );
        content = result.content;
        segments = result.segments;
        duration = result.duration;
      }

      // Generate AI enhancements
      const enhanced = await this.enhanceTranscription(content, transcription.language);

      // Update transcription
      await this.prisma.transcription.update({
        where: { id: transcriptionId },
        data: {
          content,
          duration,
          summary: enhanced.summary,
          keyPoints: enhanced.keyPoints,
          topics: enhanced.topics,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // Create segments
      if (segments.length > 0) {
        await this.prisma.transcriptionSegment.createMany({
          data: segments.map((seg) => ({
            transcriptionId,
            startTime: seg.startTime,
            endTime: seg.endTime,
            text: seg.text,
            speaker: seg.speaker,
            confidence: seg.confidence,
          })),
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      await this.prisma.transcription.update({
        where: { id: transcriptionId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Transcription failed',
        },
      });
    }
  }

  private async transcribeYouTube(url: string): Promise<{
    content: string;
    segments: any[];
    duration: number;
  }> {
    // Extract video ID
    const videoId = this.extractYouTubeId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Try to get captions first
    try {
      const captionsUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=es&fmt=json3`;
      const response = await axios.get(captionsUrl);

      if (response.data?.events) {
        const events = response.data.events;
        const segments = events
          .filter((e: any) => e.segs)
          .map((e: any) => ({
            startTime: (e.tStartMs || 0) / 1000,
            endTime: ((e.tStartMs || 0) + (e.dDurationMs || 0)) / 1000,
            text: e.segs.map((s: any) => s.utf8).join(''),
          }));

        const content = segments.map((s: any) => s.text).join(' ');
        const duration = events[events.length - 1]?.tStartMs / 1000 || 0;

        return { content, segments, duration };
      }
    } catch (error) {
      console.log('No captions available, using Whisper API');
    }

    // Fallback: Download audio and use Whisper
    // Note: This requires youtube-dl or similar and Whisper API
    throw new Error('YouTube captions not available. Audio transcription requires additional setup.');
  }

  private async transcribeAudio(
    audioUrl: string,
    language: string,
  ): Promise<{ content: string; segments: any[]; duration: number }> {
    const openaiKey = this.config.get('OPENAI_API_KEY');

    if (openaiKey) {
      // Use OpenAI Whisper
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          file: audioUrl,
          model: 'whisper-1',
          language,
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
        },
        {
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const result = response.data;
      return {
        content: result.text,
        segments: (result.segments || []).map((s: any) => ({
          startTime: s.start,
          endTime: s.end,
          text: s.text,
          confidence: s.confidence,
        })),
        duration: result.duration || 0,
      };
    }

    throw new Error('No transcription API configured');
  }

  private async enhanceTranscription(
    content: string,
    language: string,
  ): Promise<{ summary: string; keyPoints: string[]; topics: string[] }> {
    if (!content || content.length < 100) {
      return { summary: '', keyPoints: [], topics: [] };
    }

    const apiKey = this.config.get('OPENAI_API_KEY') || this.config.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return { summary: '', keyPoints: [], topics: [] };
    }

    const prompt = `Analiza la siguiente transcripción de una clase/charla y proporciona:
1. Un resumen conciso (2-3 párrafos)
2. Los puntos clave (5-10 puntos)
3. Los temas principales tratados

Transcripción:
${content.substring(0, 8000)}

Responde en JSON:
{
  "summary": "resumen aquí",
  "keyPoints": ["punto 1", "punto 2"],
  "topics": ["tema 1", "tema 2"]
}`;

    try {
      if (this.config.get('OPENAI_API_KEY')) {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          },
          {
            headers: { Authorization: `Bearer ${this.config.get('OPENAI_API_KEY')}` },
          },
        );

        return JSON.parse(response.data.choices[0].message.content);
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        },
      );

      return JSON.parse(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('Enhancement error:', error);
      return { summary: '', keyPoints: [], topics: [] };
    }
  }

  private extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  async getTranscriptions(userId: string, subjectId?: string) {
    return this.prisma.transcription.findMany({
      where: {
        userId,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTranscription(userId: string, id: string) {
    const transcription = await this.prisma.transcription.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true } },
        segments: { orderBy: { startTime: 'asc' } },
      },
    });

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    return transcription;
  }

  async deleteTranscription(userId: string, id: string) {
    const transcription = await this.prisma.transcription.findFirst({
      where: { id, userId },
    });

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    await this.prisma.transcription.delete({ where: { id } });
    return { success: true };
  }
}
