"use strict";
// Adapted from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
exports.__esModule = true;
var ts = require("typescript");
;
/** Generate documentation for all classes in a set of .ts files */
function getDocEntrys(fileNames, options, checkDeclarationFiles) {
    // Build a program using the set of root file names in fileNames
    var program = ts.createProgram(fileNames, options);
    // Get the checker, we will use it to find more about classes
    var checker = program.getTypeChecker();
    var fileContents = {
        classDeclarations: [],
        interfaceDeclarations: [],
        functionDeclarations: [],
        variableStatements: []
    };
    // Visit every sourceFile in the program
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        var isDeclarationFile = sourceFile.isDeclarationFile;
        if (checkDeclarationFiles) {
            // Walk the tree to search for nodes (classes, variable statements, etc)
            ts.forEachChild(sourceFile, visit);
        }
        else { // caller does not want to check declaration files
            if (!isDeclarationFile) {
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
    function visit(node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }
        if (ts.isClassDeclaration(node) && node.name) {
            // This is a top level class, get its symbol
            var symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
                var classEntries = serializeClass(symbol);
                classEntries.forEach(function (entry) {
                    fileContents.classDeclarations.push(entry);
                });
            }
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (ts.isVariableStatement(node)) {
            // Process variable statements (e.g., for example input/output code)
            var symbol = checker.getSymbolAtLocation(node.declarationList.declarations[0].name);
            var varDocEntry = serializeVariable(symbol);
            //console.log(varDocEntry.name);
            fileContents.variableStatements.push(varDocEntry);
        }
        else if (ts.isFunctionDeclaration(node)) {
            var symbol = checker.getSymbolAtLocation(node.name);
            var list = serializeFunction(symbol);
            list.forEach(function (item) { fileContents.functionDeclarations.push(item); });
        }
        else if (ts.isInterfaceDeclaration(node)) {
            var symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
                var classEntries = serializeClass(symbol);
                classEntries.forEach(function (entry) {
                    fileContents.interfaceDeclarations.push(entry);
                    //console.log(entry.name);
                    /*if(entry.name === "Date"){
                      //console.log(entry);
                      console.log(node);
                    }*/
                });
            }
        }
        else {
        }
    }
    /** Serialize a symbol into a json object */
    function serializeSymbol(symbol) {
        return {
            name: symbol.getName(),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
        };
    }
    function serializeVariable(symbol) {
        var symbolDetails = serializeSymbol(symbol);
        var symType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        symbolDetails.signatureInfo = symType
            .getCallSignatures()
            .map(serializeSignature);
        return symbolDetails;
    }
    function serializeFunction(symbol) {
        var detailsList = [];
        var symbolDetails = serializeSymbol(symbol);
        var symType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        var sigInfo = symType
            .getCallSignatures()
            .map(serializeSignature);
        if (sigInfo.length > 0) {
            symbolDetails.signatureInfo = sigInfo;
        }
        detailsList.push(symbolDetails);
        //console.log(symbolDetails.name);
        return detailsList;
    }
    /** Serialize a class symbol information */
    function serializeClass(symbol) {
        var detailsList = [];
        // Get the construct signatures
        // Constructor
        var constructorDetails = serializeSymbol(symbol);
        // Get the construct signatures
        var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        constructorDetails.constructors = constructorType
            .getConstructSignatures()
            .map(serializeSignature);
        detailsList.push(constructorDetails);
        /*let methodsList:DocEntry[] = [];
        let propertiesList:DocEntry[] = [];*/
        // Static(?) methods + properties?
        //console.log(symbol.exports.size);
        //symbol.
        var staticIter = symbol.exports.keys();
        var staticMemberCounter = 0;
        while (staticMemberCounter < symbol.exports.size) {
            var memberItem = staticIter.next();
            var memberName = memberItem.value;
            //console.log(memberName);
            staticMemberCounter += 1;
        }
        var memberMethodsProperties = processMethodsAndProperties(symbol.members);
        var staticMethodsProperties = processMethodsAndProperties(symbol.exports);
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
    function processMethodsAndProperties(methodsAndProperties) {
        var methodsList = [];
        var propertiesList = [];
        var iter = methodsAndProperties.keys();
        var memberCounter = 0;
        while (memberCounter < methodsAndProperties.size) {
            var memberItem = iter.next();
            var memberName = memberItem.value;
            memberCounter += 1;
            if (memberName !== "__constructor") {
                var thisSymbol = methodsAndProperties.get(memberName);
                var isPublic = true;
                if (thisSymbol.declarations) {
                    if (thisSymbol.declarations[0] && thisSymbol.declarations[0].modifiers && thisSymbol.declarations[0].modifiers[0]) {
                        if (thisSymbol.declarations[0].modifiers[0].kind !== ts.SyntaxKind.PublicKeyword) {
                            isPublic = false;
                        }
                    }
                    if (isPublic) {
                        var symbolDetails = serializeSymbol(thisSymbol);
                        var symType = checker.getTypeOfSymbolAtLocation(thisSymbol, thisSymbol.valueDeclaration);
                        var sigInfo = symType
                            .getCallSignatures()
                            .map(serializeSignature);
                        if (sigInfo.length > 0) {
                            symbolDetails.signatureInfo = sigInfo;
                        }
                        if (thisSymbol.declarations[0].kind === ts.SyntaxKind.PropertyDeclaration) {
                            propertiesList.push(symbolDetails);
                        }
                        else if (thisSymbol.declarations[0].kind === ts.SyntaxKind.MethodDeclaration) {
                            methodsList.push(symbolDetails);
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
    function serializeSignature(signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType())
        };
    }
    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node) {
        return ((ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile));
    }
    function typesMatch(canType, otherType) {
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
    function paramsAcceptable(can, inp) {
        for (var i = 0; i < can.signatureInfo[0].parameters.length; i++) {
            var paramFound = false;
            // For each of the parameters in the candidate function, check if there
            // is a variable of an acceptable type that can be passed in
            for (var j = 0; j < inp.length; j++) {
                if (typesMatch(can.signatureInfo[0].parameters[i].type, inp[j].type)) {
                    paramFound = true;
                }
            }
            // If for any one parameter, there was no variable that could be passed
            // in, return false
            if (paramFound === false) {
                return false;
            }
            ;
        }
        return true;
    }
    function getPossibleFunctions(inputDE, outputDE, candidates) {
        console.log(inputDE);
        console.log(outputDE);
        console.log(candidates);
        var possibleFunctions = [];
        candidates.forEach(function (candidate) {
            if ("signatureInfo" in candidate) {
                if (candidate.signatureInfo.length > 0) {
                    // Consider output values
                    if (typesMatch(candidate.signatureInfo[0].returnType, outputDE[0].type) &&
                        paramsAcceptable(candidate, inputDE)) {
                        possibleFunctions.push(candidate);
                    }
                }
            }
        });
        console.log("POSSIBLE FUNCTIONS: ");
        console.log(possibleFunctions);
        // possibleFunctions.forEach((possibleFunction) => {
        //   console.log(possibleFunction);
        //   possibleFunction.signatureInfo.forEach((param) => {
        //     console.log(param);
        //   });
        // });
    }
}
exports.getDocEntrys = getDocEntrys;
