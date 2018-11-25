"use strict";
// Adapted from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
exports.__esModule = true;
var ts = require("typescript");
/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(fileNames, options) {
    // Build a program using the set of root file names in fileNames
    var program = ts.createProgram(fileNames, options);
    // Get the checker, we will use it to find more about classes
    var checker = program.getTypeChecker();
    var output = [];
    // Visit every sourceFile in the program
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        if (!sourceFile.isDeclarationFile) {
            // Walk the tree to search for classes
            //ts.forEachChild(sourceFile, visit);
        }
        ts.forEachChild(sourceFile, visit);
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
    return output;
    /** visit nodes finding exported classes */
    function visit(node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }
        if (ts.isClassDeclaration(node) && node.name) {
            //console.log(node);
            //console.log("isClassDeclaration");
            // This is a top level class, get its symbol
            var symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
                var classEntries = serializeClass(symbol);
                classEntries.forEach(function (entry) {
                    output.push(entry);
                });
            }
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (ts.isModuleDeclaration(node)) {
            //console.log("isModuleDeclaration");
            // This is a namespace, visit its children
            //console.log(node);
            //ts.forEachChild(node, visit);
        }
        else if (ts.isVariableStatement(node)) {
            //console.log(node);
            // Process variable statements (e.g., for example input/output code)
            // Create a "serializeVariable" method?
            //console.log(node);
            //console.log(node.declarationList.declarations[0].name);
            //let symbol = checker.getSymbolAtLocation(node.parent);
            var symbol = checker.getSymbolAtLocation(node.declarationList.declarations[0].name);
            output.push(serializeVariable(symbol));
        }
        else if (ts.isFunctionDeclaration(node)) {
            // console.log(node.name)
            var symbol = checker.getSymbolAtLocation(node.name);
            var list = serializeFunction(symbol);
            list.forEach(function (item) { output.push(item); });
        }
        else if (ts.isInterfaceDeclaration(node)) {
            var symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
                var classEntries = serializeClass(symbol);
                classEntries.forEach(function (entry) {
                    output.push(entry);
                });
            }
        }
        else {
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
    function serializeSymbol(symbol) {
        //console.log(symbol);
        //console.log(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!).);
        return {
            name: symbol.getName(),
            /*documentation: ts.displayPartsToString(symbol.getDocumentationComment()),*/
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
        };
    }
    function serializeVariable(symbol) {
        var symbolDetails = serializeSymbol(symbol);
        var symType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        //console.log(symType);
        symbolDetails.signatureInfo = symType
            .getCallSignatures()
            .map(serializeSignature);
        //console.log(symbolDetails.signatureInfo);
        //console.log(symbolDetails);
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
        console.log(symbolDetails.name);
        return detailsList;
    }
    /*function serializeInterface(symbol: ts.Symbol){
  
    }*/
    /** Serialize a class symbol information */
    function serializeClass(symbol) {
        var detailsList = [];
        // Get the construct signatures
        // Constructor
        var constructorDetails = serializeSymbol(symbol);
        // Get the construct signatures
        var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        //console.log(symbol.valueDeclaration);
        constructorDetails.constructors = constructorType
            .getConstructSignatures()
            .map(serializeSignature);
        //console.log(constructorDetails.constructors);
        detailsList.push(constructorDetails);
        var methodsList = [];
        var propertiesList = [];
        // Methods + properties
        var iter = symbol.members.keys();
        var memberCounter = 0;
        while (memberCounter < symbol.members.size) {
            var memberItem = iter.next();
            var memberName = memberItem.value;
            //console.log(memberName);
            memberCounter += 1;
            if (memberName !== "__constructor") {
                var thisSymbol = symbol.members.get(memberName);
                var isPublic = true;
                //console.log(ts.SyntaxKind[thisSymbol.declarations[0].kind]);
                if (thisSymbol.declarations[0].modifiers && thisSymbol.declarations[0].modifiers[0]) {
                    if (thisSymbol.declarations[0].modifiers[0].kind !== ts.SyntaxKind.PublicKeyword) {
                        isPublic = false;
                    }
                    //console.log(ts.SyntaxKind[thisSymbol.declarations[0].kind]);
                    //console.log(thisSymbol.declarations[0].modifiers);
                }
                if (isPublic) {
                    //console.log("isPublic");
                    var symbolDetails = serializeSymbol(thisSymbol);
                    var symType = checker.getTypeOfSymbolAtLocation(thisSymbol, thisSymbol.valueDeclaration);
                    //console.log(checker.getDeclaredTypeOfSymbol(thisSymbol));
                    //console.log(checker.getDeclaredTypeOfSymbol(thisSymbol).);
                    //console.log(symType);
                    //symType.
                    //  console.log(thisSymbol.declarations[0]);
                    //console.log(symType.getStringIndexType());
                    //console.log(thisSymbol.);
                    //console.log(symType);
                    var sigInfo = symType
                        .getCallSignatures()
                        .map(serializeSignature);
                    //console.log(sigInfo[0]);
                    if (sigInfo.length > 0) {
                        symbolDetails.signatureInfo = sigInfo;
                    }
                    if (thisSymbol.declarations[0].kind === ts.SyntaxKind.PropertyDeclaration) {
                        propertiesList.push(symbolDetails);
                    }
                    else if (thisSymbol.declarations[0].kind === ts.SyntaxKind.MethodDeclaration) {
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
    function serializeSignature(signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType()) /*,
            documentation: ts.displayPartsToString(signature.getDocumentationComment())*/
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
generateDocumentation(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
});
