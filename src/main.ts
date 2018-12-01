import {getDocEntrys,FileContents,getPossibleFunctions,getPossibleMethodsAndVariables,/*,mapVariablesToTypes*/
DocEntry} from "./getTypeInfo";
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
    let possibleMethodsAndVariables = getPossibleMethodsAndVariables(inputFileContents, outputFileContents);
    // let variableTypeMap = mapVariablesToTypes(possibleMethodsAndVariables["possibleVariables"]);
    console.log(possibleMethodsAndVariables);
    console.log(possibleMethodsAndVariables["possibleFunctions"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceMethods"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticMethods"]);
    console.log(possibleMethodsAndVariables["possibleVariables"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceProperties"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticProperties"]);
    // console.log(variableTypeMap);
    ////////////////////////////////// END DEBUGGING //////////////////////////////////


    // Process native JS/TS (from lib.d.ts) and imported files (from fileNameRequiredInput)
        // Save functions as DocEntry[]
        // Save classes as DocEntry[]; actually, maybe save as map from className-->DocEntry?
        // Save global variables (e.g., window) as DocEntry[]

    // For the desired output type and the input types available,
        // search the DocEntry[]s for appropriate functions/classes/variables

}

function findSolution(outputVar:DocEntry, possibleMethodsAndVariables){
    const possibleFunctions = possibleMethodsAndVariables["possibleFunctions"];
    for(let i = 0; i < possibleFunctions.length; i++){
        const funcObject = possibleFunctions[i];
        findSolutionWithGivenFunction(outputVar, funcObject);
    }

    const mapClassToInstanceMethods = possibleMethodsAndVariables["mapClassToInstanceMethods"];
    

    const mapClassToStaticMethods = possibleMethodsAndVariables["mapClassToStaticMethods"];

}

function findSolutionWithGivenFunction(outputVar:DocEntry, funcDocEntry:DocEntry){

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