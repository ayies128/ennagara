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
    const headerText = `【Qiitaトレンドまとめ】毎日更新！通勤・退勤のお供にエンジニアニュースをながら聞き📻

本日のQiitaトレンドをAIでサクッとまとめ！
通勤時や退勤時など、ながら聞きで最新技術・話題をキャッチしよう💡
気になった記事は下記リンクから詳細へ✅

--- 本日のトレンド ---`;
    
    const titleAndUrlList = items.map(item => `${item.title}\n${item.link}`).join('\n\n');
    const footer = `--- 出典：Qiita ---

#初心者 #ChatGPT #生成AI #AI #AWS #Python #JavaScript #Qiita #エンジニアニュース #ポッドキャスト`;
    const urlOnlyList = items.map(item => item.link).join('\n');
    
    return `${headerText}\n${titleAndUrlList}\n\n${footer}\n\n\n\n\n\n${urlOnlyList}`;
  }

  generateFileName(feedUpdated: string): string {
    if (!feedUpdated) {
      return 'Qiitaトレンド.txt';
    }
    
    console.log('feedUpdated input:', feedUpdated);
    
    // 複数の方法で日付抽出を試行
    
    // 方法1: ISO 8601形式の日付文字列から日付部分を直接抽出
    const dateMatch = feedUpdated.match(/^(\d{4})-(\d{2})-(\d{2})/);
    console.log('dateMatch result:', dateMatch);
    
    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      const filename = `${year}${month}${day}_Qiitaトレンド.txt`;
      console.log('Generated filename (regex):', filename);
      return filename;
    }
    
    // 方法2: substring で日付部分を直接切り出し
    if (feedUpdated.length >= 10 && feedUpdated.charAt(4) === '-' && feedUpdated.charAt(7) === '-') {
      const datePart = feedUpdated.substring(0, 10); // "2025-08-01"
      const filename = `${datePart.replace(/-/g, '')}_Qiitaトレンド.txt`;
      console.log('Generated filename (substring):', filename);
      return filename;
    }
    
    // 方法3: フォールバック - JSTタイムゾーンを考慮してDateオブジェクトを使用
    console.log('Using Date fallback with timezone correction');
    const updated = new Date(feedUpdated);
    console.log('Original parsed date:', updated);
    console.log('UTC ISO string:', updated.toISOString());
    
    // JSTに強制変換 (UTC+9)
    const jstTime = new Date(updated.getTime() + (9 * 60 * 60 * 1000));
    console.log('JST corrected time:', jstTime);
    
    const year = jstTime.getUTCFullYear();
    const month = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jstTime.getUTCDate()).padStart(2, '0');
    
    const filename = `${year}${month}${day}_Qiitaトレンド.txt`;
    console.log('Generated filename (Date with JST):', filename);
    
    return filename;
  }
}