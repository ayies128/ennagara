import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as xml2js from 'xml2js';

export interface QiitaTag {
  name: string;
}

export interface QiitaItem {
  title: string;
  link: string;
  updated: string;
  tags?: QiitaTag[];
}

export interface QiitaFeedData {
  items: QiitaItem[];
  feedUpdated: string;
  topTags?: { name: string; count: number }[];
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

  private extractItemId(url: string): string | null {
    const match = url.match(/\/items\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async fetchItemTags(itemId: string): Promise<QiitaTag[]> {
    try {
      const response = await axios.get(`https://qiita.com/api/v2/items/${itemId}`);
      return response.data.tags || [];
    } catch (error) {
      console.error(`Failed to fetch tags for item ${itemId}:`, error.message);
      return [];
    }
  }

  async fetchAllTags(items: QiitaItem[]): Promise<QiitaItem[]> {
    const itemsWithTags = await Promise.all(
      items.map(async (item) => {
        const itemId = this.extractItemId(item.link);
        if (itemId) {
          const tags = await this.fetchItemTags(itemId);
          return { ...item, tags };
        }
        return item;
      })
    );
    return itemsWithTags;
  }

  getTopTags(items: QiitaItem[], limit: number = 5): { name: string; count: number }[] {
    const tagCount: Map<string, number> = new Map();

    for (const item of items) {
      if (item.tags) {
        for (const tag of item.tags) {
          const current = tagCount.get(tag.name) || 0;
          tagCount.set(tag.name, current + 1);
        }
      }
    }

    return Array.from(tagCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private getNextDayDate(feedUpdated: string): { formatted: string; short: string } {
    let baseDate: Date;

    const dateMatch = feedUpdated.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      baseDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00+09:00`);
    } else {
      baseDate = new Date();
    }

    // 次の日に設定
    baseDate.setDate(baseDate.getDate() + 1);

    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');

    return {
      formatted: `${year}/${month}/${day}`,
      short: `${year.toString().slice(2)}.${month}.${day}`
    };
  }

  generateTxtContent(items: QiitaItem[], topTags?: { name: string; count: number }[], feedUpdated?: string): string {
    const nextDay = this.getNextDayDate(feedUpdated || '');
    const top5Tags = topTags?.slice(0, 5) || [];
    const top10Tags = topTags?.slice(0, 10) || [];

    // === NotebookLM用 ===
    const notebookLmSection = `# NotebookLM用
${items.map(item => item.link).join('\n')}`;

    // === Qiita用 ===
    const qiitaTagsText = top5Tags.map(tag => tag.name).join(' ');
    const qiitaArticles = items.map(item => `${item.title}\n${item.link}`).join('\n\n');
    const qiitaSection = `# Qiita用
${nextDay.formatted} 今日のQiitaトレンド記事をポッドキャストで聴こう！

${qiitaTagsText}

前日夜の最新トレンド記事のAIポッドキャストを毎日朝7時に更新しています。

通勤中などにながら聴きしよう！
（Qiita投稿は通勤には間に合わないと思われますが）
フィードバックとか助かりますのでください

↓こちらから

<iframe width="560" height="315" src="https://www.youtube.com/embed/XXXXXXXXXX" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" loading="lazy" allowfullscreen></iframe>

出典
${qiitaArticles}`;

    // === Youtube用 ===
    const youtubeHashtags = top10Tags.map(tag => `#${tag.name}`).join(' ');
    const youtubeSection = `# Youtube用
【${nextDay.short}】エンジニアのながらキャッチアップ 〜本日のQiitaトレンド〜

【Qiitaトレンドまとめ】毎日更新！通勤・退勤のお供にエンジニアニュースをながら聞き📻

本日のQiitaトレンドをAIでサクッとまとめ！
通勤時や退勤時など、ながら聞きで最新技術・話題をキャッチしよう💡
気になった記事は下記リンクから詳細へ✅

--- 本日のトレンド ---
${qiitaArticles}

--- 出典：Qiita ---

${youtubeHashtags} #Qiita #エンジニア #ポッドキャスト`;

    return `${notebookLmSection}\n\n\n\n${qiitaSection}\n\n\n\n${youtubeSection}`;
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