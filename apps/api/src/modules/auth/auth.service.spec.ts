import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { UsersService } from "./users.service";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    password: "hashedPassword123",
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: "profile-123",
      userId: "user-123",
      firstName: "Juan",
      lastName: "Pérez",
      career: "Ingeniería",
      year: 2,
      university: "UBA",
      studyStyle: "BALANCED" as const,
      contentDepth: "INTERMEDIATE" as const,
      preferredLang: "es",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const registerDto = {
      email: "nuevo@example.com",
      password: "Password123",
      firstName: "María",
      lastName: "García",
      career: "Medicina",
      year: 1,
      university: "UNC",
    };

    it("should register a new user successfully", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      usersService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        profile: {
          ...mockUser.profile,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      });
      jwtService.sign.mockReturnValue("jwt-token");

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty("accessToken", "jwt-token");
      expect(result.user.email).toBe(registerDto.email);
    });

    it("should throw ConflictException if email already exists", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    const loginDto = {
      email: "test@example.com",
      password: "Password123",
    };

    it("should login successfully with valid credentials", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue("jwt-token");

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toHaveProperty("accessToken", "jwt-token");
      expect(result.user.email).toBe(loginDto.email);
    });

    it("should throw UnauthorizedException if user not found", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("validateUser", () => {
    it("should return user if found", async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser({
        sub: "user-123",
        email: "test@example.com",
      });

      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if user not found", async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.validateUser({ sub: "invalid", email: "test@example.com" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
