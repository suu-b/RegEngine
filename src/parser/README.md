# Parsing methods and references

Suppose we want to parse the regex pattern: `^(a|b)*c+$`

**Input (Token Array):**

```js
[
  { type: "ANCHOR_START", value: "^", position: 0 },
  { type: "LPAREN", value: "(", position: 1 },
  { type: "CHAR", value: "a", position: 2 },
  { type: "ALT", value: "|", position: 3 },
  { type: "CHAR", value: "b", position: 4 },
  { type: "RPAREN", value: ")", position: 5 },
  { type: "STAR", value: "*", position: 6 },
  { type: "CHAR", value: "c", position: 7 },
  { type: "PLUS", value: "+", position: 8 },
  { type: "EOF", value: "", position: 9 },
];
```

**Expected Output (AST):**

```js
[
  {
    type: "Expression",
    anchorStart: true,
    anchorEnd: false,
    subexpression: {
      type: "Subexpression",
      term: {
        type: "Term",
        factors: [
          {
            type: "Factor",
            token: {
              type: "Token",
              body: {
                type: "Group",
                body: {
                  type: "Expression",
                  anchorStart: false,
                  anchorEnd: false,
                  subexpression: {
                    type: "Subexpression",
                    term: {
                      type: "Term",
                      factors: [
                        {
                          type: "Factor",
                          token: {
                            type: "Token",
                            body: {
                              type: "Character",
                              body: { type: "SmallCharacter", value: "a" },
                            },
                          },
                          quantifier: undefined,
                        },
                      ],
                    },
                    subexpression: {
                      type: "Subexpression",
                      term: {
                        type: "Term",
                        factors: [
                          {
                            type: "Factor",
                            token: {
                              type: "Token",
                              body: {
                                type: "Character",
                                body: { type: "SmallCharacter", value: "b" },
                              },
                            },
                            quantifier: undefined,
                          },
                        ],
                      },
                      subexpression: undefined,
                    },
                  },
                },
              },
            },
            quantifier: { type: "Quantifier", value: "*" },
          },
          {
            type: "Factor",
            token: {
              type: "Token",
              body: {
                type: "Character",
                body: { type: "SmallCharacter", value: "c" },
              },
            },
            quantifier: { type: "Quantifier", value: "+" },
          },
        ],
      },
      subexpression: undefined,
    },
  },
];
```

---

## Parsing methods

[The actual methods differ due to coverage of many edge cases]

### Parsing Expressions

```
FUNCTION parseExpression(tokens)
    IF tokens.LENGTH == 0 THEN THROW "Empty expression"

    isAnchorStart ← tokens[0].type == "ANCHOR_START"
    isAnchorEnd ← tokens[-2].type == "ANCHOR_END"  // before EOF

    startIndex ← IF isAnchorStart THEN 1 ELSE 0
    endIndex ← IF isAnchorEnd THEN tokens.LENGTH - 2 ELSE tokens.LENGTH - 1

    slicedTokens ← tokens.slice(startIndex, endIndex + 1)

    sub ← parseSubexpression(slicedTokens)

    RETURN {
        type: "Expression",
        anchorStart: isAnchorStart,
        anchorEnd: isAnchorEnd,
        subexpression: sub
    }
ENDFUNCTION
```

### Parsing Subexpressions

```
FUNCTION parseSubexpression(tokenst
    IF tokens.LENGTH == 0 THEN THROW "Empty subexpression"

    index ← findTopLevelAlternation(tokens)

    IF index == -1 THEN
        RETURN {
            type: "Subexpression",
            term: parseTerm(tokens),
            subexpression: null
        }
    ELSE
        left ← tokens.slice(0, index)
        right ← tokens.slice(index + 1)

        RETURN {
            type: "Subexpression",
            term: parseTerm(left),
            subexpression: parseSubexpression(right)
        }
ENDFUNCTION

FUNCTION findTopLevelAlternation(tokens)
    depth ← 0
    FOR i FROM 0 TO tokens.LENGTH - 1 DO
        token ← tokens[i]
        IF token.type == "LPAREN" THEN depth++
        ELSE IF token.type == "RPAREN" THEN depth--
        ELSE IF token.type == "ALT" AND depth == 0 THEN RETURN i
    ENDFOR
    RETURN -1
ENDFUNCTION

```

### Parsing Terms

