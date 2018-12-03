import {getDocEntrys,FileContents,getPossibleFunctions,getPossibleMethodsAndVariables,mapVariablesToTypes, DocEntry} from "./getTypeInfo";
import * as ts from "typescript";
import * as exampleInput from "./data/exampleInput";
import {nonStrictEval} from "./nonStrictEval";
import * as _ from "lodash"; 
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

    //findSolutionWithGivenFunction(undefined , undefined, undefined);

    // For each required output statement
    outputFileContents.variableStatements.forEach(function(outputVar:DocEntry){
        findSolution(outputVar, possibleMethodsAndVariables, variableTypeMap);
    });
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

function recursiveCheckParamCombos(funcName:string, outputVarValue, paramOptions:({name:string, val:any})[][], paramsChosenSoFar:({name:string, val:any})[]):({name:string, val:any})[]{
    
    let validArgSets:({name:string, val:any})[] = [];
    // If last param to be chosen
    if(paramsChosenSoFar.length === paramOptions.length-1){
        // For the last index in paramOptions, for each param option
        const optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        for(let i = 0; i < optionsForThisParam.length; i++){
            const thisParamOption = optionsForThisParam[i];
            const paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            // Compute function call on these params (given the prior params paramsChosenSoFar and thisParamOption)
            const val:{argNamesList:string[], computedValue:any} = computeValue(funcName, paramsChosenSoFarClone);
            
            /*console.log("val.computedValue: " + val.computedValue);
            console.log("typeof val.computedValue: " + (typeof val.computedValue));
            console.log("outputVarValue: " + outputVarValue);
            console.log("tyepof outputVarValue: " + (typeof outputVarValue));*/
            //if(val.computedValue === outputVarValue){
            /*if(_.isEqual(val.computedValue, outputVarValue)){
                console.log("equalToOutputVar");
            }else{
                console.log("notOutputVar");
            }*/
            if(_.isEqual(val.computedValue, outputVarValue)){
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        // Compute what the function eval would be, and compare to outputVarValue
        // If matches, return string representation
    }else{ // If not last param to be chosen
        const optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        for(let i = 0; i < optionsForThisParam.length; i++){
            const thisParamOption = optionsForThisParam[i];
            const paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            validArgSets = validArgSets.concat(recursiveCheckParamCombos(funcName, outputVarValue, paramOptions, paramsChosenSoFarClone));
        }
    }
    return validArgSets;
}

function computeValue(funcName:string, params:({name:string, val:any})[]) : {argNamesList:string[], computedValue:any}{
    //console.log("computeValue called");

    const argNamesList = [];
    const argValuesList = [];
    for(let i = 0; i < params.length; i++){
        const param = params[i];
        argNamesList.push(param.name);
        argValuesList.push(param.val);
    }

    let funcObject;
    try {
        funcObject = nonStrictEval(funcName);
    }catch(error){
        funcObject = nonStrictEval(exampleInput[funcName]);
    }
    //console.log(funcObject);

    //console.log("argValuesList");
    //console.log(argValuesList);

    const value = funcObject.apply(this, argValuesList);
    //console.log("computedValue");
    //console.log(value);

    return {
        "argNamesList": argNamesList,
        "computedValue": value
    }

    //console.log(exampleInput["addTwoNumbers"].apply(this, argList));
}

function findSolutionWithGivenFunction(outputVar:DocEntry, funcDocEntry:DocEntry, variableTypeMap){
    
    const outputVarValue = outputVar.value;
    //console.log("outputVarValue");
    //console.log(outputVarValue);

    //const candidateFuncName = "exampleInput." + "addTwoNumbers";
    //const argValCombos:({name:string, val:any})[][] = [[{"name": "num", "val": 2}, {"name": "num", "val": 3}]];
    const parameterOptions:({name:string, val:any})[][] = getParameterOptions(funcDocEntry, variableTypeMap);
    //const validArgValCombos:({name:string, val:any})[][] = []; // add combos here that correctly eval to outputVar
        
    // probably need a recursive function to process parameterOptions and find valid combos
    const validArgSets:({name:string, val:any})[] = recursiveCheckParamCombos(funcDocEntry.name, outputVar.value, parameterOptions, []);
    console.log(funcDocEntry.name);
    console.log(validArgSets);

    /*argValCombos.forEach(function(combo){
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
        
    });*/
}

/*function findSolutionWithGivenFunction(outputVar:DocEntry, funcDocEntry:DocEntry, variableTypeMap){
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
}*/

function findSolutionWithGivenInstanceMethod(outputVar:DocEntry, funcDocEntry:DocEntry){

}

function findSolutionWithGivenStaticMethod(outputVar:DocEntry, funcDocEntry:DocEntry){

}

//function getParameterPermutations(funcDocEntry:DocEntry, variableTypeMap):({name:string, val:any})[][] {
function getParameterOptions(funcDocEntry:DocEntry, variableTypeMap):({name:string, val:any})[][] {

    //let argValCombos:({name:string, val:any})[][] = [];

    //console.log(funcDocEntry);
    //console.log(funcDocEntry.name);
    const params:DocEntry[] = funcDocEntry.signatureInfo[0].parameters;
    //console.log(params);

    // [forParam0, forParam1, forParam2]
    // forParami = [{name:string, val:any}]
    const paramOptions:({name:string, val:any})[][] = [];

    for(let i = 0; i < params.length; i++){
        /*paramOptions.push([]);
        // can now access paramOptions[i] and do paramOptions[i].push*/

        const param:DocEntry = params[i];
        //console.log(param);
        const paramType:string = param.type;
        //console.log("paramType");
        //console.log(paramType);

        // Add params here for possibleVariables, mapClassToInstanceTypes, and mapClassToStaticTypes
            // This will at least help with getting everything in the standard form
            // of ({name:string, val:any})[].
        const singleParamOptions:({name:string, val:any})[] = [];

        // This would not work for paramType="any"
            // (in that case, maybe consider all variables in variableTypeMap)
        const possibleVariablesOfType = variableTypeMap["possibleVariables"][paramType];
        possibleVariablesOfType.forEach(function(variable){ // variable is DocEntry?
            const variableName = variable.name;
            const variableValue = variable.value;
            singleParamOptions.push(
                {
                    name: variableName,
                    val: variableValue
                }
            );
        });

        const mapClassToInstanceTypes = variableTypeMap["mapClassToInstanceTypes"];
        const classNamesForInstanceTypes:string[] = Object.keys(mapClassToInstanceTypes);
        classNamesForInstanceTypes.forEach(function(className:string){
            const possiblePropertiesOfType = mapClassToInstanceTypes[className][paramType];
            if(possiblePropertiesOfType){
                possiblePropertiesOfType.forEach(function(property){
                    const propertyName = className + "." + property.name;
                    const propertyValue = property.value;
                    singleParamOptions.push(
                        {
                            name: propertyName,
                            val: propertyValue
                        }
                    );
                });
            }
        });

        const mapClassToStaticTypes = variableTypeMap["mapClassToStaticTypes"];
        const classNamesForStaticTypes:string[] = Object.keys(mapClassToStaticTypes);
        classNamesForStaticTypes.forEach(function(className:string){
            const possiblePropertiesOfType = mapClassToStaticTypes[className][paramType];
            if(possiblePropertiesOfType){
                possiblePropertiesOfType.forEach(function(property){
                    const propertyName = className + "." + property.name;
                    const propertyValue = property.value;
                    singleParamOptions.push(
                        {
                            name: propertyName,
                            val: propertyValue
                        }
                    );
                });
            }
        });

        //console.log("singleParamOptions");
        //console.log(singleParamOptions);

        paramOptions.push(singleParamOptions);

        //console.log(possibleVariables);

        // variableTypeMap["possibleVariables"]
        //const possibleVariables = 

        // variableTypeMap["mapClassToInstanceTypes"]

        // variableTypeMap["mapClassToStaticTypes"]
    }

    //console.log("paramOptions");
    //console.log(paramOptions);

    // really only need to look at the args used for funcDocEntry
    
    // make local consolidatedVariables map that allows us to iterate over all variables,
    // instanceProperties, and staticProperties in one loop
    // consolidatedVariables Example:
    //   {
    //     number: [ { name: NAME, val: VALUE } ],
    //     string: [ { name: NAME, val: VALUE } ]
    //   }
    /*let consolidatedVariables = {};
    Object.keys(variableTypeMap.possibleVariables).forEach((key) => {
      variableTypeMap.possibleVariables[key].forEach((variable) => {
        let varEntry = {};
        varEntry["name"] = variable.name;
        varEntry["val"] = variable.val;
        consolidatedVariables[key].push(varEntry);
      });
    });*/
    // Iterate over consolidatedVariables to populate parameter permutations data structure,
    // which can be a list of N-tuples, where N is the number of parameters
    // Return parameter permutations data structure

    //return argValCombos;
    return paramOptions;
}

/*const inputArgs:string[] = process.argv;
const fileNameRequiredInput:string = inputArgs.slice(2, 3)[0];
const fileNameRequiredOutput:string = inputArgs.slice(3)[0];*/
const fileNameRequiredInput:string = "./data/exampleInput.ts";
const fileNameRequiredOutput:string = "./data/exampleOutput.ts";
main(fileNameRequiredInput, fileNameRequiredOutput);