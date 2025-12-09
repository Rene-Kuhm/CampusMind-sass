import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

@Injectable()
export class VideoSummaryService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async createSummary(
    userId: string,
    dto: {
      title: string;
      videoUrl: string;
      subjectId?: string;
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

    const videoId = this.extractYouTubeId(dto.videoUrl);
    const platform = videoId ? 'YOUTUBE' : 'OTHER';

    const summary = await this.prisma.videoSummary.create({
      data: {
        userId,
        subjectId: dto.subjectId,
        title: dto.title,
        videoUrl: dto.videoUrl,
        videoId,
        platform,
        language: dto.language || 'es',
        status: 'PROCESSING',
      },
    });

    // Process asynchronously
    this.processVideoAsync(summary.id);

    return summary;
  }

  private async processVideoAsync(summaryId: string) {
    try {
      const summary = await this.prisma.videoSummary.findFirst({
        where: { id: summaryId },
      });

      if (!summary) return;

      // Get video info and transcript
      let transcript = '';
      let duration = 0;
      let timestamps: any[] = [];

      if (summary.platform === 'YOUTUBE' && summary.videoId) {
        const result = await this.getYouTubeContent(summary.videoId);
        transcript = result.transcript;
        duration = result.duration;
        timestamps = result.timestamps;
      }

      if (!transcript) {
        throw new Error('Could not extract video content');
      }

      // Generate summary with AI
      const generated = await this.generateSummary(
        transcript,
        summary.language,
        timestamps,
      );

      await this.prisma.videoSummary.update({
        where: { id: summaryId },
        data: {
          transcript,
          duration,
          summary: generated.summary,
          keyPoints: generated.keyPoints,
          timestamps: generated.timestamps,
          topics: generated.topics,
          status: 'COMPLETED',
          processedAt: new Date(),
          aiModel: 'gpt-4o-mini',
        },
      });
    } catch (error) {
      console.error('Video summary error:', error);
      await this.prisma.videoSummary.update({
        where: { id: summaryId },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Processing failed',
        },
      });
    }
  }

  private async getYouTubeContent(videoId: string): Promise<{
    transcript: string;
    duration: number;
    timestamps: any[];
  }> {
    // Try to get captions
    const languages = ['es', 'en', 'es-419', 'es-ES'];

    for (const lang of languages) {
      try {
        const captionsUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
        const response = await axios.get(captionsUrl);

        if (response.data?.events) {
          const events = response.data.events.filter((e: any) => e.segs);

          const segments = events.map((e: any) => ({
            time: Math.floor((e.tStartMs || 0) / 1000),
            text: e.segs.map((s: any) => s.utf8).join('').trim(),
          }));

          const transcript = segments.map((s: any) => s.text).join(' ');
          const duration = events[events.length - 1]?.tStartMs / 1000 || 0;

          // Group into timestamps every ~2 minutes
          const timestamps: any[] = [];
          let currentGroup = { time: 0, text: '' };

          for (const seg of segments) {
            if (seg.time - currentGroup.time > 120 && currentGroup.text) {
              timestamps.push(currentGroup);
              currentGroup = { time: seg.time, text: seg.text };
            } else {
              currentGroup.text += ' ' + seg.text;
            }
          }
          if (currentGroup.text) timestamps.push(currentGroup);

          return { transcript, duration, timestamps };
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('Could not get video captions');
  }

  private async generateSummary(
    transcript: string,
    language: string,
    timestamps: any[],
  ): Promise<{
    summary: string;
    keyPoints: string[];
    timestamps: any[];
    topics: string[];
  }> {
    const apiKey = this.config.get('OPENAI_API_KEY') || this.config.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      return { summary: '', keyPoints: [], timestamps: [], topics: [] };
    }

    const prompt = `Analiza este video educativo y genera:
1. Un resumen completo pero conciso (3-4 párrafos)
2. Los puntos clave (5-10 puntos)
3. Timestamps con los temas principales
4. Lista de temas cubiertos

Transcripción del video:
${transcript.substring(0, 10000)}

${timestamps.length > 0 ? `\nTimestamps disponibles:\n${timestamps.map(t => `${Math.floor(t.time / 60)}:${(t.time % 60).toString().padStart(2, '0')} - ${t.text.substring(0, 100)}`).join('\n')}` : ''}

Responde en JSON en español:
{
  "summary": "resumen del video",
  "keyPoints": ["punto 1", "punto 2", ...],
  "timestamps": [{"time": segundos, "topic": "tema tratado"}, ...],
  "topics": ["tema 1", "tema 2", ...]
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
      console.error('AI summary error:', error);
      return { summary: '', keyPoints: [], timestamps: [], topics: [] };
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

  async getSummaries(userId: string, subjectId?: string) {
    return this.prisma.videoSummary.findMany({
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

  async getSummary(userId: string, id: string) {
    const summary = await this.prisma.videoSummary.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true } },
      },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    return summary;
  }

  async deleteSummary(userId: string, id: string) {
    const summary = await this.prisma.videoSummary.findFirst({
      where: { id, userId },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    await this.prisma.videoSummary.delete({ where: { id } });
    return { success: true };
  }
}
