import { assertEquals } from "@std/assert";
import { parseRuleset } from "./ruleset_parser.ts";

Deno.test("parseRuleset", () => {
  const input = `
# Comment
example.com/*
@@whitelist.com/*
@1 highlight.com/*
@2 warning.com/*
`;
  
  const ruleset = parseRuleset(input);
  
  assertEquals(ruleset.rules.length, 4);
  
  assertEquals(ruleset.rules[0], {
    type: "block",
    pattern: "example.com/*",
    lineNumber: 3,
  });
  
  assertEquals(ruleset.rules[1], {
    type: "allow",
    pattern: "whitelist.com/*",
    lineNumber: 4,
  });
  
  assertEquals(ruleset.rules[2], {
    type: "highlight",
    pattern: "highlight.com/*",
    lineNumber: 5,
    highlightColor: 1,
  });
  
  assertEquals(ruleset.rules[3], {
    type: "highlight",
    pattern: "warning.com/*",
    lineNumber: 6,
    highlightColor: 2,
  });
});