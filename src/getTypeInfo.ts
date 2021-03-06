// Adapted from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

import * as ts from "typescript";
import { nonStrictEval } from "./nonStrictEval";

export interface DocEntry {
  name?: string;
  fileName?: string;
  documentation?: string;
  type?: string;
  constructors?: DocEntry[];
  methods?: {
    instanceMethods?: DocEntry[];
    staticMethods?: DocEntry[];
  };
  properties?: {
    instanceProperties?: DocEntry[];
    staticProperties?: DocEntry[];
  };
  signatureInfo?: DocEntry[];
  parameters?: DocEntry[];
  returnType?: string;
  value?;
  optional?:boolean;
}

export interface FileContents{
  classDeclarations: DocEntry[],
  /*interfaceDeclarations: DocEntry[],*/
  interfaceDeclarations: {[interfaceName:string]:DocEntry},
  functionDeclarations: DocEntry[],
  variableStatements: DocEntry[]
};


let inputFileContentsString:string;
let isDeclarationFile;

export function isVariableStatement(fileNames: string[],
  options: ts.CompilerOptions): boolean {
  let program = ts.createProgram(fileNames, options);
  let checker = program.getTypeChecker();

  let isVarStatement:boolean = true;
  for (const sourceFile of program.getSourceFiles()) {
    isDeclarationFile = sourceFile.isDeclarationFile;
    if(!sourceFile.isDeclarationFile){
      // Walk the tree to search for nodes (classes, variable statements, etc)
      ts.forEachChild(sourceFile, function(node: ts.Node){
        //console.log(node);
        //console.log(ts.SyntaxKind[node.kind]);
        if(!(node.kind === ts.SyntaxKind.VariableStatement || node.kind === ts.SyntaxKind.EndOfFileToken)){
          isVarStatement = false;
        }
      });
    }
  }
  return isVarStatement;
}

