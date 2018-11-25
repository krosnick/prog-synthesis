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
    console.log("inputFileContents");
    console.log(inputFileContents);
    // Process required output; save as DocEntry[]
    var outputFileContents = getTypeInfo_1.getDocEntrys([fileNameRequiredOutput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false);
    /*console.log("outputFileContents");
    console.log(outputFileContents);*/
    // Process native JS/TS (from lib.d.ts)
    var tsNativeContents = getTypeInfo_1.getDocEntrys(["./lib.d.ts"], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, true);
    /*console.log("tsNativeContents");
    console.log(tsNativeContents);*/
    // Process native JS/TS (from lib.d.ts) and imported files (from fileNameRequiredInput)
    // Save functions as DocEntry[]
    // Save classes as DocEntry[]; actually, maybe save as map from className-->DocEntry?
    // Save global variables (e.g., window) as DocEntry[]
    // For the desired output type and the input types available,
    // search the DocEntry[]s for appropriate functions/classes/variables
}
/*const inputArgs:string[] = process.argv;
const fileNameRequiredInput:string = inputArgs.slice(2, 3)[0];
const fileNameRequiredOutput:string = inputArgs.slice(3)[0];*/
var fileNameRequiredInput = "./data/exampleInput.ts";
var fileNameRequiredOutput = "./data/exampleOutput.ts";
main(fileNameRequiredInput, fileNameRequiredOutput);
