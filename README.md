# deno-ublacklist-parser

A Deno library for parsing uBlacklist rules with zero dependencies.

## Features

- Full uBlacklist compatibility
- Zero dependencies
- TypeScript support

## Installation

```typescript
import { parseRuleset, match, isBlocked } from "jsr:@masinc/ublacklist-parser";
```

## Usage

### Basic Usage

```typescript
import { parseRuleset, isBlocked } from "jsr:@masinc/ublacklist-parser";

const ruleset = parseRuleset(`
# Block example.com
example.com/*

# Allow specific pages
@@example.com/allowed/*

# Highlight warnings
@1 warning.com/*

# Block with conditions
spam.com/* @if (title*="buy now")
`);

// Check if URL should be blocked
console.log(isBlocked(ruleset, "https://example.com/page")); // true
console.log(isBlocked(ruleset, "https://example.com/allowed/page")); // false
```

### Advanced Matching

```typescript
import { match } from "jsr:@masinc/ublacklist-parser";

const result = match(ruleset, {
  url: "https://spam.com/offer",
  title: "Buy now! Special offer!"
});

if (result) {
  console.log(result.action); // "block", "allow", or "highlight"
  console.log(result.rule.pattern); // "spam.com/*"
  console.log(result.rule.lineNumber); // 8
}
```

## Supported Rule Syntax

This library supports all uBlacklist rule types and advanced features. For detailed documentation on rule syntax, please refer to the official uBlacklist documentation:

**📖 [uBlacklist Advanced Features](https://ublacklist.github.io/docs/advanced-features)**

### Quick Examples

```
# Basic blocking
example.com/*

# Allow rules (whitelist)
@@example.com/allowed/*

# Highlight rules
@1 highlight.com/*

# Conditional expressions
spam.com/* @if (title*="buy now")
example.com/* @if (title*="spam" & host="example.com")

# Regex patterns
/example\.(com|org)/
```

## API Reference

### `parseRuleset(input: string): Ruleset`
Parses a ruleset string into a structured format.

### `match(ruleset: Ruleset, props: string | MatchProps): MatchResult | null`
Matches a URL against rules and returns the action to take.

### `isBlocked(ruleset: Ruleset, props: string | MatchProps): boolean`
Convenience function to check if a URL should be blocked.

### Types

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

## Development

### Running Tests
```bash
deno test
```

### Watch Mode
```bash
deno task dev
```

### Get Reference Repository (Optional)
```bash
deno task clone-ublacklist
```

## Acknowledgements

Based on [uBlacklist](https://github.com/iorate/ublacklist) by iorate.
- Base version: [v9.0.0](https://github.com/iorate/ublacklist/releases/tag/v9.0.0)

## License

MIT

This software includes code derived from uBlacklist, which is also licensed under the MIT License.
Copyright (c) 2018 iorate