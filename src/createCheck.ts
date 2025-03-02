import ts from "typescript";

import * as factory from "./factory.js";

const ELEMENT = `e`;
const PROPERTY = `p`;

export function* createCheck(value: ts.Expression, type: ts.Type, typeChecker: ts.TypeChecker, printer: ts.Printer): Generator<ts.Expression>
{
  let typeofMap = {
    [ts.TypeFlags.String]: `string`,
    [ts.TypeFlags.Number]: `number`,
    [ts.TypeFlags.BigInt]: `bigint`,
    [ts.TypeFlags.Undefined]: `undefined`
  };
  if (type.flags in typeofMap)
  {
    return yield ts.factory.createStrictEquality(
      ts.factory.createTypeOfExpression(value),
      ts.factory.createStringLiteral(typeofMap[type.flags as keyof typeof typeofMap])
    );
  }

  if (type.isUnion() && type.types.every(type => type.flags === ts.TypeFlags.BooleanLiteral))
  {
    return yield ts.factory.createStrictEquality(
      ts.factory.createTypeOfExpression(value),
      ts.factory.createStringLiteral(`boolean`)
    );
  }

  if (typeChecker.isArrayType(type))
  {
    return yield* createArrayCheck(value, type, typeChecker, printer);
  }

  if (type.isClass())
  {
    return yield ts.factory.createBinaryExpression(
      value,
      ts.SyntaxKind.InstanceOfKeyword,
      ts.factory.createIdentifier(type.symbol.name)
    );
  }

  if (type.flags & ts.TypeFlags.Object)
  {
    return yield* createObjectCheck(value, type, typeChecker, printer);
  }

  if (type.isUnion())
  {
    return yield* createUnionCheck(value, type, typeChecker, printer);
  }

  if (type.isIntersection())
  {
    return yield* createIntersectionCheck(value, type, typeChecker, printer);
  }

  if (type.flags & ts.TypeFlags.Null)
  {
    return yield ts.factory.createStrictEquality(
      value,
      ts.factory.createNull()
    );
  }

  if (type.isStringLiteral())
  {
    return yield ts.factory.createStrictEquality(
      value,
      ts.factory.createStringLiteral(type.value)
    );
  }

  if (type.isNumberLiteral())
  {
    return yield ts.factory.createStrictEquality(
      value,
      ts.factory.createNumericLiteral(type.value)
    );
  }

  if (type.flags & ts.TypeFlags.BooleanLiteral)
  {
    return yield ts.factory.createStrictEquality(
      value,
      type === typeChecker.getTrueType() ? ts.factory.createTrue() : ts.factory.createFalse()
    );
  }

  if (type.flags & ts.TypeFlags.Unknown)
  {
    return;
  }

  throw new Error(`Type '${typeChecker.typeToString(type)}' on '${printer.printNode(ts.EmitHint.Expression, value, value.getSourceFile())}' with flags '${ts.TypeFlags[type.flags]}' is not supported.`);
}

function* createArrayCheck(value: ts.Expression, type: ts.Type, typeChecker: ts.TypeChecker, printer: ts.Printer)
{
  yield factory.createCallExpression({
    expression: ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier(`Array`),
      `isArray`
    ),
    argumentsArray: [value]
  });

  let elementType = typeChecker.getTypeArguments(type as ts.TypeReference)[0];

  let identifier = ts.factory.createIdentifier(ELEMENT);
  let parameter = factory.createParameterDeclaration({name: identifier});

  let checks = createCheck(identifier, elementType, typeChecker, printer).toArray();
  if (checks.length === 0) return;
  let check = checks.reduce(ts.factory.createLogicalAnd);

  let lambda = factory.createArrowFunction({
    parameters: [parameter],
    body: check
  });

  let every = factory.createCallExpression({
    expression: ts.factory.createPropertyAccessExpression(value, `every`),
    argumentsArray: [lambda]
  });
  yield every;
}

function* createObjectCheck(value: ts.Expression, type: ts.Type, typeChecker: ts.TypeChecker, printer: ts.Printer)
{
  yield ts.factory.createStrictEquality(
    ts.factory.createTypeOfExpression(value),
    ts.factory.createStringLiteral(`object`)
  );

  yield ts.factory.createStrictInequality(
    value,
    ts.factory.createNull()
  );

  yield* createObjectIndexCheck(value, type, typeChecker, printer);

  let properties = typeChecker.getPropertiesOfType(type);
  for (let property of properties)
  {
    let propertyType = typeChecker.getTypeOfSymbol(property);

    let indexer = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(property.name)
                ? ts.factory.createPropertyAccessExpression(value, property.name)
                : ts.factory.createElementAccessExpression(value, ts.factory.createStringLiteral(property.name));

    let check = createCheck(indexer, propertyType, typeChecker, printer).toArray();
    if (check.length === 0) continue;

    yield check.reduce(ts.factory.createLogicalAnd);
  }
}
function* createObjectIndexCheck(value: ts.Expression, type: ts.Type, typeChecker: ts.TypeChecker, printer: ts.Printer)
{
  let index = typeChecker.getIndexInfoOfType(type, ts.IndexKind.String);
  if (index === undefined) return;

  let valueType = index.type;

  let values = factory.createCallExpression({
    expression: ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier(`Object`),
      `values`
    ),
    argumentsArray: [value]
  });

  let identifier = ts.factory.createIdentifier(PROPERTY);
  let parameter = factory.createParameterDeclaration({name: identifier});

  let checks = createCheck(identifier, valueType, typeChecker, printer).toArray();
  if (checks.length === 0) return;
  let check = checks.reduce(ts.factory.createLogicalAnd);

  let lambda = factory.createArrowFunction({
    parameters: [parameter],
    body: check
  });

  let every = factory.createCallExpression({
    expression: ts.factory.createPropertyAccessExpression(values, `every`),
    argumentsArray: [lambda]
  });
  yield every;
}

function* createUnionCheck(value: ts.Expression, type: ts.UnionType, typeChecker: ts.TypeChecker, printer: ts.Printer)
{
  let types = type.types;

  let checks = types.map(type => createCheck(value, type, typeChecker, printer))
                    .map(checks => checks.toArray())
                    .filter(checks => checks.length > 0)
                    .map(checks => checks.reduce(ts.factory.createLogicalAnd));
  if (checks.length === 0) return;
  let check = checks.reduce(ts.factory.createLogicalOr);

  yield check;
}

function* createIntersectionCheck(value: ts.Expression, type: ts.IntersectionType, typeChecker: ts.TypeChecker, printer: ts.Printer)
{
  let types = type.types;

  let checks = types.map(type => createCheck(value, type, typeChecker, printer))
                    .map(checks => checks.toArray())
                    .filter(checks => checks.length > 0)
                    .map(checks => checks.reduce(ts.factory.createLogicalAnd));
  if (checks.length === 0) return;
  let check = checks.reduce(ts.factory.createLogicalAnd);

  yield check;
}