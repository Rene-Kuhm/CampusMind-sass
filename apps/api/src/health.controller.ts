import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  service: string;
  checks: {
    [key: string]: {
      status: "up" | "down";
      responseTime?: number;
      message?: string;
    };
  };
}

interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  checks: {
    [key: string]: boolean;
  };
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  private readonly startTime = Date.now();

  /**
   * Main health check endpoint
   */
  @Get()
  @ApiOperation({ summary: "Comprehensive health check endpoint" })
  @ApiResponse({ status: 200, description: "API health status" })
  check(): HealthStatus {
    const checks: HealthStatus["checks"] = {};

    // Memory check
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100;

    checks["memory"] = {
      status: memoryUsagePercent < 90 ? "up" : "down",
      message: `${heapUsedMB.toFixed(2)}MB / ${heapTotalMB.toFixed(2)}MB (${memoryUsagePercent.toFixed(1)}%)`,
    };

    // Event loop check
    const eventLoopLag = this.measureEventLoopLag();
    checks["eventLoop"] = {
      status: eventLoopLag < 100 ? "up" : "down",
      responseTime: eventLoopLag,
      message: `${eventLoopLag.toFixed(2)}ms lag`,
    };

    // Determine overall status
    const allChecksUp = Object.values(checks).every((c) => c.status === "up");
    const someChecksUp = Object.values(checks).some((c) => c.status === "up");

    let status: HealthStatus["status"] = "healthy";
    if (!allChecksUp && someChecksUp) {
      status = "degraded";
    } else if (!someChecksUp) {
      status = "unhealthy";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || "0.1.0",
      service: "campusmind-api",
      checks,
    };
  }

  /**
   * Liveness probe - Simple alive check
   */
  @Get("live")
  @ApiOperation({ summary: "Liveness probe for Kubernetes" })
  @ApiResponse({ status: 200, description: "API is alive" })
  getLiveness(): { status: string; timestamp: string } {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe - Check if app is ready to receive traffic
   */
  @Get("ready")
  @ApiOperation({ summary: "Readiness probe for load balancers" })
  @ApiResponse({ status: 200, description: "API readiness status" })
  getReadiness(): ReadinessStatus {
    const checks: ReadinessStatus["checks"] = {};

    // API check
    checks["api"] = true;

    // Memory check (must have enough memory)
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    checks["memory"] = heapUsedMB / heapTotalMB < 0.95;

    // Event loop check (must be responsive)
    const eventLoopLag = this.measureEventLoopLag();
    checks["eventLoop"] = eventLoopLag < 200;

    const ready = Object.values(checks).every(Boolean);

    return {
      ready,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /**
   * Detailed metrics endpoint
   */
  @Get("metrics")
  @ApiOperation({ summary: "Detailed system metrics" })
  @ApiResponse({ status: 200, description: "System metrics" })
  getMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      eventLoop: {
        lag: this.measureEventLoopLag(),
      },
    };
  }

  /**
   * Startup probe
   */
  @Get("startup")
  @ApiOperation({ summary: "Startup probe" })
  @ApiResponse({ status: 200, description: "Startup status" })
  getStartup(): { started: boolean; timestamp: string; startupTime: number } {
    return {
      started: true,
      timestamp: new Date().toISOString(),
      startupTime: this.startTime,
    };
  }

  /**
   * Measure event loop lag
   */
  private measureEventLoopLag(): number {
    const start = process.hrtime.bigint();
    const iterations = 1000;
    let sum = 0;
    for (let i = 0; i < iterations; i++) {
      sum += i;
    }
    if (sum < 0) console.log("never"); // Prevent optimization removal
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000;
  }
}
