import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { QiitaService } from './qiita.service';

@Controller('qiita')
export class QiitaController {
  constructor(private readonly qiitaService: QiitaService) {}

  @Get('trend')
  async downloadTrend(@Res() res: Response) {
    try {
      const items = await this.qiitaService.fetchTrendingItems();
      const content = this.qiitaService.generateTxtContent(items);
      const fileName = this.qiitaService.generateFileName(items);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}