import { Token, TokenType } from "./types";

function createToken(type: TokenType, value: string, position: number): Token {
  return { type, value, position };
}

export default function lexer(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char: string = input.charAt(i);

    if (/[a-zA-Z0-9]/.test(char)) {
      tokens.push(createToken("CHAR", char, i));
      i++;
      continue;
    }

    switch (char) {
      case ".":
        tokens.push(createToken("DOT", char, i));
        break;
      case "*":
        tokens.push(createToken("STAR", char, i));
        break;
      case "+":
        tokens.push(createToken("PLUS", char, i));
        break;
      case "?":
        tokens.push(createToken("QUESTION", char, i));
        break;
      case "(":
        tokens.push(createToken("LPAREN", char, i));
        break;
      case ")":
        tokens.push(createToken("RPAREN", char, i));
        break;
      case "{":
        tokens.push(createToken("LBRACE", char, i));
        break;
      case "}":
        tokens.push(createToken("RBRACE", char, i));
        break;
      case ",":
        tokens.push(createToken("COMMA", char, i));
        break;
      case "|":
        tokens.push(createToken("ALT", char, i));
        break;
      case "^":
        tokens.push(createToken("ANCHOR_START", char, i));
        break;
      case "$":
        tokens.push(createToken("ANCHOR_END", char, i));
        break;
      case "\\":
        const next = input[i + 1];
        if (next) {
          tokens.push(createToken("ESCAPE", next, i));
          i += 2;
          continue;
        } else {
          throw new Error(`Unexpected end after escape at position ${i}`);
        }
      default:
        throw new Error(`Unknown character '${char}' at position ${i}`);
    }

    i++;
  }

  tokens.push(createToken("EOF", "", i));
  return tokens;
}
