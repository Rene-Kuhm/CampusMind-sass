import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["info", "warn", "error"]
          : ["error"],
      // Neon serverless needs special handling
      datasourceUrl: process.env.DATABASE_URL,
    });

    // Add middleware to handle connection errors and retry
    // Neon serverless databases have "cold start" behavior - they suspend after inactivity
    // and can take 3-10 seconds to wake up. We need longer delays and more retries.
    this.$use(async (params, next) => {
      const maxRetries = 5;
      const baseDelay = 2000; // 2 seconds base delay for Neon cold start
      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await next(params);
        } catch (error) {
          lastError = error as Error;
          const isConnectionError =
            error instanceof Prisma.PrismaClientKnownRequestError ||
            (error instanceof Error &&
              (error.message.includes("Connection") ||
                error.message.includes("connection") ||
                error.message.includes("ECONNRESET") ||
                error.message.includes("Closed") ||
                error.message.includes("timeout") ||
                error.message.includes("Timeout")));

          if (isConnectionError && attempt < maxRetries) {
            const delay = baseDelay * attempt; // 2s, 4s, 6s, 8s
            this.logger.warn(
              `Database connection error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms... (Neon cold start handling)`,
            );
            // Force reconnect
            await this.$disconnect().catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, delay));
            await this.$connect().catch(() => {});
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log("Database connected successfully");
    } catch (error) {
      this.logger.error("Failed to connect to database", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.isConnected = false;
  }

  async ensureConnection() {
    if (!this.isConnected) {
      await this.$connect();
      this.isConnected = true;
    }
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("cleanDatabase is not allowed in production");
    }
    // Used for testing - truncate tables in correct order
    const models = Reflect.ownKeys(this).filter((key) => {
      const keyStr = typeof key === "string" ? key : key.toString();
      return keyStr[0] !== "_";
    });
    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this];
        if (model && typeof model === "object" && "deleteMany" in model) {
          return (model as { deleteMany: () => Promise<unknown> }).deleteMany();
        }
        return Promise.resolve();
      }),
    );
  }
}
