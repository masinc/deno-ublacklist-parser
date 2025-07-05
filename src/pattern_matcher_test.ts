import { assertEquals } from "@std/assert";
import { matchesPattern } from "./pattern_matcher.ts";

Deno.test("matchesPattern - basic patterns", () => {
  // Basic hostname matching
  assertEquals(matchesPattern("example.com/*", "https://example.com/page"), true);
  assertEquals(matchesPattern("example.com/*", "https://example.com/"), true);
  assertEquals(matchesPattern("example.com/*", "https://other.com/page"), false);
  
  // Different schemes
  assertEquals(matchesPattern("example.com/*", "http://example.com/page"), true);
  assertEquals(matchesPattern("https://example.com/*", "https://example.com/page"), true);
  assertEquals(matchesPattern("https://example.com/*", "http://example.com/page"), false);
});

Deno.test("matchesPattern - wildcard patterns", () => {
  // Subdomain wildcards
  assertEquals(matchesPattern("*.example.com/*", "https://sub.example.com/page"), true);
  assertEquals(matchesPattern("*.example.com/*", "https://deep.sub.example.com/page"), true);
  assertEquals(matchesPattern("*.example.com/*", "https://example.com/page"), false);
  
  // General wildcards
  assertEquals(matchesPattern("*example.com/*", "https://subexample.com/page"), true);
  assertEquals(matchesPattern("*example.com/*", "https://testexample.com/page"), true);
  assertEquals(matchesPattern("*example.com/*", "https://other.com/page"), false);
  
  // Path wildcards
  assertEquals(matchesPattern("example.com/test*", "https://example.com/testing"), true);
  assertEquals(matchesPattern("example.com/test*", "https://example.com/test/path"), true);
  assertEquals(matchesPattern("example.com/test*", "https://example.com/other"), false);
});

Deno.test("matchesPattern - path patterns", () => {
  // Specific path matching
  assertEquals(matchesPattern("example.com/path/*", "https://example.com/path/page"), true);
  assertEquals(matchesPattern("example.com/path/*", "https://example.com/path/sub/page"), true);
  assertEquals(matchesPattern("example.com/path/*", "https://example.com/other/page"), false);
  
  // Exact path matching
  assertEquals(matchesPattern("example.com/exact", "https://example.com/exact"), true);
  assertEquals(matchesPattern("example.com/exact", "https://example.com/exact/more"), false);
  
  // Path with query parameters
  assertEquals(matchesPattern("example.com/search*", "https://example.com/search?q=test"), true);
});

Deno.test("matchesPattern - scheme patterns", () => {
  // Scheme-specific patterns
  assertEquals(matchesPattern("https://example.com/*", "https://example.com/page"), true);
  assertEquals(matchesPattern("https://example.com/*", "http://example.com/page"), false);
  
  // Wildcard scheme
  assertEquals(matchesPattern("*://example.com/*", "https://example.com/page"), true);
  assertEquals(matchesPattern("*://example.com/*", "http://example.com/page"), true);
  assertEquals(matchesPattern("*://example.com/*", "ftp://example.com/page"), true); // fallback matching works
});

Deno.test("matchesPattern - special patterns", () => {
  // All URLs pattern
  assertEquals(matchesPattern("<all_urls>", "https://any.site.com/page"), true);
  assertEquals(matchesPattern("<all_urls>", "http://another.site.org/test"), true);
  
  // Universal wildcard
  assertEquals(matchesPattern("*://*/*", "https://any.site.com/page"), true);
  assertEquals(matchesPattern("*://*/*", "http://test.example.org/path"), true);
});

