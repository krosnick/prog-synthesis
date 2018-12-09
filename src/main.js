"use strict";
exports.__esModule = true;
var getTypeInfo_1 = require("./getTypeInfo");
var ts = require("typescript");
var nonStrictEval_1 = require("./nonStrictEval");
var _ = require("lodash");
var fs = require("fs");
//const nonStrictEval = require('./nonStrictEval');
var javascript_declaration_file = "./lib.d.ts";
var transpiledInputFileContentsString;
function main(fileNameRequiredInput, fileNameRequiredOutput) {
    // Get string of the code in the input file
    var inputFileContentsString = fs.readFileSync(fileNameRequiredInput, "utf8");
    transpiledInputFileContentsString = ts.transpileModule(inputFileContentsString, {
        compilerOptions: {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.CommonJS,
            noImplicitUseStrict: true
        }
    }).outputText;
    //console.log("fileContent");
    //console.log(fileContent);
    // Process required input; save as DocEntry[]
    var inputFileContents = getTypeInfo_1.getDocEntrys([fileNameRequiredInput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false, transpiledInputFileContentsString);
    //}, true, transpiledInputFileContentsString);
    //console.log("inputFileContents");
    //console.log(inputFileContents);
    // Process required output; save as DocEntry[]
    var outputFileContents = getTypeInfo_1.getDocEntrys([fileNameRequiredOutput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false, inputFileContentsString);
    // console.log("outputFileContents");
    // console.log(outputFileContents);
    var ecmaScriptFileContents = getTypeInfo_1.getDocEntrys([javascript_declaration_file], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, true, inputFileContentsString);
    var jsAndWebAPIInterfaceDeclarations = ecmaScriptFileContents["interfaceDeclarations"];
    var jsAndWebAPIFunctionDeclarations = ecmaScriptFileContents["functionDeclarations"];
    var jsAndWebAPIVariableStatements = ecmaScriptFileContents["variableStatements"];
    /*console.log("jsAndWebAPIFunctionDeclarations.length");
    console.log(jsAndWebAPIFunctionDeclarations.length);
    console.log("jsAndWebAPIVariableStatements.length");
    console.log(jsAndWebAPIVariableStatements.length);*/
    // Now, need to do 2 things
    // 1. Process jsAndWebAPIVariableStatements, using jsAndWebAPIInterfaceDeclarations,
    // adding more properties and methods to the variable statements
    // 2. Potentially(?) process inputFileContents using jsAndWebAPIVariableStatements (or other)
    // adding more properties and methods to the variable statements 
    // Process jsAndWebAPIVariableStatements, using jsAndWebAPIInterfaceDeclarations,
    // adding more properties and methods to the variable statements
    /*console.log("jsAndWebAPIVariableStatements");
    console.log(jsAndWebAPIVariableStatements);*/
    //console.log(jsAndWebAPIInterfaceDeclarations);
    addInheritedMethodsPropertiesToNativeJSVariables(jsAndWebAPIVariableStatements, jsAndWebAPIInterfaceDeclarations);
    //console.log("ecmaScriptFileContents");
    //console.log(ecmaScriptFileContents);
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
    //console.log("possibleMethodsAndVariables");
    //console.log(possibleMethodsAndVariables);
    /*console.log(possibleMethodsAndVariables["possibleFunctions"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceMethods"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticMethods"]);
    console.log(possibleMethodsAndVariables["possibleVariables"]);
    console.log(possibleMethodsAndVariables["mapClassToInstanceProperties"]);
    console.log(possibleMethodsAndVariables["mapClassToStaticProperties"]);
    console.log(variableTypeMap);
    console.log(variableTypeMap["mapClassToInstanceTypes"]["C"]);
    console.log(variableTypeMap["mapClassToStaticTypes"]["C"]);*/
    //console.log(variableTypeMap);
    //console.log(variableTypeMap["mapClassToStaticTypes"]["C"]);
    //console.log(variableTypeMap["mapClassToInstanceTypes"]["C"]);
    ////////////////////////////////// END DEBUGGING //////////////////////////////////
    // Process native JS/TS (from lib.d.ts) and imported files (from fileNameRequiredInput)
    // Save functions as DocEntry[]
    // Save classes as DocEntry[]; actually, maybe save as map from className-->DocEntry?
    // Save global variables (e.g., window) as DocEntry[]
    // For the desired output type and the input types available,
    // search the DocEntry[]s for appropriate functions/classes/variables
    var varToSolutionsMap = {};
    // For each required output statement
    /*outputFileContents.variableStatements.forEach(function(outputVar:DocEntry){
        varToSolutionsMap[outputVar.name] = findSolution(outputVar, possibleMethodsAndVariables, variableTypeMap);
    });*/
    // for now, assume only 1 output var spec
    varToSolutionsMap[outputFileContents.variableStatements[0].name] = findSolution(outputFileContents.variableStatements[0], possibleMethodsAndVariables, variableTypeMap, possibleMethodsAndVariables["mapInstanceNameToObject"]);
    console.log("varToSolutionsMap");
    console.log(varToSolutionsMap);
    return varToSolutionsMap;
}
function addInheritedMethodsPropertiesToNativeJSVariables(jsAndWebAPIVariableStatements, jsAndWebAPIInterfaceDeclarations) {
    //const interfaceNames:string[] = Object.keys(jsAndWebAPIVariableStatements);
    //console.log(jsAndWebAPIVariableStatements);
    jsAndWebAPIVariableStatements.forEach(function (variableStatement) {
        //console.log(variableStatement.name);
        var variableType = variableStatement.type;
        // Find variableType in jsAndWebAPIInterfaceDeclarations,
        // and add the methods and properties to this jsAndWebAPIVariableStatement DocEntry
        var interfaceObject = jsAndWebAPIInterfaceDeclarations[variableType];
        if (interfaceObject) {
            //console.log(interfaceObject);
            /*if(variableStatement.name === "Math"){
                console.log(variableStatement);
            }*/
            // Note: we don't distinguish between instance/static for interfaces, they're both set to the same list of methods or properties
            if (variableStatement.methods) {
                if (!variableStatement.methods.instanceMethods) {
                    variableStatement.methods.instanceMethods = [];
                }
                variableStatement.methods.instanceMethods = variableStatement.methods.instanceMethods.concat(interfaceObject.methods.instanceMethods);
            }
            else {
                variableStatement.methods = { "instanceMethods": [] };
                variableStatement.methods.instanceMethods = interfaceObject.methods.instanceMethods;
            }
            if (variableStatement.properties) {
                if (!variableStatement.properties.instanceProperties) {
                    variableStatement.properties.instanceProperties = [];
                }
                variableStatement.properties.instanceProperties = variableStatement.properties.instanceProperties.concat(interfaceObject.properties.instanceProperties);
            }
            else {
                variableStatement.properties = { "instanceProperties": [] };
                variableStatement.properties.instanceProperties = interfaceObject.properties.instanceProperties;
            }
            /*if(variableStatement.name === "Math"){
                console.log(variableStatement);
            }*/
        }
    });
    /*interfaceNames.forEach(function(interfaceName:string){
        const jsAndWebAPIVariableStatement:DocEntry = jsAndWebAPIVariableStatements[interfaceName];
        const variableType = jsAndWebAPIVariableStatement.type;
        if(variableType.indexOf(" ") === -1){
            // variableType in native JS
            
            // Find variableType in jsAndWebAPIInterfaceDeclarations,
            // and add the methods and properties to this jsAndWebAPIVariableStatement DocEntry

            const interfaceDocEntry:DocEntry = jsAndWebAPIInterfaceDeclarations[variableType];
            //console.log(interfaceDocEntry);

            //interfaceDocEntry.properties.

        }else{
            // In other API
            // Remove this element?
        }
    });*/
}
function findSolution(outputVar, possibleMethodsAndVariables, variableTypeMap, mapInstanceNameToObject) {
    var synthesizedCandidateSolutions = [];
    var possibleFunctions = possibleMethodsAndVariables["possibleFunctions"];
    for (var i = 0; i < possibleFunctions.length; i++) {
        var funcObject = possibleFunctions[i];
        synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(findSolutionWithGivenMethodOrFunction(outputVar, funcObject, variableTypeMap, "", mapInstanceNameToObject));
    }
    var mapClassToInstanceMethods = possibleMethodsAndVariables["mapClassToInstanceMethods"];
    synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(findSolutionWithMethods(outputVar, mapClassToInstanceMethods, variableTypeMap, mapInstanceNameToObject));
    var mapClassToStaticMethods = possibleMethodsAndVariables["mapClassToStaticMethods"];
    synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(findSolutionWithMethods(outputVar, mapClassToStaticMethods, variableTypeMap, mapInstanceNameToObject));
    return synthesizedCandidateSolutions;
}
function findSolutionWithMethods(outputVar, mapClassToMethods, variableTypeMap, mapInstanceNameToObject) {
    var synthesizedCandidateSolutions = [];
    var classOrInstanceNames = Object.keys(mapClassToMethods);
    for (var i = 0; i < classOrInstanceNames.length; i++) {
        var classOrInstanceName = classOrInstanceNames[i];
        var classOrInstanceMethods = mapClassToMethods[classOrInstanceName];
        for (var j = 0; j < classOrInstanceMethods.length; j++) {
            var staticMethodObject = classOrInstanceMethods[j];
            synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(findSolutionWithGivenMethodOrFunction(outputVar, staticMethodObject, variableTypeMap, classOrInstanceName, mapInstanceNameToObject));
        }
    }
    return synthesizedCandidateSolutions;
}
function findSolutionWithGivenMethodOrFunction(outputVar, funcDocEntry, variableTypeMap, classOrInstanceName, mapInstanceNameToObject) {
    var parameterOptions = getParameterOptions(funcDocEntry, variableTypeMap);
    var methodOrFunctionNameWithScope;
    if (classOrInstanceName.length > 0) { // if static or instance method of a class
        methodOrFunctionNameWithScope = classOrInstanceName + "." + funcDocEntry.name;
    }
    else {
        methodOrFunctionNameWithScope = funcDocEntry.name;
    }
    var validArgSets = recursiveCheckParamCombos(funcDocEntry.name, classOrInstanceName, outputVar.value, parameterOptions, [], mapInstanceNameToObject);
    var synthesizedCandidateSolutions = [];
    for (var i = 0; i < validArgSets.length; i++) {
        var validArgs = validArgSets[i];
        var solutionString = composeSolutionString(methodOrFunctionNameWithScope, validArgs);
        synthesizedCandidateSolutions.push(solutionString);
    }
    return synthesizedCandidateSolutions;
}
function recursiveCheckParamCombos(funcName, className, outputVarValue, paramOptions, paramsChosenSoFar, mapInstanceNameToObject) {
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
            var val = computeValue(funcName, className, paramsChosenSoFarClone, mapInstanceNameToObject);
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
            validArgSets = validArgSets.concat(recursiveCheckParamCombos(funcName, className, outputVarValue, paramOptions, paramsChosenSoFarClone, mapInstanceNameToObject));
        }
    }
    return validArgSets;
}
function computeValue(funcName, className, params, mapInstanceNameToObject) {
    //console.log("computeValue called");
    /*console.log("funcName");
    console.log(funcName);
    console.log("className");
    console.log(className);*/
    var argNamesList = [];
    var argValuesList = [];
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        argNamesList.push(param.name);
        argValuesList.push(param.val);
    }
    var funcObject;
    /*try {
        funcObject = nonStrictEval(funcName); // native JS/TS function?
    }catch(error){
        funcObject = nonStrictEval(exampleInput[funcName]); // function defined in input file
    }*/
    /*try{
        funcObject = nonStrictEval(funcName);
    }catch{
        funcObject = nonStrictEval("(" + transpiledInputFileContentsString + funcName + ")");
    }*/
    try {
        funcObject = nonStrictEval_1.nonStrictEval("(" + funcName + ")");
    }
    catch (_a) {
        try {
            funcObject = nonStrictEval_1.nonStrictEval("(" + transpiledInputFileContentsString + funcName + ")");
        }
        catch (_b) {
            try {
                funcObject = nonStrictEval_1.nonStrictEval(transpiledInputFileContentsString + funcName);
            }
            catch (_c) {
            }
        }
    }
    /*if(className.length > 0){
        console.log(exampleInput);
        funcObject = nonStrictEval(exampleInput[className][funcName]);
        // instead of exampleInput[funcName], probably need
            // exampleInput[className][staticOrInstanceFuncName]
    }*/
    /*if(className === "C"){
        funcObject = nonStrictEval("C." + funcName);
    }*/
    /*if(className.length > 0){ // Assume all user-defined classes are defined in "classes" module
        funcObject = nonStrictEval(classes[className][funcName]);
    }*/
    if (className.length > 0) { // Assume all user-defined classes are defined in "classes" module
        var classObject = void 0;
        try {
            classObject = nonStrictEval_1.nonStrictEval("(" + transpiledInputFileContentsString + className + ")");
        }
        catch (_d) {
            classObject = nonStrictEval_1.nonStrictEval(transpiledInputFileContentsString + className);
        }
        //const classObject = exampleInput[className];
        if (classObject) { // if "className" is an actual class name
            //funcObject = nonStrictEval(exampleInput[className][funcName]);
            funcObject = nonStrictEval_1.nonStrictEval(classObject[funcName]);
        }
        else { // "className" is actually an class instance object; use mapInstanceNameToObject to get the instance object
            var instanceObject = mapInstanceNameToObject[className];
            //console.log("instanceObject");
            //console.log(instanceObject);
            funcObject = nonStrictEval_1.nonStrictEval(instanceObject[funcName]);
        }
        // something else?
    }
    //console.log("funcObject");
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
function composeSolutionString(funcName, validArgs) {
    var paramCodeString = funcName + "(";
    for (var paramIndex = 0; paramIndex < validArgs.length; paramIndex++) {
        paramCodeString += validArgs[paramIndex].name;
        //paramCodeString += nonStrictEval(validArgs[paramIndex].name);
        if (paramIndex < validArgs.length - 1) {
            paramCodeString += ", ";
        }
    }
    paramCodeString += ")";
    return paramCodeString;
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
