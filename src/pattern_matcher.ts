/**
 * Tests if a URL matches a pattern
 * 
 * @example
 * ```ts
 * matchesPattern("example.com/*", "https://example.com/page"); // true
 * matchesPattern("*.example.com/*", "https://sub.example.com/page"); // true
 * matchesPattern("example.com/path/*", "https://example.com/other"); // false
 * matchesPattern("/example\\.(com|org)/", "https://example.com/page"); // true (regex)
 * ```
 */
export function matchesPattern(pattern: string, url: string): boolean {
  if (pattern === "*://*/*" || pattern === "<all_urls>") return true;

  // Check if pattern is a regex (starts and ends with /)
  if (pattern.startsWith("/") && pattern.includes("/", 1)) {
    const lastSlash = pattern.lastIndexOf("/");
    const regexPattern = pattern.slice(1, lastSlash);
    const flags = pattern.slice(lastSlash + 1);
    try {
      return new RegExp(regexPattern, flags).test(url);
    } catch {
      return false;
    }
  }

  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname;
    const pathname = urlObj.pathname;
    const fullPath = host + pathname + urlObj.search;

    // Normalize the pattern by converting unicode domains to punycode
    let normalizedPattern = pattern;
    
    // If pattern contains unicode characters, normalize it through URL parsing
    // deno-lint-ignore no-control-regex
    if (pattern !== pattern.replace(/[^\x00-\x7F]/g, "")) {
      try {
        const testUrl = pattern.includes("://") 
          ? pattern.replace(/\*/g, "test")
          : "https://" + pattern.replace(/\*/g, "test");
        const testUrlObj = new URL(testUrl);
        
        // Reconstruct the pattern with the normalized (punycode) hostname
        if (pattern.includes("://")) {
          const [scheme, rest] = pattern.split("://");
          const pathPart = rest.replace(/^[^/]*/, ""); // Extract path part
          normalizedPattern = scheme + "://" + testUrlObj.hostname + pathPart.replace(/test/g, "*");
        } else {
          const pathPart = pattern.replace(/^[^/]*/, ""); // Extract path part after domain
          normalizedPattern = testUrlObj.hostname + pathPart.replace(/test/g, "*");
        }
      } catch {
        // If normalization fails, use original pattern
      }
    }

    // Convert pattern to regex
    let regexPattern = normalizedPattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special chars except *
      .replace(/\*/g, ".*"); // Replace * with .*

    // Handle scheme patterns
    if (normalizedPattern.includes("://")) {
      const [scheme, rest] = normalizedPattern.split("://");
      const urlScheme = urlObj.protocol.slice(0, -1); // Remove trailing :
      
      if (scheme !== "*" && scheme !== urlScheme) {
        return false;
      }
      
      regexPattern = rest
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
    }

    return new RegExp(`^${regexPattern}$`).test(fullPath);
  } catch {
    // Simple fallback for non-URL patterns
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    return new RegExp(regexPattern).test(url);
  }
}