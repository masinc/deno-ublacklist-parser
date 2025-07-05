import { assertEquals } from "@std/assert";
import { parseRuleset } from "./ruleset_parser.ts";
import { match, isBlocked } from "./matcher.ts";
import type { MatchProps } from "./types.ts";

Deno.test("match", () => {
  const ruleset = parseRuleset(`
example.com/*
@@example.com/allowed/*
@1 warning.com/*
`);
  
  // Test blocking
  const blockResult = match(ruleset, "https://example.com/page");
  assertEquals(blockResult?.action, "block");
  assertEquals(blockResult?.rule.pattern, "example.com/*");
  
  // Test allow (whitelist)
  const allowResult = match(ruleset, "https://example.com/allowed/page");
  assertEquals(allowResult?.action, "allow");
  assertEquals(allowResult?.rule.pattern, "example.com/allowed/*");
  
  // Test highlight
  const highlightResult = match(ruleset, "https://warning.com/page");
  assertEquals(highlightResult?.action, "highlight");
  assertEquals(highlightResult?.rule.highlightColor, 1);
  
  // Test no match
  const noMatch = match(ruleset, "https://other.com/page");
  assertEquals(noMatch, null);
});

Deno.test("isBlocked", () => {
  const ruleset = parseRuleset(`
example.com/*
@@example.com/allowed/*
@1 warning.com/*
`);
  
  assertEquals(isBlocked(ruleset, "https://example.com/page"), true);
  assertEquals(isBlocked(ruleset, "https://example.com/allowed/page"), false);
  assertEquals(isBlocked(ruleset, "https://warning.com/page"), false);
  assertEquals(isBlocked(ruleset, "https://other.com/page"), false);
});

Deno.test("rule precedence", () => {
  const ruleset = parseRuleset(`
*://*/*
@@example.com/*
example.com/specific/*
`);
  
  // General rule blocks everything
  assertEquals(isBlocked(ruleset, "https://random.com/page"), true);
  
  // Allow rule takes precedence
  assertEquals(isBlocked(ruleset, "https://example.com/page"), false);
  
  // Later rules override earlier ones
  assertEquals(isBlocked(ruleset, "https://example.com/specific/page"), true);
});

Deno.test("regex patterns", () => {
  const ruleset = parseRuleset(`
/example\\.(com|org)/
/^https:\\/\\/[^/]*\\.spam\\./
`);
  
  // Test regex matching
  assertEquals(isBlocked(ruleset, "https://example.com/page"), true);
  assertEquals(isBlocked(ruleset, "https://example.org/page"), true);
  assertEquals(isBlocked(ruleset, "https://example.net/page"), false);
  
  assertEquals(isBlocked(ruleset, "https://subdomain.spam.com/"), true);
  assertEquals(isBlocked(ruleset, "https://spam.com/"), false);
});

Deno.test("expression matching with @if", () => {
  const ruleset = parseRuleset(`
example.com/* @if (title="Spam Site")
example.com/* @if (title*="offer")
example.com/* @if (title^="Buy")
example.com/* @if (title$="now!")
`);
  
  const props: MatchProps = {
    url: "https://example.com/page",
    title: "Special offer"
  };
  
  // Test exact match
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "Spam Site" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "Not Spam" }), false);
  
  // Test contains
  assertEquals(isBlocked(ruleset, props), true);
  
  // Test starts with
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "Buy now!" }), true);
  
  // Test ends with
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "Act now!" }), true);
});

Deno.test("case insensitive operators", () => {
  const ruleset = parseRuleset(`
example.com/* @if (title=i"spam")
example.com/* @if (title*=i"OFFER")
`);
  
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "SPAM" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "Special Offer" }), true);
});

Deno.test("logical operators", () => {
  const ruleset = parseRuleset(`
example.com/* @if (title*="spam" & host="example.com")
example.com/* @if (title*="buy" | title*="free")
example.com/* @if (!(title*="legitimate"))
`);
  
  // Test AND
  assertEquals(isBlocked(ruleset, { 
    url: "https://example.com/", 
    title: "spam content",
    host: "example.com"
  }), true);
  
  assertEquals(isBlocked(ruleset, { 
    url: "https://other.com/", 
    title: "spam content"
  }), false);
  
  // Test OR
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "buy now" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "free stuff" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "normal content" }), true);
  
  // Test NOT
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "totally legitimate" }), false);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "not suspicious" }), true);
});

Deno.test("regex in expressions", () => {
  const ruleset = parseRuleset(`
*://*/* @if (title=~/spam|junk/i)
*://*/* @if (path=~/\\.(pdf|doc)$/)
`);
  
  // Test regex with flags
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "SPAM message" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/", title: "Junk mail" }), true);
  
  // Test path regex
  assertEquals(isBlocked(ruleset, { url: "https://example.com/file.pdf" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/file.doc" }), true);
  assertEquals(isBlocked(ruleset, { url: "https://example.com/file.txt" }), false);
});