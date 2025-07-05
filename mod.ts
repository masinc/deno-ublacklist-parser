// Re-export types
export type { MatchProps, MatchResult, Ruleset } from "./src/types.ts";

// Re-export functions
export { parseRuleset } from "./src/ruleset_parser.ts";
export { match, isBlocked } from "./src/matcher.ts";