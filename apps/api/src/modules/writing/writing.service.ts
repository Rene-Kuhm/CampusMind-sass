import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { LlmService } from "../rag/services/llm.service";
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  AnalyzeTextDto,
  ImproveTextDto,
  PlagiarismCheckDto,
  SaveVersionDto,
  GetDocumentsQueryDto,
  GetTemplatesQueryDto,
  DocumentType,
  WritingStyle,
  AnalysisType,
  ImprovementType,
  AnalysisResultDto,
  AnalysisIssueDto,
  ImproveResultDto,
  ImprovementSuggestionDto,
  PlagiarismResultDto,
  PlagiarismMatchDto,
  DocumentVersionDto,
  WritingTemplateDto,
} from "./dto";

// ============================================
// INTERFACES
// ============================================

interface WritingDocument {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: DocumentType;
  style: WritingStyle;
  subjectId?: string | null;
  tags: string[];
  templateId?: string | null;
  wordCount: number;
  currentVersion: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  wordCount: number;
  changeDescription?: string | null;
  isMajorVersion: boolean;
  createdAt: Date;
}

// ============================================
// TEMPLATES DATA (In-memory for now, could be moved to DB)
// ============================================

const WRITING_TEMPLATES: WritingTemplateDto[] = [
  {
    id: "essay-academic-001",
    name: "Academic Essay",
    description: "A structured template for academic essays with introduction, body paragraphs, and conclusion.",
    type: DocumentType.ESSAY,
    style: WritingStyle.ACADEMIC,
    content: `# [Essay Title]

## Introduction

[Hook - Start with an engaging opening sentence that captures the reader's attention]

[Background - Provide context and background information on the topic]

[Thesis Statement - State your main argument or purpose clearly]

## Body Paragraph 1

[Topic Sentence - Introduce the main point of this paragraph]

[Evidence - Provide supporting evidence, data, or examples]

[Analysis - Explain how the evidence supports your thesis]

[Transition - Connect to the next paragraph]

## Body Paragraph 2

[Topic Sentence]

[Evidence]

[Analysis]

[Transition]

## Body Paragraph 3

[Topic Sentence]

[Evidence]

[Analysis]

[Transition to conclusion]

## Conclusion

[Restate Thesis - Rephrase your main argument]

[Summary - Briefly summarize the key points]

[Final Thought - End with a thought-provoking statement or call to action]

---
*References*
[Add your citations here in the appropriate format]`,
    tags: ["academic", "essay", "structured", "formal"],
  },
  {
    id: "research-paper-001",
    name: "Research Paper",
    description: "Comprehensive template for research papers with abstract, methodology, results, and discussion sections.",
    type: DocumentType.RESEARCH_PAPER,
    style: WritingStyle.ACADEMIC,
    content: `# [Research Paper Title]

## Abstract

[Provide a brief summary (150-300 words) covering the purpose, methodology, key findings, and conclusions]

**Keywords:** [keyword1], [keyword2], [keyword3], [keyword4], [keyword5]

## 1. Introduction

### 1.1 Background
[Provide context and background information]

### 1.2 Problem Statement
[Clearly state the research problem]

### 1.3 Research Questions/Hypotheses
[List your research questions or hypotheses]

### 1.4 Objectives
[State the objectives of your research]

## 2. Literature Review

### 2.1 Theoretical Framework
[Discuss the theoretical foundation]

### 2.2 Previous Research
[Review relevant previous studies]

### 2.3 Research Gap
[Identify the gap your research addresses]

## 3. Methodology

### 3.1 Research Design
[Describe your research approach]

### 3.2 Data Collection
[Explain how data was collected]

### 3.3 Data Analysis
[Describe analytical methods used]

### 3.4 Limitations
[Acknowledge methodological limitations]

## 4. Results

### 4.1 Findings
[Present your findings with data, tables, or figures]

### 4.2 Statistical Analysis
[Include relevant statistical analyses]

## 5. Discussion

### 5.1 Interpretation
[Interpret your findings]

### 5.2 Implications
[Discuss theoretical and practical implications]

### 5.3 Comparison with Previous Research
[Compare your findings with existing literature]

## 6. Conclusion

### 6.1 Summary
[Summarize key findings]

### 6.2 Recommendations
[Provide recommendations for future research or practice]

## References

[List all references in appropriate citation format]

## Appendices

[Include supplementary materials]`,
    tags: ["research", "academic", "methodology", "formal"],
  },
  {
    id: "report-business-001",
    name: "Business Report",
    description: "Professional template for business reports with executive summary and recommendations.",
    type: DocumentType.REPORT,
    style: WritingStyle.FORMAL,
    content: `# [Report Title]

**Prepared by:** [Your Name]
**Date:** [Date]
**Department:** [Department Name]

---

## Executive Summary

[Provide a concise overview of the report's purpose, key findings, and recommendations - typically 1-2 paragraphs]

## 1. Introduction

### 1.1 Purpose
[State the purpose of this report]

### 1.2 Scope
[Define the scope and boundaries]

### 1.3 Background
[Provide relevant context]

## 2. Methodology

[Describe how information was gathered and analyzed]

## 3. Findings

### 3.1 Key Finding 1
[Detail the finding with supporting data]

### 3.2 Key Finding 2
[Detail the finding with supporting data]

### 3.3 Key Finding 3
[Detail the finding with supporting data]

## 4. Analysis

### 4.1 Implications
[Discuss what the findings mean]

### 4.2 Challenges
[Identify potential challenges]

### 4.3 Opportunities
[Highlight opportunities]

## 5. Recommendations

1. [Recommendation 1 with justification]
2. [Recommendation 2 with justification]
3. [Recommendation 3 with justification]

## 6. Conclusion

[Summarize the report and emphasize the importance of the recommendations]

## Appendices

### Appendix A: [Title]
[Supporting data or documents]

### Appendix B: [Title]
[Additional information]`,
    tags: ["business", "report", "formal", "professional"],
  },
  {
    id: "thesis-outline-001",
    name: "Thesis Outline",
    description: "Comprehensive template for thesis or dissertation chapters.",
    type: DocumentType.THESIS,
    style: WritingStyle.ACADEMIC,
    content: `# [Thesis Title]

**Author:** [Your Name]
**Supervisor:** [Supervisor Name]
**Institution:** [University Name]
**Date:** [Submission Date]

---

## Abstract

[250-350 words summarizing the entire thesis]

## Acknowledgments

[Thank those who contributed to your research]

## Table of Contents

[Auto-generate or list chapters and sections]

## List of Figures

[List all figures with page numbers]

## List of Tables

[List all tables with page numbers]

---

## Chapter 1: Introduction

### 1.1 Background and Context
### 1.2 Statement of the Problem
### 1.3 Research Questions
### 1.4 Aims and Objectives
### 1.5 Significance of the Study
### 1.6 Scope and Delimitations
### 1.7 Definition of Key Terms
### 1.8 Structure of the Thesis

## Chapter 2: Literature Review

### 2.1 Introduction
### 2.2 Theoretical Framework
### 2.3 Review of Related Literature
### 2.4 Conceptual Framework
### 2.5 Research Gap
### 2.6 Chapter Summary

## Chapter 3: Methodology

### 3.1 Introduction
### 3.2 Research Philosophy
### 3.3 Research Approach
### 3.4 Research Design
### 3.5 Population and Sampling
### 3.6 Data Collection Methods
### 3.7 Data Analysis Techniques
### 3.8 Validity and Reliability
### 3.9 Ethical Considerations
### 3.10 Chapter Summary

## Chapter 4: Results/Findings

### 4.1 Introduction
### 4.2 Presentation of Findings
### 4.3 Summary of Results

## Chapter 5: Discussion

### 5.1 Introduction
### 5.2 Discussion of Findings
### 5.3 Theoretical Implications
### 5.4 Practical Implications
### 5.5 Limitations of the Study

## Chapter 6: Conclusion and Recommendations

### 6.1 Summary of the Study
### 6.2 Conclusions
### 6.3 Recommendations
### 6.4 Suggestions for Future Research

## References

[Complete list of all sources cited]

## Appendices

[Supplementary materials]`,
    tags: ["thesis", "dissertation", "academic", "comprehensive"],
  },
  {
    id: "summary-notes-001",
    name: "Study Summary",
    description: "Template for summarizing study materials and lecture notes.",
    type: DocumentType.SUMMARY,
    style: WritingStyle.INFORMAL,
    content: `# [Topic/Subject Name] - Summary

**Date:** [Date]
**Source:** [Textbook, Lecture, etc.]
**Chapter/Module:** [Number/Name]

---

## Key Concepts

### Concept 1: [Name]
- **Definition:** [Clear definition]
- **Key Points:**
  - Point 1
  - Point 2
  - Point 3
- **Examples:** [Provide examples]

### Concept 2: [Name]
- **Definition:** [Clear definition]
- **Key Points:**
  - Point 1
  - Point 2
- **Examples:** [Provide examples]

## Important Formulas/Equations

| Name | Formula | Usage |
|------|---------|-------|
| [Formula 1] | [Expression] | [When to use] |
| [Formula 2] | [Expression] | [When to use] |

## Key Terms & Definitions

| Term | Definition |
|------|------------|
| [Term 1] | [Definition] |
| [Term 2] | [Definition] |
| [Term 3] | [Definition] |

## Summary Points

1. [Main takeaway 1]
2. [Main takeaway 2]
3. [Main takeaway 3]

## Questions for Review

- [ ] Question 1?
- [ ] Question 2?
- [ ] Question 3?

## Connections to Previous Topics

[How does this relate to what you've learned before?]

## Personal Notes

[Your own observations, questions, or areas needing clarification]`,
    tags: ["summary", "notes", "study", "review"],
  },
  {
    id: "article-blog-001",
    name: "Blog Article",
    description: "Template for engaging blog posts and online articles.",
    type: DocumentType.ARTICLE,
    style: WritingStyle.CREATIVE,
    content: `# [Catchy Title That Grabs Attention]

*[Subtitle or hook that expands on the title]*

**By [Author Name] | [Date] | [Category]**

---

## Introduction

[Open with a hook - a question, surprising fact, or relatable scenario that draws readers in]

[Briefly explain what the article will cover and why it matters to the reader]

---

## [Section 1 Heading - Make It Engaging]

[Main point with supporting details]

> [Pull quote or key insight to highlight]

[Additional context or examples]

### [Subsection if needed]

[More detailed information]

---

## [Section 2 Heading]

[Main point]

**Key Points:**
- Point 1
- Point 2
- Point 3

[Expand on these points with examples or anecdotes]

---

## [Section 3 Heading]

[Main point]

[Include a practical example, case study, or personal experience]

---

## Key Takeaways

1. **[Takeaway 1]:** [Brief explanation]
2. **[Takeaway 2]:** [Brief explanation]
3. **[Takeaway 3]:** [Brief explanation]

---

## Conclusion

[Summarize the main points]

[End with a call to action - invite comments, share the article, or take specific action]

---

**About the Author**

[Brief author bio]

**Related Articles:**
- [Related Article 1]
- [Related Article 2]

**Tags:** #tag1 #tag2 #tag3`,
    tags: ["blog", "article", "creative", "engaging"],
  },
];

