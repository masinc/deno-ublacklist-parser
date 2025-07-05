# deno-ublacklist-parser

uBlacklistルールを解析するための、依存関係ゼロのDenoライブラリです。

## 特徴

- 完全なuBlacklist互換性
- 依存関係ゼロ
- TypeScript対応

## インストール

```typescript
import { parseRuleset, match, isBlocked } from "jsr:@masinc/ublacklist-parser";
```

## 使用方法

### 基本的な使用方法

```typescript
import { parseRuleset, isBlocked } from "jsr:@masinc/ublacklist-parser";

const ruleset = parseRuleset(`
# example.com をブロック
example.com/*

# 特定のページを許可
@@example.com/allowed/*

# 警告をハイライト
@1 warning.com/*

# 条件付きでブロック
spam.com/* @if (title*="今すぐ購入")
`);

// URLがブロックされるべきかチェック
console.log(isBlocked(ruleset, "https://example.com/page")); // true
console.log(isBlocked(ruleset, "https://example.com/allowed/page")); // false
```

### 高度なマッチング

```typescript
import { match } from "jsr:@masinc/ublacklist-parser";

const result = match(ruleset, {
  url: "https://spam.com/offer",
  title: "今すぐ購入！特別オファー！"
});

if (result) {
  console.log(result.action); // "block", "allow", または "highlight"
  console.log(result.rule.pattern); // "spam.com/*"
  console.log(result.rule.lineNumber); // 8
}
```

## サポートするルール記法

このライブラリは、uBlacklistの全てのルールタイプと高度な機能をサポートしています。ルール記法の詳細については、uBlacklist公式ドキュメントをご参照ください：

**📖 [uBlacklist 高度な機能](https://ublacklist.github.io/docs/advanced-features)**

### 簡単な例

```
# 基本的なブロック
example.com/*

# 許可ルール（ホワイトリスト）
@@example.com/allowed/*

# ハイライトルール
@1 highlight.com/*

# 条件式
spam.com/* @if (title*="今すぐ購入")
example.com/* @if (title*="スパム" & host="example.com")

# 正規表現パターン
/example\.(com|org)/
```

## API リファレンス

### `parseRuleset(input: string): Ruleset`
ルールセット文字列を構造化形式に解析します。

### `match(ruleset: Ruleset, props: string | MatchProps): MatchResult | null`
URLをルールと照合し、実行すべきアクションを返します。

### `isBlocked(ruleset: Ruleset, props: string | MatchProps): boolean`
URLがブロックされるべきかどうかをチェックする便利関数です。

### 型定義

```typescript
type MatchProps = {
  url: string;
  title?: string;
  scheme?: string;
  host?: string;
  path?: string;
  [key: string]: string | undefined;
};

type MatchResult = {
  action: "block" | "allow" | "highlight";
  rule: {
    type: "block" | "allow" | "highlight";
    pattern: string;
    lineNumber: number;
    highlightColor?: number;
  };
};
```

## 開発

### テストの実行
```bash
deno test
```

### ウォッチモード
```bash
deno task dev
```

### 参考リポジトリの取得（オプション）
```bash
deno task clone-ublacklist
```

## 謝辞

iorate氏の [uBlacklist](https://github.com/iorate/ublacklist) をベースにしています。

## ライセンス

MIT

このソフトウェアには、同じくMITライセンスの下で公開されているuBlacklistから派生したコードが含まれています。
Copyright (c) 2018 iorate