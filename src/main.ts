import {getDocEntrys,FileContents,getPossibleFunctions,getPossibleMethodsAndVariables,mapVariablesToTypes, DocEntry} from "./getTypeInfo";
import * as ts from "typescript";

function main(fileNameRequiredInput:string, fileNameRequiredOutput:string){
    // Process required input; save as DocEntry[]
    const inputFileContents:FileContents = getDocEntrys([fileNameRequiredInput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false);
    //}, false);
    console.log("inputFileContents");
    console.log(inputFileContents);

    // Process required output; save as DocEntry[]
    const outputFileContents:FileContents = getDocEntrys([fileNameRequiredOutput], {
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

    let possibleMethodsAndVariables = getPossibleMethodsAndVariables(inputFileContents, outputFileContents);
    let variableTypeMap = {};
    variableTypeMap["possibleVariables"] = mapVariablesToTypes(possibleMethodsAndVariables["possibleVariables"]);
    variableTypeMap["mapClassToInstanceTypes"] = {};
    variableTypeMap["mapClassToStaticTypes"] = {};
    Object.keys(possibleMethodsAndVariables["mapClassToInstanceProperties"]).forEach((key) => {
        variableTypeMap["mapClassToInstanceTypes"][key] = mapVariablesToTypes(possibleMethodsAndVariables["mapClassToInstanceProperties"][key]);
    });
    Object.keys(possibleMethodsAndVariables["mapClassToStaticProperties"]).forEach((key) => {
        variableTypeMap["mapClassToStaticTypes"][key] = mapVariablesToTypes(possibleMethodsAndVariables["mapClassToStaticProperties"][key]);
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

function findSolution(outputVar:DocEntry, possibleMethodsAndVariables, variableTypeMap){
    const possibleFunctions = possibleMethodsAndVariables["possibleFunctions"];
    for(let i = 0; i < possibleFunctions.length; i++){
        const funcObject = possibleFunctions[i];
        findSolutionWithGivenFunction(outputVar, funcObject, variableTypeMap);
    }

    const mapClassToInstanceMethods = possibleMethodsAndVariables["mapClassToInstanceMethods"];


    const mapClassToStaticMethods = possibleMethodsAndVariables["mapClassToStaticMethods"];

}

function findSolutionWithGivenFunction(outputVar:DocEntry, funcDocEntry:DocEntry, variableTypeMap){
    const candidateFuncName = funcDocEntry.name;
    const argValCombos:({name:string, val:any})[] = []; // Replace with helper function call
    const validArgValCombos:(DocEntry[])[] = []; // add combos here that correctly eval to outputVar
    argValCombos.forEach(function(combo){

    });
}

function findSolutionWithGivenInstanceMethod(outputVar:DocEntry, funcDocEntry:DocEntry){

}

function findSolutionWithGivenStaticMethod(outputVar:DocEntry, funcDocEntry:DocEntry){

}

/*const inputArgs:string[] = process.argv;
const fileNameRequiredInput:string = inputArgs.slice(2, 3)[0];
const fileNameRequiredOutput:string = inputArgs.slice(3)[0];*/
const fileNameRequiredInput:string = "./data/exampleInput.ts";
const fileNameRequiredOutput:string = "./data/exampleOutput.ts";
main(fileNameRequiredInput, fileNameRequiredOutput);