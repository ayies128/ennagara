# ennagaraツール
- NestJSの環境を構築する
- デプロイはvercelで行えるように設定ファイルが必要なら用意する
- エンドポイントを用意して成形されたデータをtxtファイルでダウンロードができるようにする
  
# 出力
- QiitaのトレンドRSSフィードから上位20位の情報を取得
- RSSフィードのURLはhttps://qiita.com/popular-items/feed
- 出力は.txtを1ファイル出力
- 内容は2つ
  - 記事タイトルとURLの一覧（記事ごとに「タイトル改行URL」の2行を20件合計40行）
  - URLのみを20件羅列した一覧
  - この2つの間に改行を5行入れる
- タイトルはRSSで取得できるupdatedの日時で「YYYYMMDD_Qiitaトレンド.txt」
  
