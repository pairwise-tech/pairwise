/**
 * The npm package is very out of date and a regular installation doesn't
 * work..................................................................
 *
 * The library is only 100 lines of JS so I am putting it here directly.
 *
 * See the original source on GitHub: https://github.com/jsbin/loop-protect.
 */

const generateBefore = (t, id) =>
  t.variableDeclaration("var", [
    t.variableDeclarator(
      id,
      t.callExpression(
        t.memberExpression(t.identifier("Date"), t.identifier("now")),
        [],
      ),
    ),
  ]);

const generateInside = ({ t, id, line, ch, timeout, extra } = {}) => {
  return t.ifStatement(
    t.binaryExpression(
      ">",
      t.binaryExpression(
        "-",
        t.callExpression(
          t.memberExpression(t.identifier("Date"), t.identifier("now")),
          [],
        ),
        id,
      ),
      t.numericLiteral(timeout),
    ),
    extra
      ? t.blockStatement([
          t.expressionStatement(
            t.callExpression(extra, [
              t.numericLiteral(line),
              t.numericLiteral(ch),
            ]),
          ),
          t.breakStatement(),
        ])
      : t.breakStatement(),
  );
};

const protect = (t, timeout, extra) => path => {
  if (!path.node.loc) {
    // I don't really know _how_ we get into this state
    // but https://jsbin.com/mipesawapi/1/ triggers it
    // and the node, I'm guessing after translation,
    // doesn't have a line in the code, so this blows up.
    return;
  }
  const id = path.scope.generateUidIdentifier("LP");
  const before = generateBefore(t, id);
  const inside = generateInside({
    t,
    id,
    line: path.node.loc.start.line,
    ch: path.node.loc.start.column,
    timeout,
    extra,
  });
  const body = path.get("body");

  // if we have an expression statement, convert it to a block
  if (!t.isBlockStatement(body)) {
    body.replaceWith(t.blockStatement([body.node]));
  }
  path.insertBefore(before);
  body.unshiftContainer("body", inside);
};

module.exports = (timeout = 100) => {
  /**
   * NOTE: For some unknown reasons, we have to inline the function like
   * this for it to work. The name is arbitrary but the function needs to
   * have a name.
   */
  const extra = `function bomberFunctionName(){throw new Error("INFINITE_LOOP")}`;

  return ({ types: t, transform }) => {
    const node = extra
      ? transform(extra, { ast: true }).ast.program.body[0]
      : null;

    let callback = null;
    if (t.isExpressionStatement(node)) {
      callback = node.expression;
    } else if (t.isFunctionDeclaration(node)) {
      callback = t.functionExpression(null, node.params, node.body);
    }

    return {
      visitor: {
        WhileStatement: protect(t, timeout, callback),
        ForStatement: protect(t, timeout, callback),
        DoWhileStatement: protect(t, timeout, callback),
      },
    };
  };
};
