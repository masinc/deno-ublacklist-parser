import { assertEquals } from "@std/assert";
import { parseRuleset, match, isBlocked } from "./mod.ts";
import { matchesPattern } from "./src/pattern_matcher.ts";

Deno.test("integration - basic functionality", () => {
  const ruleset = parseRuleset(`
# Comment
example.com/*
@@example.com/allowed/*
@1 highlight.com/*
`);
  
  // Test parsing
  assertEquals(ruleset.rules.length, 3);
  assertEquals(ruleset.rules[0].type, "block");
  assertEquals(ruleset.rules[1].type, "allow");
  assertEquals(ruleset.rules[2].type, "highlight");
  
  // Test matching
  assertEquals(isBlocked(ruleset, "https://example.com/page"), true);
  assertEquals(isBlocked(ruleset, "https://example.com/allowed/page"), false);
  assertEquals(isBlocked(ruleset, "https://other.com/page"), false);
  
  const result = match(ruleset, "https://highlight.com/page");
  assertEquals(result?.action, "highlight");
  assertEquals(result?.rule.highlightColor, 1);
});

Deno.test("integration - pattern matching", () => {
  // Test basic pattern matching functionality
  assertEquals(matchesPattern("example.com/*", "https://example.com/page"), true);
  assertEquals(matchesPattern("*.example.com/*", "https://sub.example.com/page"), true);
  assertEquals(matchesPattern("example.com/*", "https://other.com/page"), false);
  
  // Test special patterns
  assertEquals(matchesPattern("<all_urls>", "https://any.site.com/page"), true);
  assertEquals(matchesPattern("*://*/*", "https://any.site.com/page"), true);
});

Deno.test("integration - expressions", () => {
  const ruleset = parseRuleset(`
example.com/* @if (title*="spam")
example.com/* @if (title*="buy" | title*="free")
`);
  
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "spam content" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "buy now" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "normal content" }), false);
});