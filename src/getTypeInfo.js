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
            ts.forEachChild(sourceFile, visit);
        }
        //ts.forEachChild(sourceFile, visit);
    }
    console.log(output);
    // print out the doc
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
        console.log(constructorDetails.constructors);
        detailsList.push(constructorDetails);
        // Methods + properties
        var iter = symbol.members.keys();
        var memberCounter = 0;
        while (memberCounter < symbol.members.size) {
            var memberItem = iter.next();
            var memberName = memberItem.value;
            memberCounter += 1;
            if (memberName !== "__constructor") {
                var thisSymbol = symbol.members.get(memberName);
                var isPublic = true;
                if (thisSymbol.declarations[0].modifiers && thisSymbol.declarations[0].modifiers[0]) {
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
                    console.log(sigInfo[0]);
                    if (sigInfo.length > 0) {
                        symbolDetails.signatureInfo = sigInfo;
                    }
                    detailsList.push(symbolDetails);
                }
            }
        }
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
}
generateDocumentation(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
});
