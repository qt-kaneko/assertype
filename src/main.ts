#!/usr/bin/env node

import ts from "typescript";
import path from "path";
import fs from "fs";

import * as factory from "./factory.js";
import { createCheck } from "./createCheck.js";

const VALUE = `v`;

let args = process.argv.slice(2);

let configPath = args[0];
let configDir = path.dirname(configPath);

let configFile = ts.readJsonConfigFile(args[0], ts.sys.readFile);
let config = ts.parseJsonSourceFileConfigFileContent(configFile, ts.sys, configDir);

let printer = ts.createPrinter(config.options);
let program = ts.createProgram({
  rootNames: config.fileNames,
  options: config.options,
  configFileParsingDiagnostics: config.errors
});
let typeChecker = program.getTypeChecker();

let sources = config.fileNames
                    .map(program.getSourceFile)
                    .filter(source => source !== undefined);
for (let source of sources)
{
  let text = source.text;
  let edits: Record<number, number> = {};

  let statements = source.statements;
  let declarations = statements.filter(statement => ts.isTypeAliasDeclaration(statement)
                                                 || ts.isInterfaceDeclaration(statement));
  for (let declaration of declarations)
  {
    let symbol = typeChecker.getSymbolAtLocation(declaration.name)!;

    let marker = `assertype`;
    let guardName = symbol.name;

    let guard = statements.find(statement => ts.isFunctionDeclaration(statement)
                                          && statement.name?.text === guardName
                                          && ts.getJSDocTags(statement).some(tag => tag.tagName.text === marker));
    if (guard === undefined) continue;

    let hasExport = declaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;

    let modifiers: ts.ModifierLike[] = [];
    if (hasExport)
    {
      modifiers.push(ts.factory.createModifier(ts.SyntaxKind.ExportKeyword));
    }

    let identifier = ts.factory.createIdentifier(VALUE)
    let parameter = factory.createParameterDeclaration({name: identifier});

    let type = typeChecker.getDeclaredTypeOfSymbol(symbol);

    let guardType = factory.createTypePredicateNode({
      parameterName: identifier,
      type: typeChecker.typeToTypeNode(type, undefined, undefined)
    });

    let checks = createCheck(identifier, type, typeChecker, printer).toArray();
    if (checks.length === 0) continue;
    let check = checks.reduce(ts.factory.createLogicalAnd);

    let $return = ts.factory.createReturnStatement(check);
    let body = ts.factory.createBlock([$return]);

    let pos = guard.pos;
    let end = guard.end;

    for (let editString in edits)
    {
      let edit = +editString;
      if (edit >= pos) break;

      let offset = edits[edit];
      pos += offset;
      end += offset;
    }

    let skipWhitespaceRegExp = /[^\s]/g;
    skipWhitespaceRegExp.lastIndex = pos;
    pos = skipWhitespaceRegExp.exec(text)!.index;

    guard = factory.createFunctionDeclaration({
      modifiers: modifiers,
      name: guardName,
      parameters: [parameter],
      body: body,
      type: guardType
    });

    let guardText = printer.printNode(ts.EmitHint.Unspecified, guard, source);
    guardText = `/** @ts-ignore @${marker} */ // eslint-disable-next-line\n` + guardText;

    let length = end - pos;
    let offset = guardText.length - length;
    edits[pos] = offset;

    text = text.slice(0, pos) + guardText + text.slice(end);
  }

  fs.writeFileSync(source.fileName, text);
}