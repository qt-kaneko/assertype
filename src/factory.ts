import ts from "typescript";

export function createTypePredicateNode({
  assertsModifier,
  parameterName,
  type
}: {
  assertsModifier?: ts.AssertsKeyword,
  parameterName: ts.Identifier | ts.ThisTypeNode | string,
  type?: ts.TypeNode
})
{
  return ts.factory.createTypePredicateNode(
    assertsModifier,
    parameterName,
    type
  );
}

export function createFunctionDeclaration({
  modifiers,
  asteriskToken,
  name,
  typeParameters,
  parameters,
  type,
  body
}: {
  modifiers?: readonly ts.ModifierLike[],
  asteriskToken?: ts.AsteriskToken,
  name?: string | ts.Identifier,
  typeParameters?: readonly ts.TypeParameterDeclaration[],
  parameters: readonly ts.ParameterDeclaration[],
  type?: ts.TypeNode,
  body?: ts.Block
})
{
  return ts.factory.createFunctionDeclaration(
    modifiers,
    asteriskToken,
    name,
    typeParameters,
    parameters,
    type,
    body
  );
}

export function createArrowFunction({
  modifiers,
  typeParameters,
  parameters,
  type,
  equalsGreaterThanToken,
  body
}: {
  modifiers?: readonly ts.Modifier[],
  typeParameters?: readonly ts.TypeParameterDeclaration[],
  parameters: readonly ts.ParameterDeclaration[],
  type?: ts.TypeNode,
  equalsGreaterThanToken?: ts.EqualsGreaterThanToken,
  body: ts.ConciseBody
})
{
  return ts.factory.createArrowFunction(
    modifiers,
    typeParameters,
    parameters,
    type,
    equalsGreaterThanToken,
    body
  )
}

export function createCallExpression({
  expression,
  typeArguments,
  argumentsArray
}: {
  expression: ts.Expression,
  typeArguments?: readonly ts.TypeNode[],
  argumentsArray?: readonly ts.Expression[]
})
{
  return ts.factory.createCallExpression(
    expression,
    typeArguments,
    argumentsArray
  );
}

export function createParameterDeclaration({
  modifiers,
  dotDotDotToken,
  name,
  questionToken,
  type,
  initializer
}: {
  modifiers?: readonly ts.ModifierLike[],
  dotDotDotToken?: ts.DotDotDotToken,
  name: string | ts.BindingName,
  questionToken?: ts.QuestionToken,
  type?: ts.TypeNode,
  initializer?: ts.Expression
})
{
  return ts.factory.createParameterDeclaration(
    modifiers,
    dotDotDotToken,
    name,
    questionToken,
    type,
    initializer
  );
}

export function createBindingElement({
  dotDotDotToken,
  propertyName,
  name,
  initializer
}: {
  dotDotDotToken?: ts.DotDotDotToken,
  propertyName?: string | ts.PropertyName,
  name: string | ts.BindingName,
  initializer?: ts.Expression
})
{
  return ts.factory.createBindingElement(
    dotDotDotToken,
    propertyName,
    name,
    initializer
  );
}