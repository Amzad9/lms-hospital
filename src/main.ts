import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import helmet from 'helmet';
import session from 'express-session';
import { createClient } from 'redis';
import { CatchEverythingFilter } from './exceptionfilter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Redis is optional — session store works in-memory if Redis is unavailable
  const redisClient = createClient({ url: process.env.REDIS_URL });
  try {
    await redisClient.connect();
    console.log('Redis PING:', await redisClient.ping());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[main] Redis unavailable — continuing without it. (${msg})`);
  }
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(
    session({
      secret: 'my-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60, // 1 hour
      },
    }),
  );
  app.use(helmet());
  
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new CatchEverythingFilter(httpAdapterHost));  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({transform: true}));
  await app.listen(process.env.PORT ?? 3000); 
}
bootstrap();