```
FUNCTION parseTerm(tokens)
    factors ← []
    acc ← []
    depth ← 0
    i ← 0

    WHILE i < tokens.LENGTH DO
        token ← tokens[i]
        acc.ADD(token)

        IF token.type == "LPAREN" THEN depth++
        ELSE IF token.type == "RPAREN" THEN depth--

        next ← tokens[i + 1] IF i + 1 < tokens.LENGTH ELSE null

        IF depth == 0 THEN
            IF next AND isQuantifier(next, tokens, i + 1) THEN
                quantText ← findQuantifier(next, tokens, i + 1)
                quantLength ← quantText.LENGTH
                FOR j FROM 1 TO quantLength DO
                    acc.ADD(tokens[i + j])
                END FOR
                i ← i + quantLength
                factors.ADD(parseFactor(acc))
                acc ← []
            ELSE IF next == null OR next.type == "EOF" THEN
                factors.ADD(parseFactor(acc))
                acc ← []
        ENDIF

        i ← i + 1
    ENDWHILE

    RETURN {
        type: "Term",
        factors: factors
    }
ENDFUNCTION
```

### Parsing Factors

```
FUNCTION parseFactor(tokens)
    quant ← null
    quantStart ← -1

    FOR i FROM 0 TO tokens.LENGTH - 1 DO
        q ← findQuantifier(tokens[i], tokens, i)
        IF q ≠ "__notValid__" THEN
            quant ← {
                type: "Quantifier",
                value: q
            }
            quantStart ← i
            BREAK
    ENDFOR

    tokenTokens ← IF quant THEN tokens.slice(0, quantStart) ELSE tokens

    RETURN {
        type: "Factor",
        token: parseToken(tokenTokens),
        quantifier: quant
    }
ENDFUNCTION
```

### Parsing Tokens

```
FUNCTION parseToken(tokens)
    first ← tokens[0]
    last ← tokens[-1]

    IF first.type == "LPAREN" AND last.type == "RPAREN" THEN
        inner ← tokens.slice(1, tokens.LENGTH - 1)
        RETURN {
            type: "Token",
            body: {
                type: "Group",
                body: parseExpression(inner)
            }
        }

    ELSE IF first.type == "DOT" OR first.type == "ESCAPE" THEN
        RETURN {
            type: "Token",
            body: {
                type: "Metacharacter",
                value: first.value
            }
        }

    ELSE
        RETURN {
            type: "Token",
            body: {
                type: "Character",
                body: classifyCharacter(first)
            }
        }
ENDFUNCTION
```

### Classify Characters

```
FUNCTION parseToken(tokens)
    first ← tokens[0]
    last ← tokens[-1]

    IF first.type == "LPAREN" AND last.type == "RPAREN" THEN
        inner ← tokens.slice(1, tokens.LENGTH - 1)
        RETURN {
            type: "Token",
            body: {
                type: "Group",
                body: parseExpression(inner)
            }
        }

    ELSE IF first.type == "DOT" OR first.type == "ESCAPE" THEN
        RETURN {
            type: "Token",
            body: {
                type: "Metacharacter",
                value: first.value
            }
        }

    ELSE
        RETURN {
            type: "Token",
            body: {
                type: "Character",
                body: classifyCharacter(first)
            }
        }
ENDFUNCTION
```

### Finding and checking Quantifier

```
FUNCTION findQuantifier(token, tokens, index)
    IF token.type IN ["STAR", "PLUS", "QUESTION"] THEN RETURN token.value

    IF token.type == "LBRACE" THEN
        acc ← "{"
        hasDigit ← false
        hasClose ← false
        i ← index + 1

        WHILE i < tokens.LENGTH DO
            t ← tokens[i]
            acc ← acc + t.value
            IF t.type == "DIGIT" THEN hasDigit ← true
            ELSE IF t.type == "RBRACE" THEN hasClose ← true; BREAK
            ELSE IF t.type NOT IN ["DIGIT", "COMMA"] THEN RETURN "__notValid__"
            i++
        ENDWHILE

        IF hasDigit AND hasClose THEN RETURN acc
    ENDIF

    RETURN "__notValid__"
ENDFUNCTION

FUNCTION isQuantifier(token, tokens, index)
    RETURN findQuantifier(token, tokens, index) ≠ "__notValid__"
ENDFUNCTION
```