Deno.test("matchesPattern - regex patterns", () => {
  // Basic regex patterns
  assertEquals(matchesPattern("/example\\.(com|org)/", "https://example.com/page"), true);
  assertEquals(matchesPattern("/example\\.(com|org)/", "https://example.org/page"), true);
  assertEquals(matchesPattern("/example\\.(com|org)/", "https://example.net/page"), false);
  
  // Regex with flags
  assertEquals(matchesPattern("/EXAMPLE\\.COM/i", "https://example.com/page"), true);
  assertEquals(matchesPattern("/EXAMPLE\\.COM/", "https://example.com/page"), false);
  
  // Complex regex patterns
  assertEquals(matchesPattern("/^https:\\/\\/[^/]*\\.spam\\./", "https://subdomain.spam.com/"), true);
  assertEquals(matchesPattern("/^https:\\/\\/[^/]*\\.spam\\./", "https://spam.com/"), false);
  assertEquals(matchesPattern("/^https:\\/\\/[^/]*\\.spam\\./", "https://test.spam.net/"), true);
  
  // Character classes
  assertEquals(matchesPattern("/[0-9]+\\.example\\.com/", "https://123.example.com/page"), true);
  assertEquals(matchesPattern("/[0-9]+\\.example\\.com/", "https://abc.example.com/page"), false);
});

Deno.test("matchesPattern - edge cases", () => {
  // Empty or invalid patterns
  assertEquals(matchesPattern("", "https://example.com/"), false);
  
  // Invalid URLs (should handle gracefully with fallback regex matching)
  assertEquals(matchesPattern("example.com/*", "not-a-url"), false); // fallback regex doesn't match
  assertEquals(matchesPattern("*not-a-url*", "not-a-url"), true); // but wildcard does
  
  // Malformed regex (should not crash)
  assertEquals(matchesPattern("/[invalid/", "https://example.com/"), false);
  assertEquals(matchesPattern("/(/", "https://example.com/"), false);
});

Deno.test("matchesPattern - complex real-world patterns", () => {
  // Social media patterns
  assertEquals(matchesPattern("*.facebook.com/*", "https://www.facebook.com/profile"), true);
  assertEquals(matchesPattern("*.facebook.com/*", "https://m.facebook.com/page"), true);
  assertEquals(matchesPattern("*.facebook.com/*", "https://facebook.com/page"), false);
  
  // CDN patterns
  assertEquals(matchesPattern("cdn*.example.com/*", "https://cdn1.example.com/assets/script.js"), true);
  assertEquals(matchesPattern("cdn*.example.com/*", "https://cdn-west.example.com/style.css"), true);
  assertEquals(matchesPattern("cdn*.example.com/*", "https://api.example.com/data"), false);
  
  // API endpoints
  assertEquals(matchesPattern("api.example.com/v*/users/*", "https://api.example.com/v1/users/123"), true);
  assertEquals(matchesPattern("api.example.com/v*/users/*", "https://api.example.com/v2/users/456/posts"), true);
  assertEquals(matchesPattern("api.example.com/v*/users/*", "https://api.example.com/v1/posts/123"), false);
});

Deno.test("matchesPattern - query parameters and fragments", () => {
  // Query parameters
  assertEquals(matchesPattern("example.com/search*", "https://example.com/search?q=test&page=1"), true);
  assertEquals(matchesPattern("example.com/search?q=*", "https://example.com/search?q=test"), true);
  
  // With fragments (fragments are not included in URL pathname)
  assertEquals(matchesPattern("example.com/page*", "https://example.com/page#section"), true);
  
  // Specific query matching
  assertEquals(matchesPattern("example.com/search?type=image*", "https://example.com/search?type=image&q=cat"), true);
  assertEquals(matchesPattern("example.com/search?type=image*", "https://example.com/search?type=video&q=cat"), false);
});

Deno.test("matchesPattern - unicode and special characters", () => {
  // Unicode domains (should work with punycode)
  assertEquals(matchesPattern("例え.テスト/*", "https://例え.テスト/page"), true);
  
  // Special characters in paths
  assertEquals(matchesPattern("example.com/path with spaces/*", "https://example.com/path%20with%20spaces/file"), false); // URL encoding
  assertEquals(matchesPattern("example.com/path*", "https://example.com/path%20with%20spaces"), true); // wildcard matches encoded
  
  // Percent-encoded patterns
  assertEquals(matchesPattern("example.com/*test*", "https://example.com/some%20test%20file"), true);
});