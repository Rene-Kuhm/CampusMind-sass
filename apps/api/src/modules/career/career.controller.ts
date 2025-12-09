import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { CareerService } from "./career.service";
import {
  // CV DTOs
  CreateCVDto,
  UpdateCVDto,
  // CV Section DTOs
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
  // Job DTOs
  JobFilterDto,
  // Application DTOs
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationFilterDto,
  ApplicationStatus,
  // Interview DTOs
  CreateInterviewDto,
  UpdateInterviewDto,
  InterviewFilterDto,
  InterviewPrepRequestDto,
  InterviewType,
  InterviewStatus,
} from "./dto";

@ApiTags("Career")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("career")
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  // ============================================
  // CV ENDPOINTS
  // ============================================

  @Get("cv")
  @ApiOperation({ summary: "Obtener CV del usuario" })
  @ApiResponse({ status: 200, description: "CV encontrado" })
  @ApiResponse({ status: 404, description: "CV no encontrado" })
  getCV(@CurrentUser() user: User) {
    return this.careerService.getCV(user.id);
  }

  @Post("cv")
  @ApiOperation({ summary: "Crear CV" })
  @ApiResponse({ status: 201, description: "CV creado exitosamente" })
  @ApiResponse({ status: 409, description: "Ya existe un CV" })
  createCV(@CurrentUser() user: User, @Body() dto: CreateCVDto) {
    return this.careerService.createCV(user.id, dto);
  }

  @Patch("cv")
  @ApiOperation({ summary: "Actualizar CV" })
  @ApiResponse({ status: 200, description: "CV actualizado" })
  @ApiResponse({ status: 404, description: "CV no encontrado" })
  updateCV(@CurrentUser() user: User, @Body() dto: UpdateCVDto) {
    return this.careerService.updateCV(user.id, dto);
  }

  @Delete("cv")
  @ApiOperation({ summary: "Eliminar CV completo" })
  @ApiResponse({ status: 200, description: "CV eliminado" })
  @ApiResponse({ status: 404, description: "CV no encontrado" })
  deleteCV(@CurrentUser() user: User) {
    return this.careerService.deleteCV(user.id);
  }

  // ============================================
  // CV EDUCATION ENDPOINTS
  // ============================================

  @Post("cv/education")
  @ApiOperation({ summary: "Agregar educacion al CV" })
  @ApiResponse({ status: 201, description: "Educacion agregada" })
  addEducation(@CurrentUser() user: User, @Body() dto: CreateEducationDto) {
    return this.careerService.addEducation(user.id, dto);
  }

  @Patch("cv/education/:id")
  @ApiOperation({ summary: "Actualizar educacion del CV" })
  @ApiParam({ name: "id", description: "ID de la educacion" })
  @ApiResponse({ status: 200, description: "Educacion actualizada" })
  @ApiResponse({ status: 404, description: "Educacion no encontrada" })
  updateEducation(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateEducationDto
  ) {
    return this.careerService.updateEducation(user.id, id, dto);
  }

  @Delete("cv/education/:id")
  @ApiOperation({ summary: "Eliminar educacion del CV" })
  @ApiParam({ name: "id", description: "ID de la educacion" })
  @ApiResponse({ status: 200, description: "Educacion eliminada" })
  @ApiResponse({ status: 404, description: "Educacion no encontrada" })
  deleteEducation(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.deleteEducation(user.id, id);
  }

  // ============================================
  // CV EXPERIENCE ENDPOINTS
  // ============================================

  @Post("cv/experience")
  @ApiOperation({ summary: "Agregar experiencia al CV" })
  @ApiResponse({ status: 201, description: "Experiencia agregada" })
  addExperience(@CurrentUser() user: User, @Body() dto: CreateExperienceDto) {
    return this.careerService.addExperience(user.id, dto);
  }

  @Patch("cv/experience/:id")
  @ApiOperation({ summary: "Actualizar experiencia del CV" })
  @ApiParam({ name: "id", description: "ID de la experiencia" })
  @ApiResponse({ status: 200, description: "Experiencia actualizada" })
  @ApiResponse({ status: 404, description: "Experiencia no encontrada" })
  updateExperience(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateExperienceDto
  ) {
    return this.careerService.updateExperience(user.id, id, dto);
  }

  @Delete("cv/experience/:id")
  @ApiOperation({ summary: "Eliminar experiencia del CV" })
  @ApiParam({ name: "id", description: "ID de la experiencia" })
  @ApiResponse({ status: 200, description: "Experiencia eliminada" })
  @ApiResponse({ status: 404, description: "Experiencia no encontrada" })
  deleteExperience(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.deleteExperience(user.id, id);
  }

  // ============================================
  // CV SKILLS ENDPOINTS
  // ============================================

  @Post("cv/skills")
  @ApiOperation({ summary: "Agregar skill al CV" })
  @ApiResponse({ status: 201, description: "Skill agregado" })
  addSkill(@CurrentUser() user: User, @Body() dto: CreateSkillDto) {
    return this.careerService.addSkill(user.id, dto);
  }

  @Patch("cv/skills/:id")
  @ApiOperation({ summary: "Actualizar skill del CV" })
  @ApiParam({ name: "id", description: "ID del skill" })
  @ApiResponse({ status: 200, description: "Skill actualizado" })
  @ApiResponse({ status: 404, description: "Skill no encontrado" })
  updateSkill(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateSkillDto
  ) {
    return this.careerService.updateSkill(user.id, id, dto);
  }

  @Delete("cv/skills/:id")
  @ApiOperation({ summary: "Eliminar skill del CV" })
  @ApiParam({ name: "id", description: "ID del skill" })
  @ApiResponse({ status: 200, description: "Skill eliminado" })
  @ApiResponse({ status: 404, description: "Skill no encontrado" })
  deleteSkill(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.deleteSkill(user.id, id);
  }

  // ============================================
  // CV PROJECTS ENDPOINTS
  // ============================================

  @Post("cv/projects")
  @ApiOperation({ summary: "Agregar proyecto al CV" })
  @ApiResponse({ status: 201, description: "Proyecto agregado" })
  addProject(@CurrentUser() user: User, @Body() dto: CreateProjectDto) {
    return this.careerService.addProject(user.id, dto);
  }

  @Patch("cv/projects/:id")
  @ApiOperation({ summary: "Actualizar proyecto del CV" })
  @ApiParam({ name: "id", description: "ID del proyecto" })
  @ApiResponse({ status: 200, description: "Proyecto actualizado" })
  @ApiResponse({ status: 404, description: "Proyecto no encontrado" })
  updateProject(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto
  ) {
    return this.careerService.updateProject(user.id, id, dto);
  }

  @Delete("cv/projects/:id")
  @ApiOperation({ summary: "Eliminar proyecto del CV" })
  @ApiParam({ name: "id", description: "ID del proyecto" })
  @ApiResponse({ status: 200, description: "Proyecto eliminado" })
  @ApiResponse({ status: 404, description: "Proyecto no encontrado" })
  deleteProject(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.deleteProject(user.id, id);
  }

  // ============================================
  // CV CERTIFICATIONS ENDPOINTS
  // ============================================

  @Post("cv/certifications")
  @ApiOperation({ summary: "Agregar certificacion al CV" })
  @ApiResponse({ status: 201, description: "Certificacion agregada" })
  addCertification(@CurrentUser() user: User, @Body() dto: CreateCertificationDto) {
    return this.careerService.addCertification(user.id, dto);
  }

  @Patch("cv/certifications/:id")
  @ApiOperation({ summary: "Actualizar certificacion del CV" })
  @ApiParam({ name: "id", description: "ID de la certificacion" })
  @ApiResponse({ status: 200, description: "Certificacion actualizada" })
  @ApiResponse({ status: 404, description: "Certificacion no encontrada" })
  updateCertification(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateCertificationDto
  ) {
    return this.careerService.updateCertification(user.id, id, dto);
  }

  @Delete("cv/certifications/:id")
  @ApiOperation({ summary: "Eliminar certificacion del CV" })
  @ApiParam({ name: "id", description: "ID de la certificacion" })
  @ApiResponse({ status: 200, description: "Certificacion eliminada" })
  @ApiResponse({ status: 404, description: "Certificacion no encontrada" })
  deleteCertification(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.deleteCertification(user.id, id);
  }

  // ============================================
  // CV LANGUAGES ENDPOINTS
  // ============================================

  @Post("cv/languages")
  @ApiOperation({ summary: "Agregar idioma al CV" })
  @ApiResponse({ status: 201, description: "Idioma agregado" })
  addLanguage(@CurrentUser() user: User, @Body() dto: CreateLanguageDto) {
    return this.careerService.addLanguage(user.id, dto);
  }

  @Patch("cv/languages/:id")
  @ApiOperation({ summary: "Actualizar idioma del CV" })
  @ApiParam({ name: "id", description: "ID del idioma" })
  @ApiResponse({ status: 200, description: "Idioma actualizado" })
  @ApiResponse({ status: 404, description: "Idioma no encontrado" })
  updateLanguage(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateLanguageDto
  ) {
    return this.careerService.updateLanguage(user.id, id, dto);
  }

  @Delete("cv/languages/:id")
  @ApiOperation({ summary: "Eliminar idioma del CV" })
  @ApiParam({ name: "id", description: "ID del idioma" })
  @ApiResponse({ status: 200, description: "Idioma eliminado" })
  @ApiResponse({ status: 404, description: "Idioma no encontrado" })
  deleteLanguage(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.deleteLanguage(user.id, id);
  }

  // ============================================
  // JOB LISTINGS ENDPOINTS
  // ============================================

  @Get("jobs")
  @ApiOperation({ summary: "Listar ofertas de trabajo con filtros" })
  @ApiQuery({ name: "search", required: false, description: "Buscar por titulo, empresa o descripcion" })
  @ApiQuery({ name: "type", required: false, enum: ["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE", "CONTRACT"] })
  @ApiQuery({ name: "location", required: false })
  @ApiQuery({ name: "isRemote", required: false, type: Boolean })
  @ApiQuery({ name: "career", required: false })
  @ApiQuery({ name: "minYear", required: false, type: Number })
  @ApiQuery({ name: "skills", required: false, type: [String] })
  @ApiQuery({ name: "salaryMin", required: false, type: Number })
  @ApiQuery({ name: "salaryMax", required: false, type: Number })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Lista de trabajos" })
  getJobs(@CurrentUser() user: User, @Query() filters: JobFilterDto) {
    return this.careerService.getJobs(user.id, filters);
  }

  @Get("jobs/:id")
  @ApiOperation({ summary: "Obtener detalle de un trabajo" })
  @ApiParam({ name: "id", description: "ID del trabajo" })
  @ApiResponse({ status: 200, description: "Detalle del trabajo" })
  @ApiResponse({ status: 404, description: "Trabajo no encontrado" })
  getJob(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.getJobById(id, user.id);
  }

  @Post("jobs/:id/apply")
  @ApiOperation({ summary: "Aplicar a un trabajo" })
  @ApiParam({ name: "id", description: "ID del trabajo" })
  @ApiResponse({ status: 201, description: "Aplicacion creada" })
  @ApiResponse({ status: 404, description: "Trabajo no encontrado" })
  @ApiResponse({ status: 400, description: "Trabajo no activo o expirado" })
  @ApiResponse({ status: 409, description: "Ya aplicaste a este trabajo" })
  applyToJob(
    @CurrentUser() user: User,
    @Param("id") jobId: string,
    @Body() dto: CreateApplicationDto
  ) {
    return this.careerService.applyToJob(user.id, jobId, dto);
  }

  // ============================================
  // APPLICATIONS ENDPOINTS
  // ============================================

  @Get("applications")
  @ApiOperation({ summary: "Listar aplicaciones del usuario" })
  @ApiQuery({ name: "status", required: false, enum: ApplicationStatus })
  @ApiResponse({ status: 200, description: "Lista de aplicaciones" })
  getApplications(@CurrentUser() user: User, @Query() filters: ApplicationFilterDto) {
    return this.careerService.getApplications(user.id, filters);
  }

  @Get("applications/stats")
  @ApiOperation({ summary: "Obtener estadisticas de aplicaciones" })
  @ApiResponse({ status: 200, description: "Estadisticas de aplicaciones" })
  getApplicationStats(@CurrentUser() user: User) {
    return this.careerService.getApplicationStats(user.id);
  }

  @Get("applications/:id")
  @ApiOperation({ summary: "Obtener detalle de una aplicacion" })
  @ApiParam({ name: "id", description: "ID de la aplicacion" })
  @ApiResponse({ status: 200, description: "Detalle de la aplicacion" })
  @ApiResponse({ status: 404, description: "Aplicacion no encontrada" })
  getApplication(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.getApplicationById(user.id, id);
  }

  @Patch("applications/:id")
  @ApiOperation({ summary: "Actualizar estado de aplicacion" })
  @ApiParam({ name: "id", description: "ID de la aplicacion" })
  @ApiResponse({ status: 200, description: "Aplicacion actualizada" })
  @ApiResponse({ status: 404, description: "Aplicacion no encontrada" })
  updateApplication(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateApplicationDto
  ) {
    return this.careerService.updateApplication(user.id, id, dto);
  }

  @Post("applications/:id/withdraw")
  @ApiOperation({ summary: "Retirar aplicacion" })
  @ApiParam({ name: "id", description: "ID de la aplicacion" })
  @ApiResponse({ status: 200, description: "Aplicacion retirada" })
  @ApiResponse({ status: 404, description: "Aplicacion no encontrada" })
  @ApiResponse({ status: 400, description: "Aplicacion ya retirada" })
  withdrawApplication(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.withdrawApplication(user.id, id);
  }

  // ============================================
  // INTERVIEWS ENDPOINTS
  // ============================================

  @Get("interviews")
  @ApiOperation({ summary: "Listar entrevistas del usuario" })
  @ApiQuery({ name: "status", required: false, enum: InterviewStatus })
  @ApiQuery({ name: "type", required: false, enum: InterviewType })
  @ApiQuery({ name: "from", required: false, description: "Fecha desde (ISO 8601)" })
  @ApiQuery({ name: "to", required: false, description: "Fecha hasta (ISO 8601)" })
  @ApiResponse({ status: 200, description: "Lista de entrevistas" })
  getInterviews(@CurrentUser() user: User, @Query() filters: InterviewFilterDto) {
    return this.careerService.getInterviews(user.id, filters);
  }

  @Get("interviews/upcoming")
  @ApiOperation({ summary: "Obtener entrevistas proximas" })
  @ApiQuery({ name: "days", required: false, type: Number, description: "Dias hacia adelante (default: 7)" })
  @ApiResponse({ status: 200, description: "Entrevistas proximas" })
  getUpcomingInterviews(
    @CurrentUser() user: User,
    @Query("days") days?: number
  ) {
    return this.careerService.getUpcomingInterviews(user.id, days ?? 7);
  }

  @Get("interviews/:id")
  @ApiOperation({ summary: "Obtener detalle de una entrevista" })
  @ApiParam({ name: "id", description: "ID de la entrevista" })
  @ApiResponse({ status: 200, description: "Detalle de la entrevista" })
  @ApiResponse({ status: 404, description: "Entrevista no encontrada" })
  getInterview(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.getInterviewById(user.id, id);
  }

  @Post("applications/:applicationId/interviews")
  @ApiOperation({ summary: "Crear entrevista para una aplicacion" })
  @ApiParam({ name: "applicationId", description: "ID de la aplicacion" })
  @ApiResponse({ status: 201, description: "Entrevista creada" })
  @ApiResponse({ status: 404, description: "Aplicacion no encontrada" })
  createInterview(
    @CurrentUser() user: User,
    @Param("applicationId") applicationId: string,
    @Body() dto: CreateInterviewDto
  ) {
    return this.careerService.createInterview(user.id, applicationId, dto);
  }

  @Patch("interviews/:id")
  @ApiOperation({ summary: "Actualizar entrevista" })
  @ApiParam({ name: "id", description: "ID de la entrevista" })
  @ApiResponse({ status: 200, description: "Entrevista actualizada" })
  @ApiResponse({ status: 404, description: "Entrevista no encontrada" })
  updateInterview(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateInterviewDto
  ) {
    return this.careerService.updateInterview(user.id, id, dto);
  }

  @Delete("interviews/:id")
  @ApiOperation({ summary: "Eliminar entrevista" })
  @ApiParam({ name: "id", description: "ID de la entrevista" })
  @ApiResponse({ status: 200, description: "Entrevista eliminada" })
  @ApiResponse({ status: 404, description: "Entrevista no encontrada" })
  deleteInterview(@CurrentUser() user: User, @Param("id") id: string) {
    return this.careerService.deleteInterview(user.id, id);
  }

  @Post("interviews/:id/prepare")
  @ApiOperation({ summary: "Obtener preparacion de entrevista con IA" })
  @ApiParam({ name: "id", description: "ID de la entrevista" })
  @ApiResponse({ status: 200, description: "Preparacion generada" })
  @ApiResponse({ status: 404, description: "Entrevista no encontrada" })
  getInterviewPrep(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: InterviewPrepRequestDto
  ) {
    return this.careerService.getInterviewPrep(user.id, id, dto);
  }
}
