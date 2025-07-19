export type ASTNode = 
| ExpressionNode
| SubexpressionNode
| TermNode
| FactorNode
| QuantifierNode
| TokenNode
| GroupNode
| CharacterNode
| MetacharacterNode

type ExpressionNode = {
  type: "Expression";
  anchorStart: boolean;
  anchorEnd: boolean;
  subexpression: SubexpressionNode;
};

type SubexpressionNode = {
  type: "Subexpression";
  term: TermNode;
  subexpression?: SubexpressionNode;
};

type TermNode = {
  type: "Term";
  factors: FactorNode[];
};

type FactorNode = {
  type: "Factor";
  token: TokenNode;
  quantifier?: QuantifierNode;
};

type QuantifierNode = {
  type: "Quantifier";
  value: "*" | "+" | "?" | `{${number}}` | `{${number},${number}}`;
};

type TokenNode = {
  type: "Token";
  body: GroupNode | CharacterNode | MetacharacterNode;
};

type GroupNode = {
  type: "Group";
  body: ExpressionNode;
};

type CharacterNode = {
  type: "Character";
  body: CharClassNode;
};

type CharClassNode =
  | { type: "SmallCharacter"; value: string }
  | { type: "CapitalCharacter"; value: string }
  | { type: "DigitCharacter"; value: string }
  | { type: "SymbolCharacter"; value: string };

type MetacharacterNode = {
  type: "Metacharacter";
  value: string; 
};