/** Generate documentation for all classes in a set of .ts files */
export function getDocEntrys(
  fileNames: string[],
  options: ts.CompilerOptions,
  checkDeclarationFiles: boolean,
  inputFileContents:string
  ): FileContents {

  inputFileContentsString = inputFileContents;
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  let fileContents:FileContents = {
    classDeclarations: [],
    interfaceDeclarations: {},
    functionDeclarations: [],
    variableStatements: []
  };

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    isDeclarationFile = sourceFile.isDeclarationFile;
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

  // console.log(output);
  //////////////////// TEST GET POSSIBLE FUNCTIONS ////////////////////
  // let testProgram = ts.createProgram(["data/exampleOutput.ts"], options);
  // let testChecker = testProgram.getTypeChecker();
  // // var input: DocEntry[] = [];
  // for (const sourceFile of testProgram.getSourceFiles()) {
  //   if (!sourceFile.isDeclarationFile) {
  //     // Walk the tree to search for classes
  //     ts.forEachChild(sourceFile, visit);
  //   }
  //   //ts.forEachChild(sourceFile, visit);
  // }
  // var TESTInput = output.slice(0,2);
  // var TESTCandidates = output.slice(2,-1);
  // var TESTOutput = output.slice(-1);
  // // console.log(testProgram);
  // let possibleFunctions = getPossibleFunctions(TESTInput, TESTOutput, TESTCandidates);
  ////////////////////////////// END TEST //////////////////////////////
  // print out th   e doc
  //fs.writeFileSync("classes.json", JSON.stringify(output, undefined, 4));

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
      //console.log(varDocEntry.name);
      const varDocEntry:DocEntry = serializeVariable(symbol, node);
      fileContents.variableStatements.push(varDocEntry);
    } else if(ts.isFunctionDeclaration(node)) {
      let symbol = checker.getSymbolAtLocation(node.name);

      /*if(symbol.getName() === "parseInt"){
        //console.log("parseInt");
        //console.log(node);
        //console.log(node.modifiers);
        //console.log(node.parameters[1].getChildren());
        node.parameters.forEach(function(param){
          console.log(checker.isOptionalParameter(param));
        });
      }*/
      let list = serializeFunction(symbol, node);
      list.forEach(function(item) { fileContents.functionDeclarations.push(item) });
    } else if(ts.isInterfaceDeclaration(node)){
      //console.log("isInterfaceDeclaration");
      let symbol = checker.getSymbolAtLocation(node.name);
      //console.log(symbol.name);
      if (symbol) {
        const classEntries:DocEntry[] = serializeClass(symbol);
        classEntries.forEach(function(entry){
          //fileContents.interfaceDeclarations.push(entry);
          fileContents.interfaceDeclarations[entry.name] = entry;
          //console.log(entry.name);
          /*if(entry.name === "Date"){
            //console.log(entry);
            console.log(node);
          }*/
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

  function serializeVariable(symbol: ts.Symbol, node: ts.Node){
    let symbolDetails = serializeSymbol(symbol);

    /*if(symbol.valueDeclaration["initializer"]["text"]){ // probably a primitive, has "text" property
      symbolDetails.value = symbol.valueDeclaration["initializer"]["text"]; // works for primitives
      //console.log(symbolDetails.value);
    }else if(symbol.valueDeclaration["initializer"]["symbol"]){
      // assume has property "members"
      symbolDetails.value = symbol.valueDeclaration["initializer"]["symbol"]["members"].toString();
      //console.log(symbolDetails.value);
    }else{
      console.log("Shouldn't get here");
      //console.log(symbol);
      //console.log(symbol.toString());
      //console.log(symbol.valueDeclaration["initializer"]["elements"]);
      // seems to be issue with type "boolean"
    }*/
    //symbolDetails.value = symbol.valueDeclaration["initializer"]["text"]; // works for primitives
    //console.log(symbolDetails.value); // works for primitives
    //console.log(symbol);
    //console.log(symbol.valueDeclaration["initializer"]["symbol"]);
    //console.log(symbol.valueDeclaration["initializer"]["symbol"]["members"]);

    let symType = checker.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );
    symbolDetails.signatureInfo = symType
      .getCallSignatures()
      .map(serializeSignature);

    /*const memberMethodsProperties:{
      methods: DocEntry[];
      properties: DocEntry[];
    } = processMethodsAndProperties(symbol.members);

    const staticMethodsProperties:{
      methods: DocEntry[];
      properties: DocEntry[];
    } = processMethodsAndProperties(symbol.exports);*/
    //console.log(symbol.declarations);
    //console.log(symbol.valueDeclaration);
    //console.log(symbol.valueDeclaration["symbol"]);
    //console.log(symbol.valueDeclaration["initializer"]["expression"]);


    const codeLine:string = node.getText();
    //const codeLine = symbol.valueDeclaration.getText();
    //console.log(codeLine);
    const indexOfEqualSign:number = codeLine.indexOf("=") + 1;
    const indexOfSemicolon:number = codeLine.indexOf(";");
    const valueString:string = codeLine.substring(indexOfEqualSign, indexOfSemicolon).trim();

    /*let funcObject;
    try {
        funcObject = nonStrictEval(funcName); // native JS/TS function?
    }catch(error){
        funcObject = nonStrictEval(exampleInput[funcName]); // function defined in input file
    }*/

    /*if(valueString === 'new C("hello")'){
      //console.log(ts.SyntaxKind[symbol.declarations[0].kind]);
      console.log(node);
      const classType = nonStrictEval(exampleInput["C"]);
      const classInstance = new classType("hello");
      symbolDetails.value = classInstance;
    }else{
      const varValue = eval("(" + valueString + ")");
      symbolDetails.value = varValue;
    }*/
    //console.log(eval("(const numA:number = 10;)"));

    //const varValue = eval("(" + inputFileContentsString + "\n" + valueString + ")");
    let varValue;
    /*try{
      varValue = eval("(" + inputFileContentsString + "\n" + valueString + ")");
    }catch{
      varValue = eval(inputFileContentsString + "\n" + valueString);
    }*/

    /*console.log("valueString");
    console.log(valueString);*/

    // We only want to include things that are in global scope
      // So shouldn't be inside of an interface or class, etc
    /*console.log("symbol.name");
    console.log(symbol.name);
    console.log("ts.SyntaxKind[node.parent.kind]");
    console.log(ts.SyntaxKind[node.parent.kind]);*/
    //if(ts.SyntaxKind[node.parent.kind] === "SourceFile"){

    // Needs to have "declare" in it (i.e., global scope)
    /*if(symbol.name === "onabort"){
      console.log(symbol.name);
      //console.log(codeLine);
      console.log(node.getFullText());
    }*/

    //if((codeLine.indexOf("declare ") > -1 && (codeLine.indexOf("var ") > -1 || codeLine.indexOf("const ") > -1))){
    if((codeLine.indexOf("=") === -1 || codeLine.indexOf("=") === codeLine.indexOf("=>"))){ // Just a declaration statement, no value defined
      varValue = symbol.name;

      if(symbol.name === "Array"){
        //console.log(symbol);
        //console.log(symbol.members);
        //console.log(symbol.exports);
        //console.log(symbol.globalExports);
        //console.log(symbol.members)
        /*const methodsAndProperties:{
          methods: DocEntry[];
          properties: DocEntry[];
        } = processMethodsAndPropertiesForJSDeclarations(symbol.members);*/
        //console.log(methodsAndProperties);
      }
      /*console.log(varValue);
      console.log(node.getText());*/
      /*if(symbol.name === "NaN"){
        // console.log("symbol.name");
        // console.log(symbol.name);
        // console.log("ts.SyntaxKind[node.parent.kind]");
        // console.log(ts.SyntaxKind[node.parent.kind]);
        // console.log("ts.SyntaxKind[node.kind]");
        // console.log(ts.SyntaxKind[node.kind]);
        // console.log("ts.SyntaxKind.ConstKeyword: " + ts.SyntaxKind.ConstKeyword);
        // console.log("ts.SyntaxKind.DeclareKeyword: " + ts.SyntaxKind.DeclareKeyword);
        //console.log(symbol);
        console.log("---" + symbol.name + "---");
        const nodeChildren = node.getChildren();
        nodeChildren.forEach(function(nodeChild){
          //console.log(ts.SyntaxKind[nodeChild.kind]);
          if(ts.SyntaxKind[nodeChild.kind] === "SyntaxList" || ts.SyntaxKind[nodeChild.kind] === "VariableDeclarationList"){
            const syntaxListChildren = nodeChild.getChildren();
            syntaxListChildren.forEach(function(grandChild){
              //console.log(ts.SyntaxKind[grandChild.kind]);
            });
          }
        });
        //console.log(node.getChildren());
      }else if(symbol.name === "onabort"){
        console.log("---" + symbol.name + "---");
        const nodeChildren = node.getChildren();
        nodeChildren.forEach(function(nodeChild){
          //console.log(ts.SyntaxKind[nodeChild.kind]);
          if(ts.SyntaxKind[nodeChild.kind] === "SyntaxList" || ts.SyntaxKind[nodeChild.kind] === "VariableDeclarationList"){
            const syntaxListChildren = nodeChild.getChildren();
            syntaxListChildren.forEach(function(grandChild){
              //console.log(ts.SyntaxKind[grandChild.kind]);
            });
          }
        });
      }else if(symbol.name === "Collator"){
        console.log("---" + symbol.name + "---");
        const nodeChildren = node.getChildren();
        nodeChildren.forEach(function(nodeChild){
          //console.log(ts.SyntaxKind[nodeChild.kind]);
          if(ts.SyntaxKind[nodeChild.kind] === "SyntaxList" || ts.SyntaxKind[nodeChild.kind] === "VariableDeclarationList"){
            const syntaxListChildren = nodeChild.getChildren();
            syntaxListChildren.forEach(function(grandChild){
              //console.log(ts.SyntaxKind[grandChild.kind]);
            });
          }
        });
      }*/
      /*else if(symbol.name === "constructor"){
        console.log("symbol.name");
        console.log(symbol.name);
        console.log("ts.SyntaxKind[node.parent.kind]");
        console.log(ts.SyntaxKind[node.parent.kind]);
        console.log("ts.SyntaxKind[node.kind]");
        console.log(ts.SyntaxKind[node.kind]);
      }*/
    }else{
      try{
        varValue = nonStrictEval("(" + valueString + ")");
      }catch{
        try{
          varValue = nonStrictEval("(" + inputFileContentsString + valueString + ")");
        }catch{
          varValue = nonStrictEval(inputFileContentsString + valueString);
        }
      }
    }
    //}else{
      /*console.log("DOES NOT CONTAIN DECLARE, OR VAR OR CONST");
      console.log(node.getText());*/
    //}
    //}

    /*console.log("full thing to eval");
    console.log(inputFileContentsString + valueString);
    console.log("varValue");
    console.log(varValue);*/
    symbolDetails.value = varValue;
    /*const varValue = eval("(" + valueString + ")");
    symbolDetails.value = varValue;*/

    //console.log(symbolDetails.value);
    //console.log(typeof symbolDetails.value);

    /*const classType = nonStrictEval(userDefinedClasses["C"]);
    console.log(classType);
    const classInstance = new classType('test');
    console.log(classInstance);

    console.log(Object.keys(classInstance));*/

    /*if((typeof symbolDetails.value) === "object"){
      //console.log(Object.keys(symbolDetails.value));
      //console.log(Object.getOwnPropertyDescriptors(symbolDetails.value));
    }*/

    //console.log(symbolDetails);

    // call serializeVariable on class's keys?

    return symbolDetails;
  }

  function serializeFunction(symbol: ts.Symbol, node: ts.Node) {

    let paramOptionalList = [];
    if(ts.isFunctionDeclaration(node)){
      // Should always enter here
      node.parameters.forEach(function(param){
        paramOptionalList.push(checker.isOptionalParameter(param));
      });
    }
    /*if(symbol.name === "parseInt"){
      console.log(paramOptionalList);
    }*/
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
      const params = sigInfo[0].parameters;
      for(let i = 0; i < params.length; i++){
        params[i]["optional"] = paramOptionalList[i];
      }
      symbolDetails.signatureInfo = sigInfo;
    }

    /*if(symbol.name === "parseInt"){
        console.log(symbolDetails.signatureInfo[0].parameters);
    }*/

    detailsList.push(symbolDetails);
    //console.log(symbolDetails.name);

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

    /*let methodsList:DocEntry[] = [];
    let propertiesList:DocEntry[] = [];*/

    // Static(?) methods + properties?
    //console.log(symbol.exports.size);
    //symbol.

    let memberMethodsProperties:{
      methods: DocEntry[];
      properties: DocEntry[];
    };

    let staticMethodsProperties:{
      methods: DocEntry[];
      properties: DocEntry[];
    };

    if(!isDeclarationFile){
      memberMethodsProperties = processMethodsAndProperties(symbol.members);
      staticMethodsProperties = processMethodsAndProperties(symbol.exports);
      constructorDetails.methods = {
        "instanceMethods": memberMethodsProperties.methods,
        "staticMethods": staticMethodsProperties.methods
      };
      constructorDetails.properties = {
        "instanceProperties": memberMethodsProperties.properties,
        "staticProperties": staticMethodsProperties.properties
      };
    }else{
      //console.log(symbol.name);
      const interfaceMethodsProperties:{
        methods: DocEntry[];
        properties: DocEntry[];
      } = processMethodsAndPropertiesForJSDeclarations(symbol.name, symbol.members);
      //console.log(test);
      //if(symbol.name === "ObjectConstructor"){
      /*if(symbol.name === "Math"){
      //if(symbol.name === "ReadonlyArray"){
        console.log(interfaceMethodsProperties);
      }*/

      constructorDetails.methods = {
        "instanceMethods": interfaceMethodsProperties.methods,
        "staticMethods": interfaceMethodsProperties.methods
      };
      constructorDetails.properties = {
        "instanceProperties": interfaceMethodsProperties.properties,
        "staticProperties": interfaceMethodsProperties.properties
      };
    }
  //if(symbol.name === "ObjectConstructor"){
    //if(symbol.name === "ArrayConstructor"){
    //if(symbol.name === "Math"){
    /*console.log("symbol.members");
    console.log(symbol.members);*/
    //console.log(symbol);

    // Do this only if declaration file

  //}

    /*// Instance methods + properties
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
    }*/
    /*constructorDetails.methods = {
      "instanceMethods": memberMethodsProperties.methods,
      "staticMethods": staticMethodsProperties.methods
    };
    constructorDetails.properties = {
      "instanceProperties": memberMethodsProperties.properties,
      "staticProperties": staticMethodsProperties.properties
    };*/
    return detailsList;
  }

  // Create DocEntry lists of methods and properties from the UnderscoreEscapedMap object
  // Only include public methods/properties
  function processMethodsAndProperties(methodsAndProperties:ts.UnderscoreEscapedMap<ts.Symbol>):{methods:DocEntry[],properties:DocEntry[]}{
    let methodsList:DocEntry[] = [];
    let propertiesList:DocEntry[] = [];

    if(methodsAndProperties && methodsAndProperties.size > 0){
      const iter:ts.Iterator<ts.__String> = methodsAndProperties.keys();
      let memberCounter = 0;
      while(memberCounter < methodsAndProperties.size){
        const memberItem = iter.next();
        const memberName = memberItem.value;
        memberCounter += 1;

        if(memberName !== "__constructor"){
          const thisSymbol:ts.Symbol = methodsAndProperties.get(memberName);
          let isPublic = true;
          if(thisSymbol.declarations){
            if(thisSymbol.declarations[0] && thisSymbol.declarations[0].modifiers && thisSymbol.declarations[0].modifiers[0]){
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
      }
    }
    return {
      "methods": methodsList,
      "properties": propertiesList
    };
  }

  function processMethodsAndPropertiesForJSDeclarations(parentSymbolName:string, methodsAndProperties:ts.UnderscoreEscapedMap<ts.Symbol>):{methods:DocEntry[],properties:DocEntry[]}{
  //function processMethodsAndPropertiesForJSDeclarations(parentSymbolName:string, methodsAndProperties:ts.UnderscoreEscapedMap<ts.Symbol>):{methods:{[interfaceName:string]: DocEntry},properties:{[interfaceName:string]: DocEntry}}{
    let methodsList:DocEntry[] = [];
    let propertiesList:DocEntry[] = [];

    if(methodsAndProperties && methodsAndProperties.size > 0){
      const iter:ts.Iterator<ts.__String> = methodsAndProperties.keys();
      let memberCounter = 0;
      while(memberCounter < methodsAndProperties.size){
        const memberItem = iter.next();
        const memberName = memberItem.value;
        //console.log(memberName);
        memberCounter += 1;

        if(memberName !== "__constructor"){
          const thisSymbol:ts.Symbol = methodsAndProperties.get(memberName);
          //console.log(thisSymbol);
          let isPublic = true;
          //console.log(thisSymbol.declarations[0].modifiers);
          if(thisSymbol.declarations){
            /*if(thisSymbol.declarations[0] && thisSymbol.declarations[0].modifiers && thisSymbol.declarations[0].modifiers[0]){
              if(thisSymbol.declarations[0].modifiers[0].kind !== ts.SyntaxKind.PublicKeyword){
                isPublic = false;
              }
            }*/
            //if(isPublic){
              let symbolDetails = serializeSymbol(thisSymbol);
              let symType = checker.getTypeOfSymbolAtLocation(
                thisSymbol,
                thisSymbol.valueDeclaration!
              );
              const sigInfo:DocEntry[] = symType
                .getCallSignatures()
                .map(serializeSignature);

              //console.log(sigInfo);
              if(sigInfo.length > 0){
                symbolDetails.signatureInfo = sigInfo;
              }
              // Do this later for the actual instantiated object
              /*else{
                let memberType = Object.prototype.toString.call(eval(parentSymbolName + "." + thisSymbol.name)).slice(8, -1);
                if(memberType === "Boolean" || memberType === "Null" || memberType === "Undefined" || memberType === "Number" || memberType === "String"){
                  memberType = memberType.toLowerCase();
                }
                symbolDetails.type = memberType;
              }*/
              //console.log(sigInfo);

              //console.log(typeof eval(parentSymbolName + "." + thisSymbol.name));
              //console.log(typeof [1,2]);
              //console.log(Object.prototype.toString.call(eval(parentSymbolName + "." + thisSymbol.name)).slice(8, -1));
              /*if(memberName === "E"){
                //console.log(thisSymbol);
                console.log(typeof eval(parentSymbolName + "." + thisSymbol.name));
              }*/

              //console.log(memberName);
              /*if(parentSymbolName === "Math"){
                console.log(ts.SyntaxKind[thisSymbol.declarations[0].kind]);
              }*/

              if(thisSymbol.declarations[0].kind === ts.SyntaxKind.PropertySignature){
                propertiesList.push(symbolDetails);
              }else if(thisSymbol.declarations[0].kind === ts.SyntaxKind.MethodSignature){
                methodsList.push(symbolDetails);
              }
              /*if(thisSymbol.declarations[0].kind === ts.SyntaxKind.PropertyDeclaration){
                propertiesList.push(symbolDetails);
              }else if(thisSymbol.declarations[0].kind === ts.SyntaxKind.MethodDeclaration){
                methodsList.push(symbolDetails);
              }*/
            //}
          }
        }
      }
    }
    return {
      "methods": methodsList,
      "properties": propertiesList
    };
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

function typesMatch(canType: string, otherType: string) {
  /*console.log("canType: " + canType);
  console.log("otherType: " + otherType);*/
  if (canType === otherType) {
    // We consider functions that return the exact type as example output
    return true;
  }
  else if (otherType.substring(otherType.length - 2) === "[]") {
    // We want an array so we consider functions that return any or any[]
    if (canType === "any" ||
        canType === "any[]") {
      return true;
    }
  }
  else if (otherType.substring(otherType.length - 2) !== "[]") {
    // We want a single value so we consider functions that return any
    if (canType === "any") {
      return true;
    }
  }
  else if(canType === "{}" && (typeof otherType) === "object"){
    return true;
  }
  return false;
}

function paramsAcceptable(sigInfo, inp: DocEntry[]) {
  for (var i: number = 0; i < sigInfo.parameters.length; i++) {
    var paramFound = false;
    // For each of the parameters in the candidate function, check if there
    // is a variable of an acceptable type that can be passed in
    for (var j = 0; j < inp.length; j++) {
      if (typesMatch(sigInfo.parameters[i].type, inp[j].type)) {
        paramFound = true;
      }
    }
    // If for any one parameter, there was no variable that could be passed
    // in, return false
    if (paramFound === false) {
      return false
    };
  }
  return true;
}

function addCandidateFunction(candidateVariables: DocEntry[],
                              candidateFunction: DocEntry,
                              outputDE: DocEntry[],
                              possibleFunctions: any[]) {
  if ("signatureInfo" in candidateFunction) {
    if (candidateFunction.signatureInfo.length > 0) {
      // Consider output values
      //console.log("Consider output values for " + candidateFunction.name);
      //console.log("Types match: " + typesMatch(candidateFunction.signatureInfo[0].returnType, outputDE[0].type));
      //console.log("Params acceptable: " + paramsAcceptable(candidateFunction.signatureInfo[0], candidateVariables));
      if (typesMatch(candidateFunction.signatureInfo[0].returnType, outputDE[0].type) &&
          paramsAcceptable(candidateFunction.signatureInfo[0], candidateVariables)) {
        // Modifies the list in the caller's scope, since possibleFunctions passed in
        //console.log("Types match + params acceptable" + candidateFunction.name);
        possibleFunctions.push(candidateFunction);
      }
    }
  }
}

export function getPossibleFunctions(candidateVariables: DocEntry[],
                                     candidateFunctions: DocEntry[],
                                     outputDE: DocEntry[]) {

  /*console.log("candidateVariables");
  console.log(candidateVariables);
  console.log("candidateFunctions");
  console.log(candidateFunctions);
  console.log("outputDE");
  console.log(outputDE);*/
  var possibleFunctions = [];
  candidateFunctions.forEach((candidateFunction) => {
    addCandidateFunction(candidateVariables, candidateFunction, outputDE, possibleFunctions);
  });
  /*console.log("POSSIBLE FUNCTIONS: ");
  console.log(possibleFunctions);*/
  return possibleFunctions;
}

function classObjectInstantiated(classDeclaration, inputFileContents) {
  //var instance_found = false;
  var instance_found = undefined;
  inputFileContents.variableStatements.forEach((variable) => {
    if (variable.type === classDeclaration.name) {
      //console.log("variable.value");
      //console.log(variable.value);
      //console.log(variable.value["pubValue"]);
      //console.log(variable.value["forAll"]);
      //instance_found = true;
      instance_found = variable;
    }
  });
  return instance_found;
}

export function getPossibleMethodsAndVariables(inputFileContents: FileContents,
                                               outputFileContents: FileContents) {
  var possibleMethodsAndVariables = {};
  possibleMethodsAndVariables["possibleFunctions"] = [];
  possibleMethodsAndVariables["mapClassToInstanceMethods"] = {};
  possibleMethodsAndVariables["mapClassToInstanceProperties"] = {};
  possibleMethodsAndVariables["mapClassToStaticMethods"] = {};
  possibleMethodsAndVariables["mapClassToStaticProperties"] = {};
  possibleMethodsAndVariables["mapInstanceNameToObject"] = {}; // Used later for having easy access to class instance for instance method call

  var possibleVariables = inputFileContents.variableStatements;
  possibleMethodsAndVariables["possibleVariables"] = inputFileContents.variableStatements;

  inputFileContents.classDeclarations.forEach((classDeclaration) => {
    const objectInstantiation = classObjectInstantiated(classDeclaration, inputFileContents);
    //if (classObjectInstantiated(classDeclaration, inputFileContents)) {

    /*if(objectInstantiation !== undefined){
      //console.log("classDeclaration.value");
      //console.log(classDeclaration.value);
      //console.log(objectInstantiation.value);
      possibleVariables = possibleVariables.concat(classDeclaration.properties.instanceProperties);
      possibleMethodsAndVariables["mapClassToInstanceProperties"][classDeclaration.name] = classDeclaration.properties.instanceProperties;
    }
    possibleVariables = possibleVariables.concat(classDeclaration.properties.staticProperties);
    possibleMethodsAndVariables["mapClassToStaticProperties"][classDeclaration.name] = classDeclaration.properties.staticProperties;
    */

    if(objectInstantiation && objectInstantiation.value){

      // If it does have a value, use that for determining values of instance + static properties

      // For both classDeclaration.properties.instanceProperties and classDeclaration.properties.staticProperties
        // Try accessing the property name in objectInstantiation.value to get the value
      const objectValue = objectInstantiation.value;
      //console.log("objectValue");
      //console.log(objectValue);
      setObjectPropertyValues(classDeclaration.properties.instanceProperties, objectValue);
      setObjectPropertyValues(classDeclaration.properties.staticProperties, objectValue);

      const objectName = objectInstantiation.name;
      // Instance properties only accessible when the class object is instantiated (as it is here)
      possibleVariables = possibleVariables.concat(classDeclaration.properties.instanceProperties);
      //possibleMethodsAndVariables["mapClassToInstanceProperties"][classDeclaration.name] = classDeclaration.properties.instanceProperties;
      possibleMethodsAndVariables["mapClassToInstanceProperties"][objectName] = classDeclaration.properties.instanceProperties;

      possibleMethodsAndVariables["mapInstanceNameToObject"][objectName] = objectValue;
    }

    // Do regardless (if there are static properties, they should always be accessible)
    possibleVariables = possibleVariables.concat(classDeclaration.properties.staticProperties);
    possibleMethodsAndVariables["mapClassToStaticProperties"][classDeclaration.name] = classDeclaration.properties.staticProperties;
  });

  inputFileContents.classDeclarations.forEach((classDeclaration) => {
    //if (classObjectInstantiated(classDeclaration, inputFileContents)) {
    const objectInstantiation = classObjectInstantiated(classDeclaration, inputFileContents);
    if(objectInstantiation !== undefined) {
      // If you want to consider the instance methods even if the class has not been instantiated, then move this outside of the if statement
      /*console.log("classDeclaration.methods.instanceMethods");
      console.log(classDeclaration.methods.instanceMethods);*/
      const objectName = objectInstantiation.name;
      /*possibleMethodsAndVariables["mapClassToInstanceMethods"][classDeclaration.name] = getPossibleFunctions(possibleVariables,
                                                                                                      classDeclaration.methods.instanceMethods,
                                                                                                      outputFileContents.variableStatements);*/
      possibleMethodsAndVariables["mapClassToInstanceMethods"][objectName] = getPossibleFunctions(possibleVariables,
                                                                                                        classDeclaration.methods.instanceMethods,
                                                                                                        outputFileContents.variableStatements);
    }
    /*console.log("classDeclaration.methods.staticMethods");
    console.log(classDeclaration.methods.staticMethods);*/
    possibleMethodsAndVariables["mapClassToStaticMethods"][classDeclaration.name] = getPossibleFunctions(possibleVariables,
                                                                                                  classDeclaration.methods.staticMethods,
                                                                                                  outputFileContents.variableStatements);
  });

  // possibleMethodsAndVariables["possibleVariables"] = possibleVariables;
  possibleMethodsAndVariables["possibleFunctions"] = getPossibleFunctions(possibleVariables,
                                                                   inputFileContents.functionDeclarations,
                                                                   outputFileContents.variableStatements);
  return possibleMethodsAndVariables;
}

function setObjectPropertyValues(propertyList:DocEntry[], objectValue){
  propertyList.forEach(function(property:DocEntry){
    const propertyValue = objectValue[property.name];
    if(propertyValue){
      property.value = propertyValue;
    }
    //console.log(property);
  });
}

export function mapVariablesToTypes(variablesArray) {
  //console.log(variablesArray);
  let variableTypeMap = {}
  variablesArray.forEach((variable) => {
    if ("type" in variable) {
      if (!(variable.type in variableTypeMap)) {
        variableTypeMap[variable.type] = [];
      }
      // variable is a DocEntry, if you do not need all the extra data,
      // just push variable.name to the variableTypeMap
      variableTypeMap[variable.type].push(variable);
    }
  });
  return variableTypeMap;
}
