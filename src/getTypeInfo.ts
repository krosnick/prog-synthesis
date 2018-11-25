// Adapted from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

import * as ts from "typescript";
//import * as fs from "fs";

export interface DocEntry {
  name?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  methods?: DocEntry[];
  properties?: DocEntry[];
  signatureInfo?: DocEntry[];
  parameters?: DocEntry[];
  returnType?: string;
}

export interface FileContents{
  classDeclarations: DocEntry[],
  interfaceDeclarations: DocEntry[],
  functionDeclarations: DocEntry[],
  variableStatements: DocEntry[]
};

/** Generate documentation for all classes in a set of .ts files */
export function getDocEntrys(
  fileNames: string[],
  options: ts.CompilerOptions,
  checkDeclarationFiles: boolean
  ): FileContents {


  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let fileContents:FileContents = {
    classDeclarations: [],
    interfaceDeclarations: [],
    functionDeclarations: [],
    variableStatements: []
  };

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    const isDeclarationFile = sourceFile.isDeclarationFile;
    if(checkDeclarationFiles){
      // Walk the tree to search for nodes (classes, variable statements, etc)
      ts.forEachChild(sourceFile, visit);
    }else{ // caller does not want to check declaration files
      if(!isDeclarationFile){
        // Walk the tree to search for nodes (classes, variable statements, etc)
        ts.forEachChild(sourceFile, visit);
      }
    }
  }

  return fileContents;

  /** visit nodes finding exported classes */
  function visit(node: ts.Node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      // This is a top level class, get its symbol
      let symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const classEntries:DocEntry[] = serializeClass(symbol);
        classEntries.forEach(function(entry){
          fileContents.classDeclarations.push(entry);
        });
      }
      // No need to walk any further, class expressions/inner declarations
      // cannot be exported
    } else if(ts.isVariableStatement(node)){
      // Process variable statements (e.g., for example input/output code)
      let symbol = checker.getSymbolAtLocation(node.declarationList.declarations[0].name);
      fileContents.variableStatements.push(serializeVariable(symbol));
    } else if(ts.isFunctionDeclaration(node)) {
      let symbol = checker.getSymbolAtLocation(node.name)
      let list = serializeFunction(symbol);
      list.forEach(function(item) { fileContents.functionDeclarations.push(item) })
    } else if(ts.isInterfaceDeclaration(node.parent)){
      let symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const classEntries:DocEntry[] = serializeClass(symbol);
        classEntries.forEach(function(entry){
          fileContents.interfaceDeclarations.push(entry);
        });
      }
    }else{
    }
  }

  /** Serialize a symbol into a json object */
  function serializeSymbol(symbol: ts.Symbol): DocEntry {
    return {
      name: symbol.getName(),
      type: checker.typeToString(
        checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
      )
    };
  }

  function serializeVariable(symbol: ts.Symbol){
    let symbolDetails = serializeSymbol(symbol);
    let symType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );
    symbolDetails.signatureInfo = symType
      .getCallSignatures()
      .map(serializeSignature);
    return symbolDetails;
  }

  function serializeFunction(symbol: ts.Symbol) {
    let detailsList = [];
    let symbolDetails = serializeSymbol(symbol);
    let symType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );

    const sigInfo:DocEntry[] = symType
      .getCallSignatures()
      .map(serializeSignature);

    if(sigInfo.length > 0){
      symbolDetails.signatureInfo = sigInfo;
    }

    detailsList.push(symbolDetails);

    return detailsList;
  }

  /** Serialize a class symbol information */
  function serializeClass(symbol: ts.Symbol) {

    let detailsList = [];

    // Get the construct signatures

    // Constructor
    let constructorDetails = serializeSymbol(symbol);
    // Get the construct signatures
    let constructorType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );
    constructorDetails.constructors = constructorType
      .getConstructSignatures()
      .map(serializeSignature);

    detailsList.push(constructorDetails);

    let methodsList = [];
    let propertiesList = [];

    // Methods + properties
    const iter:ts.Iterator<ts.__String> = symbol.members.keys();
    let memberCounter = 0;
    while(memberCounter < symbol.members.size){
      const memberItem = iter.next();
      const memberName = memberItem.value;
      memberCounter += 1;

      if(memberName !== "__constructor"){
        const thisSymbol:ts.Symbol = symbol.members.get(memberName);
        let isPublic = true;
        if(thisSymbol.declarations[0].modifiers && thisSymbol.declarations[0].modifiers[0]){
          if(thisSymbol.declarations[0].modifiers[0].kind !== ts.SyntaxKind.PublicKeyword){
            isPublic = false;
          }
        }

        if(isPublic){
          let symbolDetails = serializeSymbol(thisSymbol);
          let symType = checker.getTypeOfSymbolAtLocation(
            thisSymbol,
            thisSymbol.valueDeclaration!
          );
          const sigInfo:DocEntry[] = symType
            .getCallSignatures()
            .map(serializeSignature);

          if(sigInfo.length > 0){
            symbolDetails.signatureInfo = sigInfo;
          }

          if(thisSymbol.declarations[0].kind === ts.SyntaxKind.PropertyDeclaration){
            propertiesList.push(symbolDetails);
          }else if(thisSymbol.declarations[0].kind === ts.SyntaxKind.MethodDeclaration){
            methodsList.push(symbolDetails);
          }
        }
      }
    }
    constructorDetails.methods = methodsList;
    constructorDetails.properties = propertiesList;
    return detailsList;
  }

  /** Serialize a signature (call or construct) */
  function serializeSignature(signature: ts.Signature) {
    return {
      parameters: signature.parameters.map(serializeSymbol),
      returnType: checker.typeToString(signature.getReturnType())
    };
  }

  /** True if this is visible outside this file, false otherwise */
  function isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }
}