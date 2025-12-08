import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TTSOptions {
  voice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'; // Gemini voices
  speed?: number; // 0.5 - 2.0
  language?: string;
}

export interface TTSResult {
  audioData: Buffer;
  mimeType: string;
  durationMs?: number;
}

/**
 * Text-to-Speech Service using Google Gemini TTS
 * Free tier with generous limits
 */
@Injectable()
export class TTSService {
  private readonly logger = new Logger(TTSService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured - TTS will not work');
    }
  }

  /**
   * Generate audio from text using Gemini TTS
   */
  async generateAudio(
    text: string,
    options?: TTSOptions,
  ): Promise<TTSResult> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const voice = options?.voice || 'Kore';
    const speed = options?.speed || 1.0;

    // Prepare text for TTS (clean up markdown, etc.)
    const cleanText = this.prepareTextForTTS(text);

    try {
      // Use Gemini's multimodal model with speech output
      const response = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/models/gemini-2.5-flash-preview-tts:generateContent?key=${this.apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: cleanText,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voice,
                  },
                },
              },
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 120000, // 2 minutes for long texts
          },
        ),
      );

      // Extract audio data from response
      const audioData = response.data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (!audioData) {
        throw new Error('No audio data in response');
      }

      return {
        audioData: Buffer.from(audioData.data, 'base64'),
        mimeType: audioData.mimeType || 'audio/mp3',
      };
    } catch (error) {
      this.logger.error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Fallback to alternative TTS method if primary fails
      return this.generateAudioFallback(cleanText, options);
    }
  }

  /**
   * Generate a study podcast from content
   * Creates an engaging audio summary for studying
   */
  async generateStudyPodcast(
    title: string,
    content: string,
    options?: TTSOptions,
  ): Promise<TTSResult> {
    // Create a podcast-style script
    const podcastScript = this.createPodcastScript(title, content);
    return this.generateAudio(podcastScript, options);
  }

  /**
   * Generate audio for flashcard review
   */
  async generateFlashcardAudio(
    front: string,
    back: string,
    options?: TTSOptions,
  ): Promise<TTSResult> {
    const script = `
      Pregunta: ${front}

      ... (pausa para pensar)

      Respuesta: ${back}
    `;
    return this.generateAudio(script, options);
  }

  /**
   * Create an engaging podcast script from academic content
   */
  private createPodcastScript(title: string, content: string): string {
    return `
Bienvenido a tu sesión de estudio de CampusMind.

Hoy vamos a revisar: ${title}

${content}

Eso es todo por hoy. Recuerda revisar este material regularmente para mejor retención.

¡Hasta la próxima sesión de estudio!
    `.trim();
  }

  /**
   * Clean and prepare text for TTS
   */
  private prepareTextForTTS(text: string): string {
    return text
      // Remove markdown formatting
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Convert bullet points to speech-friendly format
      .replace(/^[-*]\s/gm, '• ')
      // Remove excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Fallback TTS using a different approach if primary fails
   */
  private async generateAudioFallback(
    text: string,
    options?: TTSOptions,
  ): Promise<TTSResult> {
    // Try using the standard Gemini model to generate SSML and then convert
    // This is a backup method
    this.logger.warn('Using fallback TTS method');

    try {
      // Use Google Cloud TTS API as fallback (if configured)
      const googleTTSKey = this.config.get<string>('GOOGLE_TTS_API_KEY');

      if (googleTTSKey) {
        const response = await firstValueFrom(
          this.http.post(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTTSKey}`,
            {
              input: { text },
              voice: {
                languageCode: options?.language || 'es-ES',
                name: 'es-ES-Standard-A',
              },
              audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: options?.speed || 1.0,
              },
            },
            { timeout: 60000 },
          ),
        );

        return {
          audioData: Buffer.from(response.data.audioContent, 'base64'),
          mimeType: 'audio/mp3',
        };
      }

      throw new Error('No fallback TTS available');
    } catch (error) {
      this.logger.error('Fallback TTS also failed');
      throw new Error('TTS generation failed - no available providers');
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): Array<{ id: string; name: string; description: string }> {
    return [
      { id: 'Puck', name: 'Puck', description: 'Voz masculina, tono amigable' },
      { id: 'Charon', name: 'Charon', description: 'Voz masculina, tono serio' },
      { id: 'Kore', name: 'Kore', description: 'Voz femenina, tono cálido' },
      { id: 'Fenrir', name: 'Fenrir', description: 'Voz masculina, tono profundo' },
      { id: 'Aoede', name: 'Aoede', description: 'Voz femenina, tono expresivo' },
    ];
  }
}
