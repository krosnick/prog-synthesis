"use strict";
exports.__esModule = true;
var getTypeInfo_1 = require("./getTypeInfo");
var ts = require("typescript");
function main(fileNameRequiredInput, fileNameRequiredOutput) {
    // Process required input; save as DocEntry[]
    var inputFileContents = getTypeInfo_1.getDocEntrys([fileNameRequiredInput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false);
    //}, false);
    console.log("inputFileContents");
    console.log(inputFileContents);
    // Process required output; save as DocEntry[]
    var outputFileContents = getTypeInfo_1.getDocEntrys([fileNameRequiredOutput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false);
    // console.log("outputFileContents");
    // console.log(outputFileContents);
    // Process native JS/TS (from lib.d.ts)
    /*const tsNativeContents:FileContents = getDocEntrys(["./lib.d.ts"], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, true);*/
    // getPossibleFunctions(inputFileContents.variableStatements,
    //                      inputFileContents.functionDeclarations,
    //                      outputFileContents.variableStatements);
    ///////////////////////// Print final output for debugging /////////////////////////
    /* variableTypeMap Example, if an instance of C has been instantiated:
        {
            possibleVariables:
             { Type1: [ DocEntry, ... ],
               Type2: [ DocEntry, ... ],
               ...,
               C: [ DocEntry, ... ] },
            mapClassToInstanceTypes: { C: { Type1: [ DocEntry, ... ],
                                            Type2: [ DocEntry, ... ] } },
            mapClassToStaticTypes: { C: { Type: [ DocEntry, ... ], ... } }
        }
    */
    /* possibleMethodsAndVariables Example, if an instance of C has been instantiated:
        { possibleFunctions: [ DocEntry, ... ],
          mapClassToInstanceMethods: { C: [ DocEntry, ... ] },
          mapClassToInstanceProperties: { C: [ DocEntry, ... ] },
          mapClassToStaticMethods: { C: [ DocEntry, ... ] },
          mapClassToStaticProperties: { C: [ DocEntry, ... ] },
          possibleVariables: [ DocEntry, ... ]
        }

    */
    var possibleMethodsAndVariables = getTypeInfo_1.getPossibleMethodsAndVariables(inputFileContents, outputFileContents);
    var variableTypeMap = {};
    variableTypeMap["possibleVariables"] = getTypeInfo_1.mapVariablesToTypes(possibleMethodsAndVariables["possibleVariables"]);
    variableTypeMap["mapClassToInstanceTypes"] = {};
    variableTypeMap["mapClassToStaticTypes"] = {};
    Object.keys(possibleMethodsAndVariables["mapClassToInstanceProperties"]).forEach(function (key) {
        variableTypeMap["mapClassToInstanceTypes"][key] = getTypeInfo_1.mapVariablesToTypes(possibleMethodsAndVariables["mapClassToInstanceProperties"][key]);
    });
    Object.keys(possibleMethodsAndVariables["mapClassToStaticProperties"]).forEach(function (key) {
        variableTypeMap["mapClassToStaticTypes"][key] = getTypeInfo_1.mapVariablesToTypes(possibleMethodsAndVariables["mapClassToStaticProperties"][key]);
    });
    console.log(possibleMethodsAndVariables);
    console.log(possibleMethodsAndVariables["possibleFunctions"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceMethods"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticMethods"]);
    console.log(possibleMethodsAndVariables["possibleVariables"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceProperties"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticProperties"]);
    console.log(variableTypeMap);
    console.log(variableTypeMap["possibleVariables"]);
    console.log(variableTypeMap["mapClassToInstanceTypes"]["C"]);
    console.log(variableTypeMap["mapClassToStaticTypes"]["C"]);
    ////////////////////////////////// END DEBUGGING //////////////////////////////////
    // Process native JS/TS (from lib.d.ts) and imported files (from fileNameRequiredInput)
    // Save functions as DocEntry[]
    // Save classes as DocEntry[]; actually, maybe save as map from className-->DocEntry?
    // Save global variables (e.g., window) as DocEntry[]
    // For the desired output type and the input types available,
    // search the DocEntry[]s for appropriate functions/classes/variables
}
function findSolution(outputVar, possibleMethodsAndVariables, variableTypeMap) {
    var possibleFunctions = possibleMethodsAndVariables["possibleFunctions"];
    for (var i = 0; i < possibleFunctions.length; i++) {
        var funcObject = possibleFunctions[i];
        findSolutionWithGivenFunction(outputVar, funcObject, variableTypeMap);
    }
    var mapClassToInstanceMethods = possibleMethodsAndVariables["mapClassToInstanceMethods"];
    var mapClassToStaticMethods = possibleMethodsAndVariables["mapClassToStaticMethods"];
}
function findSolutionWithGivenFunction(outputVar, funcDocEntry, variableTypeMap) {
    var candidateFuncName = funcDocEntry.name;
    var argValCombos = []; // Replace with helper function call
    var validArgValCombos = []; // add combos here that correctly eval to outputVar
    argValCombos.forEach(function (combo) {
    });
}
function findSolutionWithGivenInstanceMethod(outputVar, funcDocEntry) {
}
function findSolutionWithGivenStaticMethod(outputVar, funcDocEntry) {
}
/*const inputArgs:string[] = process.argv;
const fileNameRequiredInput:string = inputArgs.slice(2, 3)[0];
const fileNameRequiredOutput:string = inputArgs.slice(3)[0];*/
var fileNameRequiredInput = "./data/exampleInput.ts";
var fileNameRequiredOutput = "./data/exampleOutput.ts";
main(fileNameRequiredInput, fileNameRequiredOutput);