@Injectable()
export class WritingService {
  private readonly logger = new Logger(WritingService.name);

  // In-memory storage for documents and versions (replace with Prisma when models are added)
  private documents: Map<string, WritingDocument> = new Map();
  private versions: Map<string, DocumentVersion[]> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
  ) {}

  // ============================================
  // DOCUMENT CRUD OPERATIONS
  // ============================================

  async createDocument(
    userId: string,
    dto: CreateDocumentDto,
  ): Promise<WritingDocument> {
    this.logger.log(`Creating document for user ${userId}: ${dto.title}`);

    const wordCount = this.countWords(dto.content || "");
    const id = this.generateId();

    const document: WritingDocument = {
      id,
      userId,
      title: dto.title,
      content: dto.content || "",
      type: dto.type || DocumentType.OTHER,
      style: dto.style || WritingStyle.INFORMAL,
      subjectId: dto.subjectId || null,
      tags: dto.tags || [],
      templateId: dto.templateId || null,
      wordCount,
      currentVersion: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.documents.set(id, document);

    // Create initial version
    const version: DocumentVersion = {
      id: this.generateId(),
      documentId: id,
      versionNumber: 1,
      content: document.content,
      wordCount,
      changeDescription: "Initial version",
      isMajorVersion: true,
      createdAt: new Date(),
    };

    this.versions.set(id, [version]);

    this.logger.log(`Document created with ID: ${id}`);
    return document;
  }

  async getDocuments(
    userId: string,
    query: GetDocumentsQueryDto,
  ): Promise<{ documents: WritingDocument[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    let documents = Array.from(this.documents.values()).filter(
      (doc) => doc.userId === userId,
    );

    // Apply filters
    if (!query.includeArchived) {
      documents = documents.filter((doc) => !doc.isArchived);
    }

    if (query.type) {
      documents = documents.filter((doc) => doc.type === query.type);
    }

    if (query.subjectId) {
      documents = documents.filter((doc) => doc.subjectId === query.subjectId);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      documents = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.content.toLowerCase().includes(searchLower),
      );
    }

    if (query.tags && query.tags.length > 0) {
      documents = documents.filter((doc) =>
        query.tags!.some((tag) => doc.tags.includes(tag)),
      );
    }

    // Sort by updated date (newest first)
    documents.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    const total = documents.length;
    const startIndex = (page - 1) * limit;
    const paginatedDocs = documents.slice(startIndex, startIndex + limit);

    return {
      documents: paginatedDocs,
      total,
      page,
      limit,
    };
  }

  async getDocumentById(
    userId: string,
    documentId: string,
  ): Promise<WritingDocument> {
    const document = this.documents.get(documentId);

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    if (document.userId !== userId) {
      throw new ForbiddenException("You do not have access to this document");
    }

    return document;
  }

  async updateDocument(
    userId: string,
    documentId: string,
    dto: UpdateDocumentDto,
  ): Promise<WritingDocument> {
    const document = await this.getDocumentById(userId, documentId);

    const updatedDocument: WritingDocument = {
      ...document,
      title: dto.title ?? document.title,
      content: dto.content ?? document.content,
      type: dto.type ?? document.type,
      style: dto.style ?? document.style,
      subjectId: dto.subjectId ?? document.subjectId,
      tags: dto.tags ?? document.tags,
      isArchived: dto.isArchived ?? document.isArchived,
      wordCount: dto.content ? this.countWords(dto.content) : document.wordCount,
      updatedAt: new Date(),
    };

    this.documents.set(documentId, updatedDocument);

    this.logger.log(`Document ${documentId} updated`);
    return updatedDocument;
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    await this.getDocumentById(userId, documentId);

    this.documents.delete(documentId);
    this.versions.delete(documentId);

    this.logger.log(`Document ${documentId} deleted`);
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async getTemplates(query: GetTemplatesQueryDto): Promise<WritingTemplateDto[]> {
    let templates = [...WRITING_TEMPLATES];

    if (query.type) {
      templates = templates.filter((t) => t.type === query.type);
    }

    if (query.style) {
      templates = templates.filter((t) => t.style === query.style);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower),
      );
    }

    return templates;
  }

  async getTemplateById(templateId: string): Promise<WritingTemplateDto> {
    const template = WRITING_TEMPLATES.find((t) => t.id === templateId);

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    return template;
  }

  // ============================================
  // TEXT ANALYSIS
  // ============================================

  async analyzeText(
    userId: string,
    dto: AnalyzeTextDto,
  ): Promise<AnalysisResultDto> {
    this.logger.log(`Analyzing text for user ${userId}`);

    const { text, analysisType = AnalysisType.ALL, expectedStyle, language = "en" } = dto;

    // Calculate basic metrics
    const wordCount = this.countWords(text);
    const sentences = this.splitSentences(text);
    const sentenceCount = sentences.length;
    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const readabilityScore = this.calculateReadability(text);

    // Use LLM to analyze the text
    const analysisPrompt = this.buildAnalysisPrompt(text, analysisType, expectedStyle, language);

    let issues: AnalysisIssueDto[] = [];
    let scores: Record<string, number> = {
      grammar: 85,
      style: 80,
      clarity: 82,
      tone: 78,
    };

    try {
      const llmResponse = await this.llmService.generateText(analysisPrompt, {
        maxTokens: 2000,
        temperature: 0.3,
      });

      const parsed = this.parseAnalysisResponse(llmResponse);
      issues = parsed.issues;
      scores = parsed.scores;
    } catch (error) {
      this.logger.warn(`LLM analysis failed, using basic analysis: ${error}`);
      // Fallback to basic analysis
      issues = this.performBasicAnalysis(text);
    }

    const overallScore = Math.round(
      (scores.grammar + scores.style + scores.clarity + scores.tone) / 4,
    );

    return {
      issues,
      overallScore,
      scores,
      wordCount,
      sentenceCount,
      averageWordsPerSentence: Math.round(averageWordsPerSentence * 10) / 10,
      readabilityScore: Math.round(readabilityScore * 10) / 10,
    };
  }

  // ============================================
  // TEXT IMPROVEMENT
  // ============================================

  async improveText(
    userId: string,
    dto: ImproveTextDto,
  ): Promise<ImproveResultDto> {
    this.logger.log(`Improving text for user ${userId}`);

    const {
      text,
      improvementTypes = [ImprovementType.CLARITY],
      targetStyle = WritingStyle.ACADEMIC,
      context,
      preserveMeaning = true,
    } = dto;

    const improvementPrompt = this.buildImprovementPrompt(
      text,
      improvementTypes,
      targetStyle,
      context,
      preserveMeaning,
    );

    let improvedText = text;
    let suggestions: ImprovementSuggestionDto[] = [];

    try {
      const llmResponse = await this.llmService.generateText(improvementPrompt, {
        maxTokens: 3000,
        temperature: 0.5,
      });

      const parsed = this.parseImprovementResponse(llmResponse, text);
      improvedText = parsed.improvedText;
      suggestions = parsed.suggestions;
    } catch (error) {
      this.logger.warn(`LLM improvement failed: ${error}`);
      // Return original text with basic suggestions
      suggestions = this.generateBasicSuggestions(text);
    }

    const changesCount = suggestions.length;
    const originalLength = text.length;
    const improvedLength = improvedText.length;
    const improvementPercentage = Math.abs(
      Math.round(((improvedLength - originalLength) / originalLength) * 100),
    );

    return {
      improvedText,
      suggestions,
      changesCount,
      improvementPercentage,
    };
  }

  // ============================================
  // PLAGIARISM CHECK
  // ============================================

  async checkPlagiarism(
    userId: string,
    dto: PlagiarismCheckDto,
  ): Promise<PlagiarismResultDto> {
    this.logger.log(`Checking plagiarism for user ${userId}`);

    const { text, excludedSources = [], similarityThreshold = 0.7 } = dto;

    // Basic plagiarism detection using text fingerprinting
    // In production, this would integrate with services like Turnitin, Copyscape, etc.

    const chunks = this.splitIntoChunks(text, 50); // 50-word chunks
    const matches: PlagiarismMatchDto[] = [];

    // Simulate plagiarism check by analyzing common phrases
    // In real implementation, this would query external databases
    const commonPhrases = await this.checkCommonPhrases(chunks);

    for (const match of commonPhrases) {
      if (match.similarity >= similarityThreshold) {
        matches.push(match);
      }
    }

    const overallSimilarity = matches.length > 0
      ? Math.round(
          (matches.reduce((acc, m) => acc + m.similarity, 0) / matches.length) * 100,
        ) / 100
      : 0;

    const isPlagiarismDetected = overallSimilarity >= similarityThreshold;

    return {
      overallSimilarity: overallSimilarity * 100,
      isPlagiarismDetected,
      matches,
      analyzedCharacters: text.length,
      checkedAt: new Date().toISOString(),
    };
  }

  // ============================================
  // VERSION HISTORY
  // ============================================

  async getDocumentHistory(
    userId: string,
    documentId: string,
  ): Promise<DocumentVersionDto[]> {
    await this.getDocumentById(userId, documentId);

    const documentVersions = this.versions.get(documentId) || [];

    return documentVersions
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        changeDescription: v.changeDescription || undefined,
        wordCount: v.wordCount,
        createdAt: v.createdAt.toISOString(),
        isMajorVersion: v.isMajorVersion,
      }));
  }

  async saveVersion(
    userId: string,
    documentId: string,
    dto: SaveVersionDto,
  ): Promise<DocumentVersionDto> {
    const document = await this.getDocumentById(userId, documentId);

    const existingVersions = this.versions.get(documentId) || [];
    const newVersionNumber = document.currentVersion + 1;

    const newVersion: DocumentVersion = {
      id: this.generateId(),
      documentId,
      versionNumber: newVersionNumber,
      content: document.content,
      wordCount: document.wordCount,
      changeDescription: dto.changeDescription || null,
      isMajorVersion: dto.isMajorVersion || false,
      createdAt: new Date(),
    };

    existingVersions.push(newVersion);
    this.versions.set(documentId, existingVersions);

    // Update document's current version
    document.currentVersion = newVersionNumber;
    this.documents.set(documentId, document);

    this.logger.log(`Version ${newVersionNumber} saved for document ${documentId}`);

    return {
      id: newVersion.id,
      versionNumber: newVersion.versionNumber,
      changeDescription: newVersion.changeDescription || undefined,
      wordCount: newVersion.wordCount,
      createdAt: newVersion.createdAt.toISOString(),
      isMajorVersion: newVersion.isMajorVersion,
    };
  }

  async getVersionContent(
    userId: string,
    documentId: string,
    versionId: string,
  ): Promise<{ content: string; versionNumber: number }> {
    await this.getDocumentById(userId, documentId);

    const documentVersions = this.versions.get(documentId) || [];
    const version = documentVersions.find((v) => v.id === versionId);

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    return {
      content: version.content,
      versionNumber: version.versionNumber,
    };
  }

  async restoreVersion(
    userId: string,
    documentId: string,
    versionId: string,
  ): Promise<WritingDocument> {
    const document = await this.getDocumentById(userId, documentId);

    const documentVersions = this.versions.get(documentId) || [];
    const version = documentVersions.find((v) => v.id === versionId);

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Update document with version content
    document.content = version.content;
    document.wordCount = version.wordCount;
    document.updatedAt = new Date();

    this.documents.set(documentId, document);

    // Save a new version indicating restoration
    await this.saveVersion(userId, documentId, {
      changeDescription: `Restored from version ${version.versionNumber}`,
      isMajorVersion: false,
    });

    return document;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private generateId(): string {
    return `cl${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
  }

  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }

  private splitSentences(text: string): string[] {
    if (!text) return [];
    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private calculateReadability(text: string): number {
    // Flesch-Kincaid Grade Level approximation
    const words = this.countWords(text);
    const sentences = this.splitSentences(text).length || 1;
    const syllables = this.countSyllables(text);

    if (words === 0) return 0;

    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    // Flesch-Kincaid Grade Level formula
    const gradeLevel =
      0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

    return Math.max(0, Math.min(20, gradeLevel));
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let totalSyllables = 0;

    for (const word of words) {
      totalSyllables += this.countWordSyllables(word);
    }

    return totalSyllables;
  }

  private countWordSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");

    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  private splitIntoChunks(text: string, wordCount: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += wordCount) {
      chunks.push(words.slice(i, i + wordCount).join(" "));
    }

    return chunks;
  }

  private buildAnalysisPrompt(
    text: string,
    analysisType: AnalysisType,
    expectedStyle?: WritingStyle,
    language?: string,
  ): string {
    const styleContext = expectedStyle
      ? `The text should be in ${expectedStyle} style.`
      : "";

    return `Analyze the following text for ${analysisType === AnalysisType.ALL ? "grammar, style, clarity, and tone" : analysisType.toLowerCase()} issues.
${styleContext}
Language: ${language || "en"}

Text to analyze:
"""
${text}
"""

Provide your analysis in the following JSON format:
{
  "issues": [
    {
      "type": "grammar|style|clarity|tone",
      "message": "Description of the issue",
      "text": "The problematic text",
      "suggestion": "Suggested correction",
      "startIndex": 0,
      "endIndex": 10,
      "severity": "low|medium|high"
    }
  ],
  "scores": {
    "grammar": 85,
    "style": 80,
    "clarity": 82,
    "tone": 78
  }
}

Only respond with valid JSON.`;
  }

  private buildImprovementPrompt(
    text: string,
    improvementTypes: ImprovementType[],
    targetStyle: WritingStyle,
    context?: string,
    preserveMeaning?: boolean,
  ): string {
    const contextInfo = context ? `Context/Subject: ${context}` : "";
    const preserveInfo = preserveMeaning
      ? "IMPORTANT: Preserve the original meaning while improving the text."
      : "";

    return `Improve the following text focusing on: ${improvementTypes.join(", ")}.
Target style: ${targetStyle}
${contextInfo}
${preserveInfo}

Original text:
"""
${text}
"""

Provide your improvements in the following JSON format:
{
  "improvedText": "The complete improved version of the text",
  "suggestions": [
    {
      "original": "Original phrase",
      "improved": "Improved phrase",
      "explanation": "Why this change was made",
      "type": "CLARITY|CONCISENESS|ENGAGEMENT|ACADEMIC_TONE|FLOW|VOCABULARY"
    }
  ]
}

Only respond with valid JSON.`;
  }

  private parseAnalysisResponse(response: string): {
    issues: AnalysisIssueDto[];
    scores: Record<string, number>;
  } {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        issues: parsed.issues || [],
        scores: parsed.scores || {
          grammar: 85,
          style: 80,
          clarity: 82,
          tone: 78,
        },
      };
    } catch {
      this.logger.warn("Failed to parse analysis response");
      return {
        issues: [],
        scores: { grammar: 85, style: 80, clarity: 82, tone: 78 },
      };
    }
  }

  private parseImprovementResponse(
    response: string,
    originalText: string,
  ): {
    improvedText: string;
    suggestions: ImprovementSuggestionDto[];
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        improvedText: parsed.improvedText || originalText,
        suggestions: parsed.suggestions || [],
      };
    } catch {
      this.logger.warn("Failed to parse improvement response");
      return {
        improvedText: originalText,
        suggestions: [],
      };
    }
  }

  private performBasicAnalysis(text: string): AnalysisIssueDto[] {
    const issues: AnalysisIssueDto[] = [];

    // Check for common issues
    const commonErrors = [
      { pattern: /\btheir\s+was\b/gi, suggestion: "there was", type: "grammar" },
      { pattern: /\btheir\s+is\b/gi, suggestion: "there is", type: "grammar" },
      { pattern: /\byour\s+welcome\b/gi, suggestion: "you're welcome", type: "grammar" },
      { pattern: /\bits\s+a\b/gi, suggestion: "it's a", type: "grammar" },
      { pattern: /\balot\b/gi, suggestion: "a lot", type: "grammar" },
      { pattern: /\bcould\s+of\b/gi, suggestion: "could have", type: "grammar" },
      { pattern: /\bvery\s+unique\b/gi, suggestion: "unique", type: "style" },
      { pattern: /\bin\s+order\s+to\b/gi, suggestion: "to", type: "style" },
    ];

    for (const error of commonErrors) {
      let match;
      while ((match = error.pattern.exec(text)) !== null) {
        issues.push({
          type: error.type,
          message: `Consider replacing "${match[0]}"`,
          text: match[0],
          suggestion: error.suggestion,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          severity: "medium",
        });
      }
    }

    return issues;
  }

  private generateBasicSuggestions(text: string): ImprovementSuggestionDto[] {
    const suggestions: ImprovementSuggestionDto[] = [];

    // Very basic suggestions
    if (text.includes("very")) {
      suggestions.push({
        original: "very",
        improved: "[stronger adjective]",
        explanation: "Consider using a more precise adjective instead of 'very + adjective'",
        type: "VOCABULARY",
      });
    }

    if (text.includes("thing")) {
      suggestions.push({
        original: "thing",
        improved: "[specific noun]",
        explanation: "Replace vague words like 'thing' with more specific terms",
        type: "CLARITY",
      });
    }

    return suggestions;
  }

  private async checkCommonPhrases(chunks: string[]): Promise<PlagiarismMatchDto[]> {
    // Simulated plagiarism check
    // In production, this would query external plagiarism databases
    const matches: PlagiarismMatchDto[] = [];

    // For demo purposes, flag chunks that contain common academic phrases
    const commonPhrases = [
      "in conclusion",
      "it is important to note",
      "studies have shown",
      "according to research",
    ];

    let currentIndex = 0;
    for (const chunk of chunks) {
      const chunkLower = chunk.toLowerCase();
      for (const phrase of commonPhrases) {
        if (chunkLower.includes(phrase)) {
          // Low similarity for common phrases (not actual plagiarism)
          matches.push({
            matchedText: chunk,
            similarity: 0.3 + Math.random() * 0.2, // 30-50% similarity
            possibleSource: undefined,
            startIndex: currentIndex,
            endIndex: currentIndex + chunk.length,
          });
        }
      }
      currentIndex += chunk.length + 1;
    }

    return matches;
  }
}
