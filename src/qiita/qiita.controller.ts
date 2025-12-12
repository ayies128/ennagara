import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { QiitaService } from './qiita.service';

@Controller('qiita')
export class QiitaController {
  constructor(private readonly qiitaService: QiitaService) {}

  @Get('trend')
  async downloadTrend(@Res() res: Response) {
    try {
      const { items, feedUpdated } = await this.qiitaService.fetchTrendingData();
      const itemsWithTags = await this.qiitaService.fetchAllTags(items);
      const topTags = this.qiitaService.getTopTags(itemsWithTags, 10);
      const content = this.qiitaService.generateTxtContent(itemsWithTags, topTags, feedUpdated);
      const fileName = this.qiitaService.generateFileName(feedUpdated);

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}