import { Token } from "../src/lexer/types";
import { ASTNode } from "../src/parser/ast";
import { parse } from "../src/parser/index";

// Helper type for expected expression results
type ExpectedExpression = {
  type: "Expression";
  anchorStart: boolean;
  anchorEnd: boolean;
  subexpression: {
    type: "Subexpression";
    term: {
      type: "Term";
      factors: Array<{
        type: "Factor";
        token: {
          type: "Token";
          body: {
            type: "Character" | "Metacharacter" | "Group";
            body?: any;
            value?: string;
          };
        };
        quantifier?: {
          type: "Quantifier";
          value: string;
        };
      }>;
    };
    subexpression?: ExpectedExpression["subexpression"];
  };
};

describe("Parser Tests", () => {
  describe("Basic Character Tests", () => {
    test("single character", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "EOF", value: "", position: 1 }
      ];
      const result = parse(tokens);
      expect(result).toHaveLength(1);
      const expression = result[0] as ExpectedExpression;
      expect(expression).toMatchObject({
        type: "Expression",
        anchorStart: false,
        anchorEnd: false,
        subexpression: {
          type: "Subexpression",
          term: {
            type: "Term",
            factors: [{
              type: "Factor",
              token: {
                type: "Token",
                body: {
                  type: "Character",
                  body: { type: "SmallCharacter", value: "a" }
                }
              }
            }]
          }
        }
      });
    });

    test("multiple characters", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "CHAR", value: "b", position: 1 },
        { type: "CHAR", value: "c", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors).toHaveLength(3);
    });

    test("capital letters", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "A", position: 0 },
        { type: "EOF", value: "", position: 1 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].token.body).toMatchObject({
        type: "Character",
        body: { type: "CapitalCharacter", value: "A" }
      });
    });

    test("digits", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "5", position: 0 },
        { type: "EOF", value: "", position: 1 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].token.body).toMatchObject({
        type: "Character",
        body: { type: "DigitCharacter", value: "5" }
      });
    });
  });

  describe("Metacharacter Tests", () => {
    test("dot metacharacter", () => {
      const tokens: Token[] = [
        { type: "DOT", value: ".", position: 0 },
        { type: "EOF", value: "", position: 1 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].token.body).toMatchObject({
        type: "Metacharacter",
        value: "."
      });
    });
  });

  describe("Quantifier Tests", () => {
    test("star quantifier", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "STAR", value: "*", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].quantifier).toMatchObject({
        type: "Quantifier",
        value: "*"
      });
    });

    test("plus quantifier", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "PLUS", value: "+", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].quantifier).toMatchObject({
        type: "Quantifier",
        value: "+"
      });
    });

    test("question quantifier", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "QUESTION", value: "?", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].quantifier).toMatchObject({
        type: "Quantifier",
        value: "?"
      });
    });

    test("exact quantifier {n}", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "LBRACE", value: "{", position: 1 },
        { type: "CHAR", value: "3", position: 2 },
        { type: "RBRACE", value: "}", position: 3 },
        { type: "EOF", value: "", position: 4 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].quantifier).toMatchObject({
        type: "Quantifier",
        value: "{3}"
      });
    });

    test("range quantifier {n,m}", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "LBRACE", value: "{", position: 1 },
        { type: "CHAR", value: "2", position: 2 },
        { type: "COMMA", value: ",", position: 3 },
        { type: "CHAR", value: "5", position: 4 },
        { type: "RBRACE", value: "}", position: 5 },
        { type: "EOF", value: "", position: 6 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].quantifier).toMatchObject({
        type: "Quantifier",
        value: "{2,5}"
      });
    });
  });

  describe("Group Tests", () => {
    test("simple group", () => {
      const tokens: Token[] = [
        { type: "LPAREN", value: "(", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "RPAREN", value: ")", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].token.body).toMatchObject({
        type: "Group",
        body: {
          type: "Expression",
          anchorStart: false,
          anchorEnd: false,
          subexpression: {
            type: "Subexpression",
            term: {
              type: "Term",
              factors: [{
                type: "Factor",
                token: {
                  type: "Token",
                  body: {
                    type: "Character",
                    body: { type: "SmallCharacter", value: "a" }
                  }
                }
              }]
            }
          }
        }
      });
    });

    test("nested groups", () => {
      const tokens: Token[] = [
        { type: "LPAREN", value: "(", position: 0 },
        { type: "LPAREN", value: "(", position: 1 },
        { type: "CHAR", value: "a", position: 2 },
        { type: "RPAREN", value: ")", position: 3 },
        { type: "RPAREN", value: ")", position: 4 },
        { type: "EOF", value: "", position: 5 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].token.body.type).toBe("Group");
    });
  });

  describe("Alternation Tests", () => {
    test("simple alternation", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "ALT", value: "|", position: 1 },
        { type: "CHAR", value: "b", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.subexpression).toBeDefined();
      expect(expression.subexpression.term.factors[0].token.body).toMatchObject({
        type: "Character",
        body: { type: "SmallCharacter", value: "a" }
      });
      expect(expression.subexpression.subexpression!.term.factors[0].token.body).toMatchObject({
        type: "Character",
        body: { type: "SmallCharacter", value: "b" }
      });
    });

    test("multiple alternations", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "ALT", value: "|", position: 1 },
        { type: "CHAR", value: "b", position: 2 },
        { type: "ALT", value: "|", position: 3 },
        { type: "CHAR", value: "c", position: 4 },
        { type: "EOF", value: "", position: 5 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.subexpression!.subexpression).toBeDefined();
    });
  });

  describe("Anchor Tests", () => {
    test("start anchor", () => {
      const tokens: Token[] = [
        { type: "ANCHOR_START", value: "^", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.anchorStart).toBe(true);
      expect(expression.anchorEnd).toBe(false);
    });

    test("end anchor", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "ANCHOR_END", value: "$", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.anchorStart).toBe(false);
      expect(expression.anchorEnd).toBe(true);
    });

    test("both anchors", () => {
      const tokens: Token[] = [
        { type: "ANCHOR_START", value: "^", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "ANCHOR_END", value: "$", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.anchorStart).toBe(true);
      expect(expression.anchorEnd).toBe(true);
    });
  });

  describe("Complex Pattern Tests", () => {
    test("complex pattern with all features", () => {
      const tokens: Token[] = [
        { type: "ANCHOR_START", value: "^", position: 0 },
        { type: "LPAREN", value: "(", position: 1 },
        { type: "CHAR", value: "a", position: 2 },
        { type: "ALT", value: "|", position: 3 },
        { type: "CHAR", value: "b", position: 4 },
        { type: "RPAREN", value: ")", position: 5 },
        { type: "STAR", value: "*", position: 6 },
        { type: "CHAR", value: "c", position: 7 },
        { type: "PLUS", value: "+", position: 8 },
        { type: "DOT", value: ".", position: 9 },
        { type: "QUESTION", value: "?", position: 10 },
        { type: "ANCHOR_END", value: "$", position: 11 },
        { type: "EOF", value: "", position: 12 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.anchorStart).toBe(true);
      expect(expression.anchorEnd).toBe(true);
      expect(expression.subexpression.term.factors).toHaveLength(4);
    });

    test("quantified group", () => {
      const tokens: Token[] = [
        { type: "LPAREN", value: "(", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "CHAR", value: "b", position: 2 },
        { type: "RPAREN", value: ")", position: 3 },
        { type: "STAR", value: "*", position: 4 },
        { type: "EOF", value: "", position: 5 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].quantifier).toMatchObject({
        type: "Quantifier",
        value: "*"
      });
    });
  });

  describe("Edge Cases and Error Tests", () => {
    test("empty input", () => {
      const tokens: Token[] = [
        { type: "EOF", value: "", position: 0 }
      ];
      const result = parse(tokens);
      expect(result).toHaveLength(1);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors).toHaveLength(0);
    });

    test("only anchors", () => {
      const tokens: Token[] = [
        { type: "ANCHOR_START", value: "^", position: 0 },
        { type: "ANCHOR_END", value: "$", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.anchorStart).toBe(true);
      expect(expression.anchorEnd).toBe(true);
      expect(expression.subexpression.term.factors).toHaveLength(0);
    });

    test("multiple consecutive quantifiers should fail", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "STAR", value: "*", position: 1 },
        { type: "PLUS", value: "+", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("unmatched opening parenthesis", () => {
      const tokens: Token[] = [
        { type: "LPAREN", value: "(", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("unmatched closing parenthesis", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "RPAREN", value: ")", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("alternation at start", () => {
      const tokens: Token[] = [
        { type: "ALT", value: "|", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("alternation at end", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "ALT", value: "|", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("quantifier at start", () => {
      const tokens: Token[] = [
        { type: "STAR", value: "*", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "EOF", value: "", position: 2 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("invalid quantifier range", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "LBRACE", value: "{", position: 1 },
        { type: "CHAR", value: "5", position: 2 },
        { type: "COMMA", value: ",", position: 3 },
        { type: "CHAR", value: "2", position: 4 }, // 5,2 is invalid
        { type: "RBRACE", value: "}", position: 5 },
        { type: "EOF", value: "", position: 6 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("empty quantifier braces", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "LBRACE", value: "{", position: 1 },
        { type: "RBRACE", value: "}", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      expect(() => parse(tokens)).toThrow();
    });

    test("incomplete quantifier", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "LBRACE", value: "{", position: 1 },
        { type: "CHAR", value: "5", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      expect(() => parse(tokens)).toThrow();
    });
  });

  describe("Precedence Tests", () => {
    test("quantifier precedence - should apply to single character", () => {
      const tokens: Token[] = [
        { type: "CHAR", value: "a", position: 0 },
        { type: "STAR", value: "*", position: 1 },
        { type: "CHAR", value: "b", position: 2 },
        { type: "EOF", value: "", position: 3 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors).toHaveLength(2);
      expect(expression.subexpression.term.factors[0].quantifier).toBeDefined();
      expect(expression.subexpression.term.factors[1].quantifier).toBeUndefined();
    });

    test("group precedence - quantifier applies to entire group", () => {
      const tokens: Token[] = [
        { type: "LPAREN", value: "(", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "CHAR", value: "b", position: 2 },
        { type: "RPAREN", value: ")", position: 3 },
        { type: "STAR", value: "*", position: 4 },
        { type: "EOF", value: "", position: 5 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.subexpression.term.factors[0].quantifier).toBeDefined();
      const group = expression.subexpression.term.factors[0].token.body as any;
      expect(group.body.subexpression.term.factors).toHaveLength(2);
    });
  });

  describe("Integration Tests", () => {
    test("real-world email pattern", () => {
      const tokens: Token[] = [
        { type: "ANCHOR_START", value: "^", position: 0 },
        { type: "CHAR", value: "a", position: 1 },
        { type: "CHAR", value: "b", position: 2 },
        { type: "CHAR", value: "c", position: 3 },
        { type: "DOT", value: ".", position: 4 },
        { type: "CHAR", value: "c", position: 5 },
        { type: "CHAR", value: "o", position: 6 },
        { type: "CHAR", value: "m", position: 7 },
        { type: "ANCHOR_END", value: "$", position: 8 },
        { type: "EOF", value: "", position: 9 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.anchorStart).toBe(true);
      expect(expression.anchorEnd).toBe(true);
      expect(expression.subexpression.term.factors).toHaveLength(8);
    });

    test("phone number pattern", () => {
      const tokens: Token[] = [
        { type: "ANCHOR_START", value: "^", position: 0 },
        { type: "LPAREN", value: "(", position: 1 },
        { type: "CHAR", value: "5", position: 2 },
        { type: "CHAR", value: "5", position: 3 },
        { type: "CHAR", value: "5", position: 4 },
        { type: "RPAREN", value: ")", position: 5 },
        { type: "CHAR", value: "5", position: 6 },
        { type: "CHAR", value: "5", position: 7 },
        { type: "CHAR", value: "5", position: 8 },
        { type: "CHAR", value: "5", position: 9 },
        { type: "CHAR", value: "5", position: 10 },
        { type: "CHAR", value: "5", position: 11 },
        { type: "CHAR", value: "5", position: 12 },
        { type: "ANCHOR_END", value: "$", position: 13 },
        { type: "EOF", value: "", position: 14 }
      ];
      const result = parse(tokens);
      const expression = result[0] as ExpectedExpression;
      expect(expression.anchorStart).toBe(true);
      expect(expression.anchorEnd).toBe(true);
      expect(expression.subexpression.term.factors).toHaveLength(2);
    });
  });
}); 