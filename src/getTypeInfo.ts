// Adapted from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

import * as ts from "typescript";
//import * as fs from "fs";

interface DocEntry {
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

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(
  fileNames: string[],
  options: ts.CompilerOptions
): DocEntry[] {


  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let output: DocEntry[] = [];

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      // Walk the tree to search for classes
      //ts.forEachChild(sourceFile, visit);
    }
    ts.forEachChild(sourceFile, visit);
  }

  console.log(output);
  // print out the doc
  //fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));

  return output;

  /** visit nodes finding exported classes */
  function visit(node: ts.Node) {
    // Only consider exported nodes
    if (!isNodeExported(node)) {
      return;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      //console.log(node);
      //console.log("isClassDeclaration");
      // This is a top level class, get its symbol
      let symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const classEntries:DocEntry[] = serializeClass(symbol);
        classEntries.forEach(function(entry){
          output.push(entry);
        });
      }
      // No need to walk any further, class expressions/inner declarations
      // cannot be exported
    } else if (ts.isModuleDeclaration(node)) {
      //console.log("isModuleDeclaration");
      // This is a namespace, visit its children
      //console.log(node);
      //ts.forEachChild(node, visit);
    } else if(ts.isVariableStatement(node)){
      //console.log(node);
      // Process variable statements (e.g., for example input/output code)
        // Create a "serializeVariable" method?
        //console.log(node);
        //console.log(node.declarationList.declarations[0].name);
        //let symbol = checker.getSymbolAtLocation(node.parent);
        let symbol = checker.getSymbolAtLocation(node.declarationList.declarations[0].name);
        output.push(serializeVariable(symbol));
    } else if(ts.isFunctionDeclaration(node)) {
      // console.log(node.name)
      let symbol = checker.getSymbolAtLocation(node.name)
      let list = serializeFunction(symbol);
      list.forEach(function(item) { output.push(item) })
    } else if(ts.isInterfaceDeclaration(node)){
      let symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const classEntries:DocEntry[] = serializeClass(symbol);
        classEntries.forEach(function(entry){
          output.push(entry);
        });
      }
    }else{
    /*else if(ts.isMethodDeclaration(node)){
      console.log("isMethodDeclaration");
      //console.log("isMethodDeclaration");
      //console.log(node);
    }*/
      //console.log("ts.isVariableDeclaration(node): " + ts.isVariableDeclaration(node));
      //console.log("node.kind === ts.SyntaxKind.TypeAliasDeclaration): " + (node.kind === ts.SyntaxKind.TypeAliasDeclaration));
      //console.log("else");
      //console.log("ts.SyntaxKind[node.kind]: " + (ts.SyntaxKind[node.kind]));
      //console.log(node);
      //console.log("node.kind: " + node.kind);
      //console.log("ts.SyntaxKind[236]: " + ts.SyntaxKind[236]);
      /*console.log("ts.SyntaxKind.VariableStatement: " + ts.SyntaxKind.VariableStatement);
      console.log("ts.SyntaxKind.VariableDeclarationList: " + ts.SyntaxKind.VariableDeclarationList);
      console.log("ts.SyntaxKind.VariableDeclaration: " + ts.SyntaxKind.VariableDeclaration);*/
      //console.log("testing123");
      //console.log(node.getChildren());
      //ts.forEachChild(node, visit);
      //console.log(node);
    }
      /*else if(ts.isFunctionDeclaration(node)){
      console.log(node);
      ts.forEachChild(node, visit);
    }*/
  }

  /** Serialize a symbol into a json object */
  function serializeSymbol(symbol: ts.Symbol): DocEntry {
    //console.log(symbol);

    //console.log(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!).);
    return {
      name: symbol.getName(),
      /*documentation: ts.displayPartsToString(symbol.getDocumentationComment()),*/
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
    //console.log(symType);
    symbolDetails.signatureInfo = symType
      .getCallSignatures()
      .map(serializeSignature);
    //console.log(symbolDetails.signatureInfo);

    //console.log(symbolDetails);
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

  /*function serializeInterface(symbol: ts.Symbol){

  }*/

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
    //console.log(symbol.valueDeclaration);
    constructorDetails.constructors = constructorType
      .getConstructSignatures()
      .map(serializeSignature);

    //console.log(constructorDetails.constructors);

    detailsList.push(constructorDetails);

    let methodsList = [];
    let propertiesList = [];

    // Methods + properties
    const iter:ts.Iterator<ts.__String> = symbol.members.keys();
    let memberCounter = 0;
    while(memberCounter < symbol.members.size){
      const memberItem = iter.next();
      const memberName = memberItem.value;
      //console.log(memberName);
      memberCounter += 1;

      if(memberName !== "__constructor"){
        const thisSymbol:ts.Symbol = symbol.members.get(memberName);
        let isPublic = true;
        //console.log(ts.SyntaxKind[thisSymbol.declarations[0].kind]);
        if(thisSymbol.declarations[0].modifiers && thisSymbol.declarations[0].modifiers[0]){
          if(thisSymbol.declarations[0].modifiers[0].kind !== ts.SyntaxKind.PublicKeyword){
            isPublic = false;
          }
          //console.log(ts.SyntaxKind[thisSymbol.declarations[0].kind]);
          //console.log(thisSymbol.declarations[0].modifiers);
        }

        if(isPublic){
          //console.log("isPublic");
          let symbolDetails = serializeSymbol(thisSymbol);
          let symType = checker.getTypeOfSymbolAtLocation(
            thisSymbol,
            thisSymbol.valueDeclaration!
          );
          //console.log(checker.getDeclaredTypeOfSymbol(thisSymbol));
          //console.log(checker.getDeclaredTypeOfSymbol(thisSymbol).);
          //console.log(symType);
          //symType.
          //  console.log(thisSymbol.declarations[0]);
          //console.log(symType.getStringIndexType());
          //console.log(thisSymbol.);
          //console.log(symType);
          const sigInfo:DocEntry[] = symType
            .getCallSignatures()
            .map(serializeSignature);
            //console.log(sigInfo[0]);

          if(sigInfo.length > 0){
            symbolDetails.signatureInfo = sigInfo;
          }

          if(thisSymbol.declarations[0].kind === ts.SyntaxKind.PropertyDeclaration){
            propertiesList.push(symbolDetails);
          }else if(thisSymbol.declarations[0].kind === ts.SyntaxKind.MethodDeclaration){
            methodsList.push(symbolDetails);
          }

          //detailsList.push(symbolDetails);
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
      returnType: checker.typeToString(signature.getReturnType())/*,
      documentation: ts.displayPartsToString(signature.getDocumentationComment())*/
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

generateDocumentation(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
});