import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateCVDto,
  UpdateCVDto,
  CreateEducationDto,
  UpdateEducationDto,
  CreateExperienceDto,
  UpdateExperienceDto,
  CreateSkillDto,
  UpdateSkillDto,
  CreateProjectDto,
  UpdateProjectDto,
  CreateCertificationDto,
  UpdateCertificationDto,
  CreateLanguageDto,
  UpdateLanguageDto,
  CVSectionType,
  JobFilterDto,
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationFilterDto,
  CreateInterviewDto,
  UpdateInterviewDto,
  InterviewFilterDto,
  InterviewPrepRequestDto,
  InterviewCategory,
} from "./dto";

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CV CRUD
  // ============================================

  async getCV(userId: string) {
    const cv = await this.prisma.userCV.findUnique({
      where: { userId },
      include: {
        education: { orderBy: { order: "asc" } },
        experience: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        projects: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
      },
    });

    if (!cv) {
      throw new NotFoundException("CV no encontrado. Crea uno primero.");
    }

    return cv;
  }

  async createCV(userId: string, dto: CreateCVDto) {
    const existingCV = await this.prisma.userCV.findUnique({
      where: { userId },
    });

    if (existingCV) {
      throw new ConflictException("Ya tienes un CV creado. Usa PATCH para actualizarlo.");
    }

    return this.prisma.userCV.create({
      data: {
        userId,
        fullName: dto.fullName,
        title: dto.title,
        summary: dto.summary,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        linkedIn: dto.linkedIn,
        github: dto.github,
        portfolio: dto.portfolio,
        photoUrl: dto.photoUrl,
      },
      include: {
        education: true,
        experience: true,
        skills: true,
        projects: true,
        certifications: true,
        languages: true,
      },
    });
  }

  async updateCV(userId: string, dto: UpdateCVDto) {
    const cv = await this.prisma.userCV.findUnique({
      where: { userId },
    });

    if (!cv) {
      throw new NotFoundException("CV no encontrado. Crea uno primero.");
    }

    return this.prisma.userCV.update({
      where: { userId },
      data: {
        fullName: dto.fullName,
        title: dto.title,
        summary: dto.summary,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        linkedIn: dto.linkedIn,
        github: dto.github,
        portfolio: dto.portfolio,
        photoUrl: dto.photoUrl,
      },
      include: {
        education: { orderBy: { order: "asc" } },
        experience: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        projects: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
      },
    });
  }

  async deleteCV(userId: string) {
    const cv = await this.prisma.userCV.findUnique({
      where: { userId },
    });

    if (!cv) {
      throw new NotFoundException("CV no encontrado.");
    }

    await this.prisma.userCV.delete({
      where: { userId },
    });

    return { message: "CV eliminado exitosamente" };
  }

  // ============================================
  // CV SECTIONS - EDUCATION
  // ============================================

  async addEducation(userId: string, dto: CreateEducationDto) {
    const cv = await this.getCVForSection(userId);

    return this.prisma.cVEducation.create({
      data: {
        cvId: cv.id,
        institution: dto.institution,
        degree: dto.degree,
        field: dto.field,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
        gpa: dto.gpa,
        description: dto.description,
        order: dto.order ?? 0,
      },
    });
  }

  async updateEducation(userId: string, educationId: string, dto: UpdateEducationDto) {
    await this.verifySectionOwnership(userId, "education", educationId);

    return this.prisma.cVEducation.update({
      where: { id: educationId },
      data: {
        institution: dto.institution,
        degree: dto.degree,
        field: dto.field,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isCurrent: dto.isCurrent,
        gpa: dto.gpa,
        description: dto.description,
        order: dto.order,
      },
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    await this.verifySectionOwnership(userId, "education", educationId);

    await this.prisma.cVEducation.delete({
      where: { id: educationId },
    });

    return { message: "Educacion eliminada exitosamente" };
  }

  // ============================================
  // CV SECTIONS - EXPERIENCE
  // ============================================

  async addExperience(userId: string, dto: CreateExperienceDto) {
    const cv = await this.getCVForSection(userId);

    return this.prisma.cVExperience.create({
      data: {
        cvId: cv.id,
        company: dto.company,
        position: dto.position,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
        description: dto.description,
        highlights: dto.highlights ?? [],
        order: dto.order ?? 0,
      },
    });
  }

  async updateExperience(userId: string, experienceId: string, dto: UpdateExperienceDto) {
    await this.verifySectionOwnership(userId, "experience", experienceId);

    return this.prisma.cVExperience.update({
      where: { id: experienceId },
      data: {
        company: dto.company,
        position: dto.position,
        location: dto.location,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isCurrent: dto.isCurrent,
        description: dto.description,
        highlights: dto.highlights,
        order: dto.order,
      },
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    await this.verifySectionOwnership(userId, "experience", experienceId);

    await this.prisma.cVExperience.delete({
      where: { id: experienceId },
    });

    return { message: "Experiencia eliminada exitosamente" };
  }

  // ============================================
  // CV SECTIONS - SKILLS
  // ============================================

  async addSkill(userId: string, dto: CreateSkillDto) {
    const cv = await this.getCVForSection(userId);

    return this.prisma.cVSkill.create({
      data: {
        cvId: cv.id,
        name: dto.name,
        level: dto.level ?? "INTERMEDIATE",
        category: dto.category,
        order: dto.order ?? 0,
      },
    });
  }

  async updateSkill(userId: string, skillId: string, dto: UpdateSkillDto) {
    await this.verifySectionOwnership(userId, "skills", skillId);

    return this.prisma.cVSkill.update({
      where: { id: skillId },
      data: {
        name: dto.name,
        level: dto.level,
        category: dto.category,
        order: dto.order,
      },
    });
  }

  async deleteSkill(userId: string, skillId: string) {
    await this.verifySectionOwnership(userId, "skills", skillId);

    await this.prisma.cVSkill.delete({
      where: { id: skillId },
    });

    return { message: "Skill eliminado exitosamente" };
  }

  // ============================================
  // CV SECTIONS - PROJECTS
  // ============================================

  async addProject(userId: string, dto: CreateProjectDto) {
    const cv = await this.getCVForSection(userId);

    return this.prisma.cVProject.create({
      data: {
        cvId: cv.id,
        name: dto.name,
        description: dto.description,
        url: dto.url,
        technologies: dto.technologies ?? [],
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        highlights: dto.highlights ?? [],
        order: dto.order ?? 0,
      },
    });
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    await this.verifySectionOwnership(userId, "projects", projectId);

    return this.prisma.cVProject.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        url: dto.url,
        technologies: dto.technologies,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        highlights: dto.highlights,
        order: dto.order,
      },
    });
  }

  async deleteProject(userId: string, projectId: string) {
    await this.verifySectionOwnership(userId, "projects", projectId);

    await this.prisma.cVProject.delete({
      where: { id: projectId },
    });

    return { message: "Proyecto eliminado exitosamente" };
  }

  // ============================================
  // CV SECTIONS - CERTIFICATIONS
  // ============================================

  async addCertification(userId: string, dto: CreateCertificationDto) {
    const cv = await this.getCVForSection(userId);

    return this.prisma.cVCertification.create({
      data: {
        cvId: cv.id,
        name: dto.name,
        issuer: dto.issuer,
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        credentialId: dto.credentialId,
        url: dto.url,
        order: dto.order ?? 0,
      },
    });
  }

  async updateCertification(userId: string, certificationId: string, dto: UpdateCertificationDto) {
    await this.verifySectionOwnership(userId, "certifications", certificationId);

    return this.prisma.cVCertification.update({
      where: { id: certificationId },
      data: {
        name: dto.name,
        issuer: dto.issuer,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        credentialId: dto.credentialId,
        url: dto.url,
        order: dto.order,
      },
    });
  }

  async deleteCertification(userId: string, certificationId: string) {
    await this.verifySectionOwnership(userId, "certifications", certificationId);

    await this.prisma.cVCertification.delete({
      where: { id: certificationId },
    });

    return { message: "Certificacion eliminada exitosamente" };
  }

  // ============================================
  // CV SECTIONS - LANGUAGES
  // ============================================

  async addLanguage(userId: string, dto: CreateLanguageDto) {
    const cv = await this.getCVForSection(userId);

    return this.prisma.cVLanguage.create({
      data: {
        cvId: cv.id,
        name: dto.name,
        level: dto.level,
        order: dto.order ?? 0,
      },
    });
  }

  async updateLanguage(userId: string, languageId: string, dto: UpdateLanguageDto) {
    await this.verifySectionOwnership(userId, "languages", languageId);

    return this.prisma.cVLanguage.update({
      where: { id: languageId },
      data: {
        name: dto.name,
        level: dto.level,
        order: dto.order,
      },
    });
  }

  async deleteLanguage(userId: string, languageId: string) {
    await this.verifySectionOwnership(userId, "languages", languageId);

    await this.prisma.cVLanguage.delete({
      where: { id: languageId },
    });

    return { message: "Idioma eliminado exitosamente" };
  }

  // ============================================
  // JOBS
  // ============================================

  async getJobs(userId: string, filters: JobFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      isActive: true,
      OR: filters.expiresAt
        ? undefined
        : [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    // Search filter
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Type filter
    if (filters.type) {
      where.type = filters.type;
    }

    // Location filter
    if (filters.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    // Remote filter
    if (filters.isRemote !== undefined) {
      where.isRemote = filters.isRemote;
    }

    // Career filter
    if (filters.career) {
      where.career = { contains: filters.career, mode: "insensitive" };
    }

    // Min year filter
    if (filters.minYear) {
      where.OR = [{ minYear: null }, { minYear: { lte: filters.minYear } }];
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      where.skills = { hasSome: filters.skills };
    }

    // Salary filters
    if (filters.salaryMin) {
      where.salaryMax = { gte: filters.salaryMin };
    }
    if (filters.salaryMax) {
      where.salaryMin = { lte: filters.salaryMax };
    }

    const [jobs, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          applications: {
            where: { userId },
            select: { id: true },
          },
        },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    // Add hasApplied flag
    const jobsWithApplied = jobs.map((job) => ({
      ...job,
      hasApplied: job.applications.length > 0,
      applications: undefined,
    }));

    return {
      data: jobsWithApplied,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getJobById(jobId: string, userId: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { userId },
          select: { id: true, status: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException("Trabajo no encontrado");
    }

    return {
      ...job,
      hasApplied: job.applications.length > 0,
      applicationStatus: job.applications[0]?.status ?? null,
      applications: undefined,
    };
  }

  // ============================================
  // APPLICATIONS
  // ============================================

  async applyToJob(userId: string, jobId: string, dto: CreateApplicationDto) {
    // Verify job exists and is active
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException("Trabajo no encontrado");
    }

    if (!job.isActive) {
      throw new BadRequestException("Este trabajo ya no esta activo");
    }

    if (job.expiresAt && job.expiresAt < new Date()) {
      throw new BadRequestException("Este trabajo ha expirado");
    }

    // Check if already applied
    const existingApplication = await this.prisma.jobApplication.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existingApplication) {
      throw new ConflictException("Ya has aplicado a este trabajo");
    }

    return this.prisma.jobApplication.create({
      data: {
        userId,
        jobId,
        status: "APPLIED",
        coverLetter: dto.coverLetter,
        notes: dto.notes,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            type: true,
            location: true,
            isRemote: true,
          },
        },
      },
    });
  }

  async getApplications(userId: string, filters: ApplicationFilterDto) {
    const where: Record<string, unknown> = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    const applications = await this.prisma.jobApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            type: true,
            location: true,
            isRemote: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
          },
        },
        interviews: {
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    return applications;
  }

  async getApplicationById(userId: string, applicationId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        interviews: {
          orderBy: { scheduledAt: "asc" },
        },
      },
    });

    if (!application) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    if (application.userId !== userId) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    return application;
  }

  async updateApplication(userId: string, applicationId: string, dto: UpdateApplicationDto) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    if (application.userId !== userId) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        notes: dto.notes,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            type: true,
          },
        },
        interviews: true,
      },
    });
  }

  async withdrawApplication(userId: string, applicationId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    if (application.userId !== userId) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    if (application.status === "WITHDRAWN") {
      throw new BadRequestException("La aplicacion ya fue retirada");
    }

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: "WITHDRAWN" },
    });
  }

  async getApplicationStats(userId: string) {
    const applications = await this.prisma.jobApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });

    const stats = {
      total: 0,
      applied: 0,
      screening: 0,
      interviewing: 0,
      offers: 0,
      rejected: 0,
      accepted: 0,
    };

    for (const app of applications) {
      const count = app._count;
      stats.total += count;

      switch (app.status) {
        case "APPLIED":
          stats.applied = count;
          break;
        case "SCREENING":
          stats.screening = count;
          break;
        case "INTERVIEWING":
          stats.interviewing = count;
          break;
        case "OFFER":
          stats.offers = count;
          break;
        case "REJECTED":
          stats.rejected = count;
          break;
        case "ACCEPTED":
          stats.accepted = count;
          break;
      }
    }

    return stats;
  }

  // ============================================
  // INTERVIEWS
  // ============================================

  async getInterviews(userId: string, filters: InterviewFilterDto) {
    const where: Record<string, unknown> = {
      application: { userId },
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.from || filters.to) {
      where.scheduledAt = {};
      if (filters.from) {
        (where.scheduledAt as Record<string, unknown>).gte = new Date(filters.from);
      }
      if (filters.to) {
        (where.scheduledAt as Record<string, unknown>).lte = new Date(filters.to);
      }
    }

    return this.prisma.interview.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              },
            },
          },
        },
      },
    });
  }

  async getInterviewById(userId: string, interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          select: {
            id: true,
            userId: true,
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    if (interview.application.userId !== userId) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    return interview;
  }

  async createInterview(userId: string, applicationId: string, dto: CreateInterviewDto) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    if (application.userId !== userId) {
      throw new NotFoundException("Aplicacion no encontrada");
    }

    // Update application status to INTERVIEWING if not already
    if (application.status !== "INTERVIEWING") {
      await this.prisma.jobApplication.update({
        where: { id: applicationId },
        data: { status: "INTERVIEWING" },
      });
    }

    return this.prisma.interview.create({
      data: {
        applicationId,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration,
        location: dto.location,
        notes: dto.notes,
        questions: dto.questions ?? [],
      },
      include: {
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              },
            },
          },
        },
      },
    });
  }

  async updateInterview(userId: string, interviewId: string, dto: UpdateInterviewDto) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          select: { userId: true },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    if (interview.application.userId !== userId) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    return this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        type: dto.type,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        duration: dto.duration,
        location: dto.location,
        notes: dto.notes,
        questions: dto.questions,
        status: dto.status,
        feedback: dto.feedback,
        rating: dto.rating,
      },
      include: {
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteInterview(userId: string, interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          select: { userId: true },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    if (interview.application.userId !== userId) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    await this.prisma.interview.delete({
      where: { id: interviewId },
    });

    return { message: "Entrevista eliminada exitosamente" };
  }

  async getInterviewPrep(userId: string, interviewId: string, dto: InterviewPrepRequestDto) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    if (interview.application.userId !== userId) {
      throw new NotFoundException("Entrevista no encontrada");
    }

    const job = interview.application.job;
    const categories = dto.categories ?? [
      InterviewCategory.BEHAVIORAL,
      InterviewCategory.TECHNICAL,
      InterviewCategory.ROLE,
    ];
    const questionCount = dto.questionCount ?? 10;

    // Fetch relevant questions from the database
    const questions = await this.prisma.interviewQuestion.findMany({
      where: {
        category: { in: categories },
        isActive: true,
      },
      take: questionCount,
      orderBy: { frequency: "desc" },
    });

    // Generate general tips based on interview type
    const generalTips = this.getGeneralTips(interview.type);

    // Build company research if requested
    let companyResearch = undefined;
    if (dto.includeCompanyResearch) {
      companyResearch = {
        about: `${job.company} es una empresa en el sector tecnologico.`,
        culture: "Investiga la cultura de la empresa en su pagina de carreras y LinkedIn.",
        recentNews: [
          "Busca noticias recientes sobre la empresa en Google News",
          "Revisa sus publicaciones recientes en LinkedIn",
        ],
        tips: [
          "Menciona proyectos o iniciativas especificas de la empresa",
          "Demuestra que conoces sus productos o servicios",
          "Pregunta sobre la cultura del equipo",
        ],
      };
    }

    return {
      interviewId: interview.id,
      jobTitle: job.title,
      company: job.company,
      questions: questions.map((q) => ({
        question: q.question,
        category: q.category,
        sampleAnswer: q.sampleAnswer,
        tips: q.tips,
      })),
      companyResearch,
      generalTips,
      generatedAt: new Date(),
    };
  }

  async getUpcomingInterviews(userId: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.interview.findMany({
      where: {
        application: { userId },
        scheduledAt: {
          gte: now,
          lte: futureDate,
        },
        status: "SCHEDULED",
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        application: {
          select: {
            id: true,
            job: {
              select: {
                id: true,
                title: true,
                company: true,
              },
            },
          },
        },
      },
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getCVForSection(userId: string) {
    const cv = await this.prisma.userCV.findUnique({
      where: { userId },
    });

    if (!cv) {
      throw new NotFoundException("CV no encontrado. Crea uno primero.");
    }

    return cv;
  }

  private async verifySectionOwnership(
    userId: string,
    section: CVSectionType,
    itemId: string
  ) {
    const cv = await this.getCVForSection(userId);

    let item: unknown = null;

    switch (section) {
      case "education":
        item = await this.prisma.cVEducation.findUnique({
          where: { id: itemId },
        });
        break;
      case "experience":
        item = await this.prisma.cVExperience.findUnique({
          where: { id: itemId },
        });
        break;
      case "skills":
        item = await this.prisma.cVSkill.findUnique({
          where: { id: itemId },
        });
        break;
      case "projects":
        item = await this.prisma.cVProject.findUnique({
          where: { id: itemId },
        });
        break;
      case "certifications":
        item = await this.prisma.cVCertification.findUnique({
          where: { id: itemId },
        });
        break;
      case "languages":
        item = await this.prisma.cVLanguage.findUnique({
          where: { id: itemId },
        });
        break;
    }

    if (!item || (item as { cvId: string }).cvId !== cv.id) {
      throw new NotFoundException(`${section} no encontrado`);
    }

    return item;
  }

  private getGeneralTips(interviewType: string): string[] {
    const baseTips = [
      "Llega 5-10 minutos antes (o conectate a tiempo para entrevistas virtuales)",
      "Prepara ejemplos especificos de tu experiencia usando el metodo STAR",
      "Investiga sobre la empresa y el puesto antes de la entrevista",
      "Prepara preguntas para hacerle al entrevistador",
      "Viste de manera profesional y apropiada para la cultura de la empresa",
    ];

    const typeTips: Record<string, string[]> = {
      TECHNICAL: [
        "Repasa estructuras de datos y algoritmos comunes",
        "Practica coding problems en plataformas como LeetCode",
        "Piensa en voz alta mientras resuelves problemas",
        "No tengas miedo de pedir clarificaciones",
      ],
      PHONE: [
        "Asegurate de estar en un lugar silencioso",
        "Ten tu CV y la descripcion del puesto a mano",
        "Sonrie mientras hablas, se nota en tu voz",
      ],
      VIDEO: [
        "Prueba tu camara y microfono antes",
        "Asegurate de tener buena iluminacion",
        "Ten un fondo profesional o usa un virtual background",
        "Mira a la camara, no a la pantalla",
      ],
      IN_PERSON: [
        "Investiga como llegar con anticipacion",
        "Lleva copias extras de tu CV",
        "Saluda con un apreton de manos firme y contacto visual",
      ],
      HR: [
        "Prepara respuestas sobre tus expectativas salariales",
        "Ten claras tus motivaciones y objetivos profesionales",
        "Prepara preguntas sobre cultura y beneficios",
      ],
      FINAL: [
        "Repasa todas tus entrevistas anteriores",
        "Prepara preguntas estrategicas para los lideres",
        "Demuestra tu entusiasmo por el puesto",
      ],
    };

    return [...baseTips, ...(typeTips[interviewType] ?? [])];
  }
}
