import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

async function createNestServer() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    await app.init();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const server = await createNestServer();
    return server.getHttpAdapter().getInstance()(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}