import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateBibliographyDto,
  CreateCitationDto,
  UpdateCitationDto,
  CitationType,
  CitationStyle,
} from './dto';

@Injectable()
export class BibliographyService {
  constructor(private prisma: PrismaService) {}

  // Bibliographies
  async createBibliography(userId: string, dto: CreateBibliographyDto) {
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    return this.prisma.bibliography.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        subjectId: dto.subjectId,
      },
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { citations: true } },
      },
    });
  }

  async getBibliographies(userId: string, subjectId?: string) {
    return this.prisma.bibliography.findMany({
      where: {
        userId,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { citations: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getBibliography(userId: string, id: string) {
    const bibliography = await this.prisma.bibliography.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true } },
        citations: {
          orderBy: [{ authors: 'asc' }, { year: 'desc' }],
        },
      },
    });

    if (!bibliography) {
      throw new NotFoundException('Bibliography not found');
    }

    return bibliography;
  }

  async deleteBibliography(userId: string, id: string) {
    const bibliography = await this.prisma.bibliography.findFirst({
      where: { id, userId },
    });

    if (!bibliography) {
      throw new NotFoundException('Bibliography not found');
    }

    await this.prisma.bibliography.delete({ where: { id } });
    return { success: true };
  }

  // Citations
  async addCitation(userId: string, bibliographyId: string, dto: CreateCitationDto) {
    const bibliography = await this.prisma.bibliography.findFirst({
      where: { id: bibliographyId, userId },
    });

    if (!bibliography) {
      throw new NotFoundException('Bibliography not found');
    }

    return this.prisma.citation.create({
      data: {
        bibliographyId,
        type: dto.type,
        title: dto.title,
        authors: dto.authors || [],
        year: dto.year,
        url: dto.url,
        accessDate: dto.accessDate ? new Date(dto.accessDate) : null,
        publisher: dto.publisher,
        edition: dto.edition,
        isbn: dto.isbn,
        pages: dto.pages,
        journal: dto.journal,
        volume: dto.volume,
        issue: dto.issue,
        doi: dto.doi,
        siteName: dto.siteName,
        notes: dto.notes,
        tags: dto.tags || [],
      },
    });
  }

  async updateCitation(userId: string, citationId: string, dto: UpdateCitationDto) {
    const citation = await this.prisma.citation.findFirst({
      where: { id: citationId },
      include: { bibliography: true },
    });

    if (!citation || citation.bibliography.userId !== userId) {
      throw new NotFoundException('Citation not found');
    }

    return this.prisma.citation.update({
      where: { id: citationId },
      data: {
        type: dto.type,
        title: dto.title,
        authors: dto.authors,
        year: dto.year,
        url: dto.url,
        accessDate: dto.accessDate ? new Date(dto.accessDate) : undefined,
        publisher: dto.publisher,
        edition: dto.edition,
        isbn: dto.isbn,
        pages: dto.pages,
        journal: dto.journal,
        volume: dto.volume,
        issue: dto.issue,
        doi: dto.doi,
        siteName: dto.siteName,
        notes: dto.notes,
        tags: dto.tags,
      },
    });
  }

  async deleteCitation(userId: string, citationId: string) {
    const citation = await this.prisma.citation.findFirst({
      where: { id: citationId },
      include: { bibliography: true },
    });

    if (!citation || citation.bibliography.userId !== userId) {
      throw new NotFoundException('Citation not found');
    }

    await this.prisma.citation.delete({ where: { id: citationId } });
    return { success: true };
  }

  // Format citations
  formatCitation(citation: any, style: CitationStyle): string {
    const authors = citation.authors || [];
    const year = citation.year || 'n.d.';

    switch (style) {
      case CitationStyle.APA:
        return this.formatAPA(citation, authors, year);
      case CitationStyle.MLA:
        return this.formatMLA(citation, authors, year);
      case CitationStyle.CHICAGO:
        return this.formatChicago(citation, authors, year);
      case CitationStyle.HARVARD:
        return this.formatHarvard(citation, authors, year);
      case CitationStyle.IEEE:
        return this.formatIEEE(citation, authors, year);
      default:
        return this.formatAPA(citation, authors, year);
    }
  }

  private formatAuthorsAPA(authors: string[]): string {
    if (authors.length === 0) return '';
    if (authors.length === 1) return `${authors[0]}.`;
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}.`;
    if (authors.length <= 7) {
      const last = authors.pop();
      return `${authors.join(', ')}, & ${last}.`;
    }
    return `${authors.slice(0, 6).join(', ')}, ... ${authors[authors.length - 1]}.`;
  }

  private formatAPA(citation: any, authors: string[], year: any): string {
    const authorStr = this.formatAuthorsAPA([...authors]);

    switch (citation.type) {
      case CitationType.BOOK:
        return `${authorStr} (${year}). *${citation.title}*${citation.edition ? ` (${citation.edition} ed.)` : ''}. ${citation.publisher || ''}.`;

      case CitationType.ARTICLE:
      case CitationType.JOURNAL:
        return `${authorStr} (${year}). ${citation.title}. *${citation.journal}*${citation.volume ? `, ${citation.volume}` : ''}${citation.issue ? `(${citation.issue})` : ''}${citation.pages ? `, ${citation.pages}` : ''}.${citation.doi ? ` https://doi.org/${citation.doi}` : ''}`;

      case CitationType.WEBSITE:
        const accessDate = citation.accessDate
          ? new Date(citation.accessDate).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
          : '';
        return `${authorStr} (${year}). ${citation.title}. ${citation.siteName || ''}. ${accessDate ? `Recuperado el ${accessDate}, de ` : ''}${citation.url || ''}`;

      default:
        return `${authorStr} (${year}). ${citation.title}.`;
    }
  }

  private formatMLA(citation: any, authors: string[], year: any): string {
    const authorStr = authors.length > 0
      ? authors.length === 1
        ? `${authors[0]}.`
        : `${authors[0]}, et al.`
      : '';

    switch (citation.type) {
      case CitationType.BOOK:
        return `${authorStr} *${citation.title}*. ${citation.publisher || ''}, ${year}.`;

      case CitationType.ARTICLE:
      case CitationType.JOURNAL:
        return `${authorStr} "${citation.title}." *${citation.journal}*, vol. ${citation.volume || 'n/a'}, no. ${citation.issue || 'n/a'}, ${year}, pp. ${citation.pages || 'n/a'}.`;

      case CitationType.WEBSITE:
        return `${authorStr} "${citation.title}." *${citation.siteName || 'n.p.'}*, ${year}, ${citation.url || ''}.`;

      default:
        return `${authorStr} "${citation.title}." ${year}.`;
    }
  }

  private formatChicago(citation: any, authors: string[], year: any): string {
    const authorStr = authors.join(', ');

    switch (citation.type) {
      case CitationType.BOOK:
        return `${authorStr}. *${citation.title}*. ${citation.publisher || ''}, ${year}.`;

      default:
        return `${authorStr}. "${citation.title}." ${year}.`;
    }
  }

  private formatHarvard(citation: any, authors: string[], year: any): string {
    const authorStr = authors.join(' and ');
    return `${authorStr} (${year}) '${citation.title}', ${citation.journal || citation.publisher || ''}.`;
  }

  private formatIEEE(citation: any, authors: string[], year: any): string {
    const authorStr = authors.join(', ');
    return `${authorStr}, "${citation.title}," ${citation.journal || ''}, vol. ${citation.volume || ''}, no. ${citation.issue || ''}, pp. ${citation.pages || ''}, ${year}.`;
  }

  async exportBibliography(userId: string, bibliographyId: string, style: CitationStyle) {
    const bibliography = await this.getBibliography(userId, bibliographyId);

    const formattedCitations = bibliography.citations.map((citation) =>
      this.formatCitation(citation, style)
    );

    return {
      name: bibliography.name,
      style,
      citations: formattedCitations,
      bibtex: this.generateBibtex(bibliography.citations),
    };
  }

  private generateBibtex(citations: any[]): string {
    return citations.map((c, i) => {
      const key = `${c.authors?.[0]?.split(' ').pop() || 'unknown'}${c.year || 'nd'}${i}`;
      const type = c.type === 'BOOK' ? 'book' : c.type === 'ARTICLE' ? 'article' : 'misc';

      const fields = [
        c.authors?.length ? `  author = {${c.authors.join(' and ')}}` : '',
        `  title = {${c.title}}`,
        c.year ? `  year = {${c.year}}` : '',
        c.publisher ? `  publisher = {${c.publisher}}` : '',
        c.journal ? `  journal = {${c.journal}}` : '',
        c.volume ? `  volume = {${c.volume}}` : '',
        c.pages ? `  pages = {${c.pages}}` : '',
        c.doi ? `  doi = {${c.doi}}` : '',
        c.url ? `  url = {${c.url}}` : '',
      ].filter(Boolean).join(',\n');

      return `@${type}{${key},\n${fields}\n}`;
    }).join('\n\n');
  }

  // Import from DOI
  async importFromDOI(userId: string, bibliographyId: string, doi: string) {
    const bibliography = await this.prisma.bibliography.findFirst({
      where: { id: bibliographyId, userId },
    });

    if (!bibliography) {
      throw new NotFoundException('Bibliography not found');
    }

    try {
      // Fetch metadata from CrossRef
      const response = await fetch(`https://api.crossref.org/works/${doi}`);
      const data = await response.json();
      const work = data.message;

      const authors = work.author?.map((a: any) => `${a.family}, ${a.given}`) || [];
      const year = work.published?.['date-parts']?.[0]?.[0] || work['published-print']?.['date-parts']?.[0]?.[0];

      return this.addCitation(userId, bibliographyId, {
        type: work.type === 'journal-article' ? CitationType.ARTICLE : CitationType.OTHER,
        title: work.title?.[0] || 'Unknown',
        authors,
        year,
        doi,
        journal: work['container-title']?.[0],
        volume: work.volume,
        issue: work.issue,
        pages: work.page,
        url: work.URL,
      });
    } catch (error) {
      throw new NotFoundException('Could not fetch citation data from DOI');
    }
  }
}
