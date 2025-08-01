import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as xml2js from 'xml2js';

export interface QiitaItem {
  title: string;
  link: string;
  updated: string;
}

export interface QiitaFeedData {
  items: QiitaItem[];
  feedUpdated: string;
}

@Injectable()
export class QiitaService {
  private readonly rssUrl = 'https://qiita.com/popular-items/feed';

  async fetchTrendingData(): Promise<QiitaFeedData> {
    try {
      const response = await axios.get(this.rssUrl);
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      
      const items = (result.feed.entry || []).slice(0, 20).map((item: any) => ({
        title: item.title[0],
        link: this.cleanUrl(item.link[0].$.href),
        updated: item.updated[0]
      }));
      
      const feedUpdated = result.feed.updated[0];
      
      return { items, feedUpdated };
    } catch (error) {
      throw new Error(`Failed to fetch RSS feed: ${error.message}`);
    }
  }

  private cleanUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    } catch (error) {
      return url;
    }
  }

  generateTxtContent(items: QiitaItem[]): string {
    const headerText = `本日のQiitaのトレンドをAIでまとめています。
通勤時や退勤時などにながら聞きしてはいかがでしょうか？
気になった記事は下記リンクから詳細へ！

出典`;
    
    const titleAndUrlList = items.map(item => `${item.title}\n${item.link}`).join('\n');
    const urlOnlyList = items.map(item => item.link).join('\n');
    
    return `${headerText}\n${titleAndUrlList}\n\n\n\n\n\n${urlOnlyList}`;
  }

  generateFileName(feedUpdated: string): string {
    if (!feedUpdated) {
      return 'Qiitaトレンド.txt';
    }
    
    const updated = new Date(feedUpdated);
    const year = updated.getFullYear();
    const month = String(updated.getMonth() + 1).padStart(2, '0');
    const day = String(updated.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}_Qiitaトレンド.txt`;
  }
}