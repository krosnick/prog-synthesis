// Adapted from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API

import * as ts from "typescript";
//import {C} from "./test";
import * as userDefinedClasses from "./test";
import { nonStrictEval } from "./nonStrictEval";
//import * as fs from "fs";

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
      let symbol = checker.getSymbolAtLocation(node.name)
      let list = serializeFunction(symbol);
      list.forEach(function(item) { fileContents.functionDeclarations.push(item) })
    } else if(ts.isInterfaceDeclaration(node)){
      let symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const classEntries:DocEntry[] = serializeClass(symbol);
        classEntries.forEach(function(entry){
          fileContents.interfaceDeclarations.push(entry);
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
    const indexOfEqualSign:number = codeLine.indexOf("=") + 1;
    const indexOfSemicolon:number = codeLine.indexOf(";");
    const valueString:string = codeLine.substring(indexOfEqualSign, indexOfSemicolon).trim();
    
    if(valueString === 'new C("hello")'){
      const classType = nonStrictEval(userDefinedClasses["C"]);
      const classInstance = new classType("hello");
      symbolDetails.value = classInstance;
    }else{
      const varValue = eval("(" + valueString + ")");
      symbolDetails.value = varValue;
    }
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

    const memberMethodsProperties:{
      methods: DocEntry[];
      properties: DocEntry[];
    } = processMethodsAndProperties(symbol.members);

    const staticMethodsProperties:{
      methods: DocEntry[];
      properties: DocEntry[];
    } = processMethodsAndProperties(symbol.exports);
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
    //constructorDetails.methods = methodsList;
    constructorDetails.methods = {
      "instanceMethods": memberMethodsProperties.methods,
      "staticMethods": staticMethodsProperties.methods
    };
    /*console.log("constructorDetails.methods");
    console.log(constructorDetails.methods);*/
    //constructorDetails.properties = memberMethodsProperties.properties;
    constructorDetails.properties = {
      "instanceProperties": memberMethodsProperties.properties,
      "staticProperties": staticMethodsProperties.properties
    };
    /*console.log("constructorDetails.properties");
    console.log(constructorDetails.properties);*/
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
      if (typesMatch(candidateFunction.signatureInfo[0].returnType, outputDE[0].type) &&
          paramsAcceptable(candidateFunction.signatureInfo[0], candidateVariables)) {
        // Modifies the list in the caller's scope, since possibleFunctions passed in
        possibleFunctions.push(candidateFunction);
      }
    }
  }
}

export function getPossibleFunctions(candidateVariables: DocEntry[],
                                     candidateFunctions: DocEntry[],
                                     outputDE: DocEntry[]) {
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
      console.log("objectValue");
      console.log(objectValue);
      classDeclaration.properties.instanceProperties.forEach(function(property:DocEntry){
        //console.log(property.name);
        //console.log(objectValue[property.name]);
        property.value = objectValue[property.name];
        console.log(property);
      });
      
      // Instance properties only accessible when the class object is instantiated (as it is here)
      possibleVariables = possibleVariables.concat(classDeclaration.properties.instanceProperties);
      possibleMethodsAndVariables["mapClassToInstanceProperties"][classDeclaration.name] = classDeclaration.properties.instanceProperties;
    } 

    // Do regardless (if there are static properties, they should always be accessible)
    possibleVariables = possibleVariables.concat(classDeclaration.properties.staticProperties);
    possibleMethodsAndVariables["mapClassToStaticProperties"][classDeclaration.name] = classDeclaration.properties.staticProperties;
  });

  inputFileContents.classDeclarations.forEach((classDeclaration) => {
    //if (classObjectInstantiated(classDeclaration, inputFileContents)) {
    if(classObjectInstantiated(classDeclaration, inputFileContents) !== undefined) {
      // If you want to consider the instance methods even if the class has not been instantiated, then move this outside of the if statement
      possibleMethodsAndVariables["mapClassToInstanceMethods"][classDeclaration.name] = getPossibleFunctions(possibleVariables,
                                                                                                      classDeclaration.methods.instanceMethods,
                                                                                                      outputFileContents.variableStatements);
    }
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
