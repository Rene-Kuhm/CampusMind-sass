import { Module, Global, DynamicModule, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: RedisService,
          useFactory: (configService: ConfigService) => {
            const logger = new Logger('RedisModule');
            const redisUrl = configService.get<string>('REDIS_URL');
            const redisEnabled = configService.get<string>('REDIS_ENABLED', 'false') === 'true';

            if (!redisEnabled || !redisUrl) {
              logger.log('Redis disabled or not configured, using in-memory fallback');
              return new RedisService(null);
            }

            try {
              const Redis = require('ioredis');
              const client = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryDelayOnFailover: 100,
                lazyConnect: true,
              });

              client.on('connect', () => logger.log('Redis connected'));
              client.on('error', (err: Error) => logger.error('Redis error:', err));

              return new RedisService(client);
            } catch (error) {
              logger.error('Failed to create Redis client:', error);
              return new RedisService(null);
            }
          },
          inject: [ConfigService],
        },
      ],
      exports: [RedisService],
    };
  }
}
