import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { SubjectsService } from "./subjects.service";
import { PrismaService } from "@/database/prisma.service";

describe("SubjectsService", () => {
  let service: SubjectsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockSubject = {
    id: "subject-123",
    userId: "user-123",
    name: "Análisis Matemático I",
    description: "Cálculo diferencial e integral",
    career: "Ingeniería",
    year: 1,
    semester: "1",
    color: "#6366f1",
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    resources: [],
  };

  const mockPrismaSubject = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        {
          provide: PrismaService,
          useValue: {
            subject: mockPrismaSubject,
          },
        },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new subject", async () => {
      const createDto = {
        name: "Física I",
        description: "Mecánica clásica",
        career: "Ingeniería",
        year: 1,
      };

      mockPrismaSubject.create.mockResolvedValue({
        ...mockSubject,
        ...createDto,
      });

      const result = await service.create("user-123", createDto);

      expect(mockPrismaSubject.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          userId: "user-123",
        },
        include: { resources: true },
      });
      expect(result.name).toBe(createDto.name);
    });
  });

  describe("findAllByUser", () => {
    it("should return all non-archived subjects for user", async () => {
      mockPrismaSubject.findMany.mockResolvedValue([mockSubject]);

      const result = await service.findAllByUser("user-123");

      expect(mockPrismaSubject.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
          isArchived: false,
        },
        include: {
          _count: { select: { resources: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });

    it("should include archived subjects when requested", async () => {
      mockPrismaSubject.findMany.mockResolvedValue([
        mockSubject,
        { ...mockSubject, id: "subject-456", isArchived: true },
      ]);

      const result = await service.findAllByUser("user-123", true);

      expect(mockPrismaSubject.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: {
          _count: { select: { resources: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("findOne", () => {
    it("should return a subject by id and userId", async () => {
      mockPrismaSubject.findFirst.mockResolvedValue(mockSubject);

      const result = await service.findOne("subject-123", "user-123");

      expect(mockPrismaSubject.findFirst).toHaveBeenCalledWith({
        where: { id: "subject-123", userId: "user-123" },
        include: {
          resources: { orderBy: { createdAt: "desc" } },
        },
      });
      expect(result).toEqual(mockSubject);
    });

    it("should throw NotFoundException if subject not found", async () => {
      mockPrismaSubject.findFirst.mockResolvedValue(null);

      await expect(service.findOne("invalid-id", "user-123")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update a subject", async () => {
      const updateDto = { name: "Análisis Matemático II" };
      mockPrismaSubject.findFirst.mockResolvedValue(mockSubject);
      mockPrismaSubject.update.mockResolvedValue({
        ...mockSubject,
        ...updateDto,
      });

      const result = await service.update("subject-123", "user-123", updateDto);

      expect(result.name).toBe(updateDto.name);
    });

    it("should throw NotFoundException if subject not found", async () => {
      mockPrismaSubject.findFirst.mockResolvedValue(null);

      await expect(
        service.update("invalid-id", "user-123", { name: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("archive", () => {
    it("should archive a subject", async () => {
      mockPrismaSubject.findFirst.mockResolvedValue(mockSubject);
      mockPrismaSubject.update.mockResolvedValue({
        ...mockSubject,
        isArchived: true,
      });

      const result = await service.archive("subject-123", "user-123");

      expect(result.isArchived).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete a subject", async () => {
      mockPrismaSubject.findFirst.mockResolvedValue(mockSubject);
      mockPrismaSubject.delete.mockResolvedValue(mockSubject);

      await service.delete("subject-123", "user-123");

      expect(mockPrismaSubject.delete).toHaveBeenCalledWith({
        where: { id: "subject-123" },
      });
    });
  });
});
