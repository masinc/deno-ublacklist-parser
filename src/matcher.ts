import { matchesPattern } from "./pattern_matcher.ts";
import type { Expression } from "./expression_parser.ts";
import type { MatchProps, MatchResult, Ruleset } from "./types.ts";

/**
 * Evaluates an expression against match properties
 */
function evaluateExpression(expr: Expression, props: MatchProps): boolean {
  switch (expr.type) {
    case "comparison": {
      const value = props[expr.variable];
      if (value === undefined) return false;
      
      const targetValue = expr.value;
      const caseInsensitive = expr.operator.endsWith("i");
      const compareValue = caseInsensitive ? value.toLowerCase() : value;
      const compareTarget = caseInsensitive ? targetValue.toLowerCase() : targetValue;
      
      switch (expr.operator.replace("i", "")) {
        case "=":
          return compareValue === compareTarget;
        case "^=":
          return compareValue.startsWith(compareTarget);
        case "$=":
          return compareValue.endsWith(compareTarget);
        case "*=":
          return compareValue.includes(compareTarget);
        default:
          return false;
      }
    }
    
    case "regex": {
      const value = props[expr.variable];
      if (value === undefined) return false;
      try {
        return new RegExp(expr.pattern, expr.flags).test(value);
      } catch {
        return false;
      }
    }
    
    case "not":
      return !evaluateExpression(expr.expression, props);
    
    case "and":
      return evaluateExpression(expr.left, props) && evaluateExpression(expr.right, props);
    
    case "or":
      return evaluateExpression(expr.left, props) || evaluateExpression(expr.right, props);
  }
}

/**
 * Matches a URL against a ruleset and returns the action to take
 * 
 * @example
 * ```ts
 * const ruleset = parseRuleset(`
 *   example.com/*
 *   @@example.com/allowed/*
 *   spam.com/* @if (title*="buy now")
 * `);
 * 
 * match(ruleset, { url: "https://example.com/page" });
 * // { action: "block", rule: { type: "block", pattern: "example.com/*", lineNumber: 2 } }
 * 
 * match(ruleset, { url: "https://spam.com/", title: "Buy now! Special offer" });
 * // { action: "block", rule: { type: "block", pattern: "spam.com/*", lineNumber: 4 } }
 * ```
 */
export function match(ruleset: Ruleset, props: string | MatchProps): MatchResult | null {
  // Normalize input
  const matchProps: MatchProps = typeof props === "string" 
    ? { url: props } 
    : props;
  
  // Extract URL parts if not provided
  try {
    const urlObj = new URL(matchProps.url);
    if (!matchProps.scheme) matchProps.scheme = urlObj.protocol.slice(0, -1);
    if (!matchProps.host) matchProps.host = urlObj.hostname;
    if (!matchProps.path) matchProps.path = urlObj.pathname + urlObj.search;
  } catch {
    // Invalid URL, continue with what we have
  }

  let lastMatch: MatchResult | null = null;

  // Process rules in order, later rules override earlier ones
  for (const rule of ruleset.rules) {
    if (matchesPattern(rule.pattern, matchProps.url)) {
      // Check expression if present
      if (rule.expression && !evaluateExpression(rule.expression, matchProps)) {
        continue;
      }
      
      lastMatch = {
        action: rule.type === "allow" ? "allow" : rule.type,
        rule,
      };
    }
  }

  return lastMatch;
}

/**
 * Convenience function to check if a URL should be blocked
 * 
 * @example
 * ```ts
 * const ruleset = parseRuleset(`
 *   example.com/*
 *   @@example.com/allowed/*
 * `);
 * 
 * isBlocked(ruleset, "https://example.com/page"); // true
 * isBlocked(ruleset, "https://example.com/allowed/page"); // false
 * isBlocked(ruleset, "https://other.com/page"); // false
 * ```
 */
export function isBlocked(ruleset: Ruleset, props: string | MatchProps): boolean {
  const result = match(ruleset, props);
  return result?.action === "block";
}