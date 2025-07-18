import lexer from "../src/lexer/index";
import { Token } from "../src/lexer/types";

describe("lexer", () => {
  it("should tokenize single characters", () => {
    expect(lexer("a")).toEqual([
      { type: "CHAR", value: "a", position: 0 },
      { type: "EOF", value: "", position: 1 },
    ]);
    expect(lexer("Z")).toEqual([
      { type: "CHAR", value: "Z", position: 0 },
      { type: "EOF", value: "", position: 1 },
    ]);
    expect(lexer("9")).toEqual([
      { type: "CHAR", value: "9", position: 0 },
      { type: "EOF", value: "", position: 1 },
    ]);
  });

  it("should tokenize all special symbols", () => {
    const input = ".*+?(){}|^$,";
    const expectedTypes = [
      "DOT", "STAR", "PLUS", "QUESTION", "LPAREN", "RPAREN", "LBRACE", "RBRACE", "ALT", "ANCHOR_START", "ANCHOR_END", "COMMA"
    ];
    const tokens = lexer(input);
    expectedTypes.forEach((type, idx) => {
      expect(tokens[idx]).toEqual({ type, value: input[idx], position: idx });
    });
    expect(tokens[tokens.length - 1]).toEqual({ type: "EOF", value: "", position: input.length });
  });

  it("should tokenize escape sequences", () => {
    expect(lexer("\\n")).toEqual([
      { type: "ESCAPE", value: "n", position: 0 },
      { type: "EOF", value: "", position: 2 },
    ]);
    expect(lexer("a\\t")).toEqual([
      { type: "CHAR", value: "a", position: 0 },
      { type: "ESCAPE", value: "t", position: 1 },
      { type: "EOF", value: "", position: 3 },
    ]);
  });

  it("should throw on unknown characters", () => {
    expect(() => lexer("@"))
      .toThrow("Unknown character '@' at position 0");
    expect(() => lexer("a#b"))
      .toThrow("Unknown character '#' at position 1");
  });

  it("should throw on trailing escape", () => {
    expect(() => lexer("a\\"))
      .toThrow("Unexpected end after escape at position 1");
  });

  it("should handle empty input", () => {
    expect(lexer("")).toEqual([
      { type: "EOF", value: "", position: 0 },
    ]);
  });

  it("should tokenize a complex regex", () => {
    const input = "a(b|c)*\\d+^$";
    const tokens = lexer(input);
    const expected: Token[] = [
      { type: "CHAR", value: "a", position: 0 },
      { type: "LPAREN", value: "(", position: 1 },
      { type: "CHAR", value: "b", position: 2 },
      { type: "ALT", value: "|", position: 3 },
      { type: "CHAR", value: "c", position: 4 },
      { type: "RPAREN", value: ")", position: 5 },
      { type: "STAR", value: "*", position: 6 },
      { type: "ESCAPE", value: "d", position: 7 },
      { type: "PLUS", value: "+", position: 9 },
      { type: "ANCHOR_START", value: "^", position: 10 },
      { type: "ANCHOR_END", value: "$", position: 11 },
      { type: "EOF", value: "", position: 12 },
    ];
    expect(tokens).toEqual(expected);
  });
}); 