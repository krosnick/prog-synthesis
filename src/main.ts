import {getDocEntrys,FileContents,getPossibleFunctions,getPossibleMethodsAndVariables,mapVariablesToTypes, DocEntry} from "./getTypeInfo";
import * as ts from "typescript";
import * as exampleInput from "./data/exampleInput";
import {nonStrictEval} from "./nonStrictEval";
//const nonStrictEval = require('./nonStrictEval');

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
        //console.log(key);
        variableTypeMap["mapClassToInstanceTypes"][key] = mapVariablesToTypes(possibleMethodsAndVariables["mapClassToInstanceProperties"][key]);
    });
    Object.keys(possibleMethodsAndVariables["mapClassToStaticProperties"]).forEach((key) => {
        //console.log(key);
        variableTypeMap["mapClassToStaticTypes"][key] = mapVariablesToTypes(possibleMethodsAndVariables["mapClassToStaticProperties"][key]);
    });

    /*console.log(possibleMethodsAndVariables);
    console.log(possibleMethodsAndVariables["possibleFunctions"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceMethods"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticMethods"]);
    console.log(possibleMethodsAndVariables["possibleVariables"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceProperties"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticProperties"]);
    console.log(variableTypeMap);
    console.log(variableTypeMap["mapClassToInstanceTypes"]["C"]);
    console.log(variableTypeMap["mapClassToStaticTypes"]["C"]);*/
    console.log(variableTypeMap);
    //console.log(variableTypeMap["mapClassToStaticTypes"]["C"]);
    console.log(variableTypeMap["mapClassToInstanceTypes"]["C"]);
    ////////////////////////////////// END DEBUGGING //////////////////////////////////


    // Process native JS/TS (from lib.d.ts) and imported files (from fileNameRequiredInput)
        // Save functions as DocEntry[]
        // Save classes as DocEntry[]; actually, maybe save as map from className-->DocEntry?
        // Save global variables (e.g., window) as DocEntry[]

    // For the desired output type and the input types available,
        // search the DocEntry[]s for appropriate functions/classes/variables

    findSolutionWithGivenFunction(undefined , undefined, undefined);

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
    //const candidateFuncName = funcDocEntry.name;
    //const candidateFuncName = "substring";
    //const candidateFuncName = "Math.pow";
    
    const candidateFuncName = "exampleInput." + "addTwoNumbers";
    //const argValCombos:({name:string, val:any})[][] = []; // Replace with helper function call
    //const argValCombos:({name:string, val:any})[][] = [[{"name": "str", "val": "testing"}, {"name": "length", "val": 4}]];
    const argValCombos:({name:string, val:any})[][] = [[{"name": "num", "val": 2}, {"name": "num", "val": 3}]];
    const validArgValCombos:({name:string, val:any})[][] = []; // add combos here that correctly eval to outputVar
    argValCombos.forEach(function(combo){
        //let codeString = candidateFuncName + "(";
        let paramCodeString = "(";
        for(let paramIndex = 0; paramIndex < combo.length; paramIndex++){
            paramCodeString += combo[paramIndex].val;
            if(paramIndex < combo.length-1){
                paramCodeString += ", ";
            }
        }
        paramCodeString += ")";
        //console.log(paramCodeString);
        //console.log(nonStrictEval(exampleInput["addTwoNumbers"]));
        const argList = [2, 3];
        //console.log(exampleInput["addTwoNumbers"].apply(this, argList));
        
        // need to make sure we can get a function object for something like Math.abs
        const mathAbs = nonStrictEval("Math.abs");
        //console.log(mathAbs);
        //console.log(mathAbs(-3));
        
    });
}

function findSolutionWithGivenInstanceMethod(outputVar:DocEntry, funcDocEntry:DocEntry){

}

function findSolutionWithGivenStaticMethod(outputVar:DocEntry, funcDocEntry:DocEntry){

}

function getParameterPermutations(funcDocEntry:DocEntry, variableTypeMap) {
    
    // really only need to look at the args used for funcDocEntry
    
    // make local consolidatedVariables map that allows us to iterate over all variables,
    // instanceProperties, and staticProperties in one loop
    // consolidatedVariables Example:
    //   {
    //     number: [ { name: NAME, val: VALUE } ],
    //     string: [ { name: NAME, val: VALUE } ]
    //   }
    let consolidatedVariables = {};
    Object.keys(variableTypeMap.possibleVariables).forEach((key) => {
      variableTypeMap.possibleVariables[key].forEach((variable) => {
        let varEntry = {};
        varEntry["name"] = variable.name;
        varEntry["val"] = variable.val;
        consolidatedVariables[key].push(varEntry);
      });
    });
    // Iterate over consolidatedVariables to populate parameter permutations data structure,
    // which can be a list of N-tuples, where N is the number of parameters
    // Return parameter permutations data structure
}

/*const inputArgs:string[] = process.argv;
const fileNameRequiredInput:string = inputArgs.slice(2, 3)[0];
const fileNameRequiredOutput:string = inputArgs.slice(3)[0];*/
const fileNameRequiredInput:string = "./data/exampleInput.ts";
const fileNameRequiredOutput:string = "./data/exampleOutput.ts";
main(fileNameRequiredInput, fileNameRequiredOutput);