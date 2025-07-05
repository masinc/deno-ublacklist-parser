// Simple expression parser based on uBlacklist grammar

export type ExpressionOperator = "=" | "^=" | "$=" | "*=" | "=i" | "^=i" | "$=i" | "*=i" | "=~";

export type Expression = 
  | { type: "comparison"; variable: string; operator: ExpressionOperator; value: string }
  | { type: "regex"; variable: string; pattern: string; flags?: string }
  | { type: "not"; expression: Expression }
  | { type: "and"; left: Expression; right: Expression }
  | { type: "or"; left: Expression; right: Expression };

// Tokenizer
type TokenType = "IDENTIFIER" | "STRING" | "REGEX" | "OPERATOR" | "LPAREN" | "RPAREN" | "NOT" | "AND" | "OR" | "EOF";

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

class Tokenizer {
  private input: string;
  position: number = 0;

  constructor(input: string) {
    this.input = input;
  }

  private peek(): string {
    return this.input[this.position] || "";
  }

  private advance(): string {
    return this.input[this.position++] || "";
  }

  private skipWhitespace() {
    while (/\s/.test(this.peek())) {
      this.advance();
    }
  }

  nextToken(): Token {
    this.skipWhitespace();

    const start = this.position;

    if (this.position >= this.input.length) {
      return { type: "EOF", value: "", position: start };
    }

    // Check for operators first
    if (this.peek() === "(") {
      this.advance();
      return { type: "LPAREN", value: "(", position: start };
    }

    if (this.peek() === ")") {
      this.advance();
      return { type: "RPAREN", value: ")", position: start };
    }

    if (this.peek() === "!") {
      this.advance();
      return { type: "NOT", value: "!", position: start };
    }

    if (this.peek() === "&") {
      this.advance();
      return { type: "AND", value: "&", position: start };
    }

    if (this.peek() === "|") {
      this.advance();
      return { type: "OR", value: "|", position: start };
    }

    // String literals
    if (this.peek() === '"' || this.peek() === "'") {
      const quote = this.advance();
      let value = "";
      while (this.peek() && this.peek() !== quote) {
        if (this.peek() === "\\") {
          this.advance();
          if (this.peek()) {
            value += this.advance();
          }
        } else {
          value += this.advance();
        }
      }
      if (this.peek() === quote) {
        this.advance();
      }
      return { type: "STRING", value, position: start };
    }

    // Regex literals
    if (this.peek() === "/") {
      this.advance();
      let pattern = "";
      while (this.peek() && this.peek() !== "/") {
        if (this.peek() === "\\") {
          pattern += this.advance();
          if (this.peek()) {
            pattern += this.advance();
          }
        } else {
          pattern += this.advance();
        }
      }
      if (this.peek() === "/") {
        this.advance();
      }
      // Collect flags
      let flags = "";
      while (/[imsu]/.test(this.peek())) {
        flags += this.advance();
      }
      return { type: "REGEX", value: pattern + (flags ? `/${flags}` : ""), position: start };
    }

    // Identifiers
    if (/[a-zA-Z_$]/.test(this.peek())) {
      let value = "";
      while (/[a-zA-Z0-9_]/.test(this.peek())) {
        value += this.advance();
      }

      this.skipWhitespace();

      // Check for operators after identifier
      let operator = "";
      
      // Check for compound operators first
      if ((this.peek() === "^" || this.peek() === "$" || this.peek() === "*") && this.input[this.position + 1] === "=") {
        operator += this.advance() + this.advance();
        if (/[iI]/.test(this.peek())) {
          operator += this.advance();
        }
      } else if (this.peek() === "=") {
        operator += this.advance();
        if (this.peek() === "~") {
          operator += this.advance();
        } else if (/[iI]/.test(this.peek())) {
          operator += this.advance();
        }
      }

      if (operator) {
        return { type: "OPERATOR", value: value + " " + operator, position: start };
      }

      return { type: "IDENTIFIER", value, position: start };
    }

    // Unknown character
    return { type: "EOF", value: this.advance(), position: start };
  }
}

