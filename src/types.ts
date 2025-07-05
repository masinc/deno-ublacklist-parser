import type { Expression } from "./expression_parser.ts";

/**
 * Properties for matching against rules
 */
export type MatchProps = {
  url: string;
  title?: string;
  scheme?: string;
  host?: string;
  path?: string;
  [key: string]: string | undefined;
};

/**
 * Result of matching a URL against rules
 */
export type MatchResult = {
  action: "block" | "allow" | "highlight";
  rule: {
    type: "block" | "allow" | "highlight";
    pattern: string;
    lineNumber: number;
    highlightColor?: number;
  };
};

/**
 * Parsed ruleset containing all rules
 */
export type Ruleset = {
  rules: Array<{
    type: "block" | "allow" | "highlight";
    pattern: string;
    lineNumber: number;
    highlightColor?: number;
    expression?: Expression;
  }>;
  lines: string[];
};

// Internal types (not exported)
export type RuleType = "block" | "allow" | "highlight";

export type Rule = {
  type: RuleType;
  pattern: string;
  lineNumber: number;
  highlightColor?: number;
  expression?: Expression;
};