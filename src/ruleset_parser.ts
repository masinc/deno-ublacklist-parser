import { parseExpression } from "./expression_parser.ts";
import type { Ruleset, Rule, RuleType } from "./types.ts";

/**
 * Parses a ruleset string into a structured format
 * 
 * @example
 * ```ts
 * const ruleset = parseRuleset(`
 *   example.com/*
 *   @@whitelist.com/*
 *   @1 highlight.com/*
 *   # This is a comment
 * `);
 * 
 * console.log(ruleset.rules);
 * // [
 * //   { type: "block", pattern: "example.com/*", lineNumber: 2 },
 * //   { type: "allow", pattern: "whitelist.com/*", lineNumber: 3 },
 * //   { type: "highlight", pattern: "highlight.com/*", lineNumber: 4, highlightColor: 1 }
 * // ]
 * ```
 */
export function parseRuleset(input: string): Ruleset {
  const lines = input.split("\n");
  const rules: Rule[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const lineNumber = i + 1;
    let type: RuleType = "block";
    let pattern = line;
    let highlightColor: number | undefined;
    let expression = undefined;

    // Parse rule type prefix
    if (line.startsWith("@@")) {
      type = "allow";
      pattern = line.slice(2).trim();
    } else if (line.startsWith("@")) {
      const match = line.match(/^@(\d+)\s+(.+)$/);
      if (match) {
        type = "highlight";
        highlightColor = Number(match[1]);
        pattern = match[2].trim();
      }
    }

    // Check for @if expression
    const ifIndex = pattern.indexOf(" @if ");
    if (ifIndex >= 0) {
      const afterIf = pattern.slice(ifIndex + 5).trim();
      if (afterIf.startsWith("(") && afterIf.endsWith(")")) {
        pattern = pattern.slice(0, ifIndex).trim();
        expression = parseExpression(afterIf.slice(1, -1).trim());
      }
    }

    rules.push({
      type,
      pattern,
      lineNumber,
      ...(highlightColor !== undefined && { highlightColor }),
      ...(expression && { expression }),
    });
  }

  return { rules, lines };
}