// Parser
export function parseExpression(input: string): Expression | undefined {
  const tokenizer = new Tokenizer(input);
  const expr = parseOr(tokenizer);
  
  const next = tokenizer.nextToken();
  if (next.type !== "EOF") {
    return undefined; // Extra tokens
  }
  
  return expr;
}

function parseOr(tokenizer: Tokenizer): Expression | undefined {
  let left = parseAnd(tokenizer);
  if (!left) return undefined;

  while (true) {
    const savedPos = tokenizer.position;
    const token = tokenizer.nextToken();
    if (token.type === "OR") {
      const right = parseAnd(tokenizer);
      if (!right) return undefined;
      left = { type: "or", left, right };
    } else {
      // Put the token back
      tokenizer.position = savedPos;
      break;
    }
  }

  return left;
}

function parseAnd(tokenizer: Tokenizer): Expression | undefined {
  let left = parseNot(tokenizer);
  if (!left) return undefined;

  while (true) {
    const savedPos = tokenizer.position;
    const token = tokenizer.nextToken();
    if (token.type === "AND") {
      const right = parseNot(tokenizer);
      if (!right) return undefined;
      left = { type: "and", left, right };
    } else {
      // Put the token back
      tokenizer.position = savedPos;
      break;
    }
  }

  return left;
}

function parseNot(tokenizer: Tokenizer): Expression | undefined {
  const savedPos = tokenizer.position;
  const token = tokenizer.nextToken();
  
  if (token.type === "NOT") {
    const expr = parseNot(tokenizer);
    return expr ? { type: "not", expression: expr } : undefined;
  }
  
  // Put the token back
  tokenizer.position = savedPos;
  return parsePrimary(tokenizer);
}

function parsePrimary(tokenizer: Tokenizer): Expression | undefined {
  const token = tokenizer.nextToken();

  if (token.type === "LPAREN") {
    const expr = parseOr(tokenizer);
    const rparen = tokenizer.nextToken();
    if (rparen.type !== "RPAREN") {
      return undefined;
    }
    return expr;
  }

  if (token.type === "OPERATOR") {
    const [variable, operator] = token.value.split(" ");
    
    if (operator === "=~") {
      const regexToken = tokenizer.nextToken();
      if (regexToken.type !== "REGEX") {
        return undefined;
      }
      const lastSlash = regexToken.value.lastIndexOf("/");
      const pattern = lastSlash >= 0 ? regexToken.value.slice(0, lastSlash) : regexToken.value;
      const flags = lastSlash >= 0 ? regexToken.value.slice(lastSlash + 1) : undefined;
      return {
        type: "regex",
        variable,
        pattern,
        flags: flags || undefined,
      };
    } else {
      const stringToken = tokenizer.nextToken();
      if (stringToken.type !== "STRING") {
        return undefined;
      }
      return {
        type: "comparison",
        variable,
        operator: operator.toLowerCase() as ExpressionOperator,
        value: stringToken.value,
      };
    }
  }

  if (token.type === "IDENTIFIER") {
    // Identifier followed by regex (without =~)
    const nextToken = tokenizer.nextToken();
    if (nextToken.type === "REGEX") {
      const lastSlash = nextToken.value.lastIndexOf("/");
      const pattern = lastSlash >= 0 ? nextToken.value.slice(0, lastSlash) : nextToken.value;
      const flags = lastSlash >= 0 ? nextToken.value.slice(lastSlash + 1) : undefined;
      return {
        type: "regex",
        variable: token.value,
        pattern,
        flags: flags || undefined,
      };
    }
    // Put the token back
    tokenizer.position -= nextToken.value.length;
  }

  // Could be just a regex without identifier
  if (token.type === "REGEX") {
    const lastSlash = token.value.lastIndexOf("/");
    const pattern = lastSlash >= 0 ? token.value.slice(0, lastSlash) : token.value;
    const flags = lastSlash >= 0 ? token.value.slice(lastSlash + 1) : undefined;
    return {
      type: "regex",
      variable: "url",
      pattern,
      flags: flags || undefined,
    };
  }

  return undefined;
}