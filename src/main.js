"use strict";
exports.__esModule = true;
var getTypeInfo_1 = require("./getTypeInfo");
var ts = require("typescript");
var exampleInput = require("./data/exampleInput");
var nonStrictEval_1 = require("./nonStrictEval");
var _ = require("lodash");
//const nonStrictEval = require('./nonStrictEval');
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
        //console.log(key);
        variableTypeMap["mapClassToInstanceTypes"][key] = getTypeInfo_1.mapVariablesToTypes(possibleMethodsAndVariables["mapClassToInstanceProperties"][key]);
    });
    Object.keys(possibleMethodsAndVariables["mapClassToStaticProperties"]).forEach(function (key) {
        //console.log(key);
        variableTypeMap["mapClassToStaticTypes"][key] = getTypeInfo_1.mapVariablesToTypes(possibleMethodsAndVariables["mapClassToStaticProperties"][key]);
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
    outputFileContents.variableStatements.forEach(function (outputVar) {
        findSolution(outputVar, possibleMethodsAndVariables, variableTypeMap);
    });
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
function recursiveCheckParamCombos(funcName, outputVarValue, paramOptions, paramsChosenSoFar) {
    var validArgSets = [];
    // If last param to be chosen
    if (paramsChosenSoFar.length === paramOptions.length - 1) {
        // For the last index in paramOptions, for each param option
        var optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        for (var i = 0; i < optionsForThisParam.length; i++) {
            var thisParamOption = optionsForThisParam[i];
            var paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            // Compute function call on these params (given the prior params paramsChosenSoFar and thisParamOption)
            var val = computeValue(funcName, paramsChosenSoFarClone);
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
            if (_.isEqual(val.computedValue, outputVarValue)) {
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        // Compute what the function eval would be, and compare to outputVarValue
        // If matches, return string representation
    }
    else { // If not last param to be chosen
        var optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        for (var i = 0; i < optionsForThisParam.length; i++) {
            var thisParamOption = optionsForThisParam[i];
            var paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            validArgSets = validArgSets.concat(recursiveCheckParamCombos(funcName, outputVarValue, paramOptions, paramsChosenSoFarClone));
        }
    }
    return validArgSets;
}
function computeValue(funcName, params) {
    //console.log("computeValue called");
    var argNamesList = [];
    var argValuesList = [];
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        argNamesList.push(param.name);
        argValuesList.push(param.val);
    }
    var funcObject;
    try {
        funcObject = nonStrictEval_1.nonStrictEval(funcName);
    }
    catch (error) {
        funcObject = nonStrictEval_1.nonStrictEval(exampleInput[funcName]);
    }
    //console.log(funcObject);
    //console.log("argValuesList");
    //console.log(argValuesList);
    var value = funcObject.apply(this, argValuesList);
    //console.log("computedValue");
    //console.log(value);
    return {
        "argNamesList": argNamesList,
        "computedValue": value
    };
    //console.log(exampleInput["addTwoNumbers"].apply(this, argList));
}
function findSolutionWithGivenFunction(outputVar, funcDocEntry, variableTypeMap) {
    var outputVarValue = outputVar.value;
    //console.log("outputVarValue");
    //console.log(outputVarValue);
    //const candidateFuncName = "exampleInput." + "addTwoNumbers";
    //const argValCombos:({name:string, val:any})[][] = [[{"name": "num", "val": 2}, {"name": "num", "val": 3}]];
    var parameterOptions = getParameterOptions(funcDocEntry, variableTypeMap);
    //const validArgValCombos:({name:string, val:any})[][] = []; // add combos here that correctly eval to outputVar
    // probably need a recursive function to process parameterOptions and find valid combos
    var validArgSets = recursiveCheckParamCombos(funcDocEntry.name, outputVar.value, parameterOptions, []);
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
function findSolutionWithGivenInstanceMethod(outputVar, funcDocEntry) {
}
function findSolutionWithGivenStaticMethod(outputVar, funcDocEntry) {
}
//function getParameterPermutations(funcDocEntry:DocEntry, variableTypeMap):({name:string, val:any})[][] {
function getParameterOptions(funcDocEntry, variableTypeMap) {
    //let argValCombos:({name:string, val:any})[][] = [];
    //console.log(funcDocEntry);
    //console.log(funcDocEntry.name);
    var params = funcDocEntry.signatureInfo[0].parameters;
    //console.log(params);
    // [forParam0, forParam1, forParam2]
    // forParami = [{name:string, val:any}]
    var paramOptions = [];
    var _loop_1 = function (i) {
        /*paramOptions.push([]);
        // can now access paramOptions[i] and do paramOptions[i].push*/
        var param = params[i];
        //console.log(param);
        var paramType = param.type;
        //console.log("paramType");
        //console.log(paramType);
        // Add params here for possibleVariables, mapClassToInstanceTypes, and mapClassToStaticTypes
        // This will at least help with getting everything in the standard form
        // of ({name:string, val:any})[].
        var singleParamOptions = [];
        // This would not work for paramType="any"
        // (in that case, maybe consider all variables in variableTypeMap)
        var possibleVariablesOfType = variableTypeMap["possibleVariables"][paramType];
        possibleVariablesOfType.forEach(function (variable) {
            var variableName = variable.name;
            var variableValue = variable.value;
            singleParamOptions.push({
                name: variableName,
                val: variableValue
            });
        });
        var mapClassToInstanceTypes = variableTypeMap["mapClassToInstanceTypes"];
        var classNamesForInstanceTypes = Object.keys(mapClassToInstanceTypes);
        classNamesForInstanceTypes.forEach(function (className) {
            var possiblePropertiesOfType = mapClassToInstanceTypes[className][paramType];
            if (possiblePropertiesOfType) {
                possiblePropertiesOfType.forEach(function (property) {
                    var propertyName = className + "." + property.name;
                    var propertyValue = property.value;
                    singleParamOptions.push({
                        name: propertyName,
                        val: propertyValue
                    });
                });
            }
        });
        var mapClassToStaticTypes = variableTypeMap["mapClassToStaticTypes"];
        var classNamesForStaticTypes = Object.keys(mapClassToStaticTypes);
        classNamesForStaticTypes.forEach(function (className) {
            var possiblePropertiesOfType = mapClassToStaticTypes[className][paramType];
            if (possiblePropertiesOfType) {
                possiblePropertiesOfType.forEach(function (property) {
                    var propertyName = className + "." + property.name;
                    var propertyValue = property.value;
                    singleParamOptions.push({
                        name: propertyName,
                        val: propertyValue
                    });
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
    };
    for (var i = 0; i < params.length; i++) {
        _loop_1(i);
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
var fileNameRequiredInput = "./data/exampleInput.ts";
var fileNameRequiredOutput = "./data/exampleOutput.ts";
main(fileNameRequiredInput, fileNameRequiredOutput);
