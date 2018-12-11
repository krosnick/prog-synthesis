"use strict";
exports.__esModule = true;
var getTypeInfo_1 = require("./getTypeInfo");
var ts = require("typescript");
var nonStrictEval_1 = require("./nonStrictEval");
var _ = require("lodash");
var fs = require("fs");
//const nonStrictEval = require('./nonStrictEval');
var javascript_declaration_file = "./lib.d.ts";
function transpileCode(tsCodeString) {
    var transpiledCode = ts.transpileModule(tsCodeString, {
        compilerOptions: {
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.CommonJS,
            noImplicitUseStrict: true
        }
    }).outputText;
    return transpiledCode;
}
exports.transpileCode = transpileCode;
var transpiledInputFileContentsString;
//export function main(fileNameRequiredInput:string, fileNameRequiredOutput:string):{[str:string]:string[]} {
function main(fileNameRequiredInput, fileNameRequiredOutput) {
    // Get string of the code in the input file
    var inputFileContentsString = fs.readFileSync(fileNameRequiredInput, "utf8");
    /*transpiledInputFileContentsString = ts.transpileModule(inputFileContentsString,
        {
            compilerOptions: {
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.CommonJS,
                noImplicitUseStrict: true
            },
        }
    ).outputText;*/
    transpiledInputFileContentsString = transpileCode(inputFileContentsString);
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
    var isVarStatement = getTypeInfo_1.isVariableStatement([fileNameRequiredOutput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    });
    if (!isVarStatement) {
        return undefined;
    }
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
    // Now, need to do 2 things
    // 1. Process jsAndWebAPIVariableStatements, using jsAndWebAPIInterfaceDeclarations,
    // adding more properties and methods to the variable statements
    // 2. Potentially(?) process inputFileContents using jsAndWebAPIVariableStatements (or other)
    // adding more properties and methods to the variable statements
    // Process jsAndWebAPIVariableStatements, using jsAndWebAPIInterfaceDeclarations,
    // adding more properties and methods to the variable statements
    addInheritedMethodsPropertiesToNativeJSVariables(jsAndWebAPIVariableStatements, jsAndWebAPIInterfaceDeclarations);
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
    // Add jsAndWebAPIVariableStatements, jsAndWebAPIFunctionDeclarations to appropriate attributes of possibleMethodsAndVariables
    //console.log(jsAndWebAPIFunctionDeclarations);
    possibleMethodsAndVariables["possibleFunctions"] = possibleMethodsAndVariables["possibleFunctions"].concat(jsAndWebAPIFunctionDeclarations);
    possibleMethodsAndVariables["possibleVariables"] = possibleMethodsAndVariables["possibleVariables"].concat(jsAndWebAPIVariableStatements);
    /*console.log('possibleMethodsAndVariables["mapClassToInstanceProperties"]');
    console.log(possibleMethodsAndVariables["mapClassToInstanceProperties"]);
    console.log('jsAndWebAPIVariableStatements');
    console.log(jsAndWebAPIVariableStatements);*/
    /*console.log('possibleMethodsAndVariables["mapClassToInstanceMethods"]');
    console.log(possibleMethodsAndVariables["mapClassToInstanceMethods"]);
    console.log('jsAndWebAPIVariableStatements');
    console.log(jsAndWebAPIVariableStatements);*/
    for (var i = 0; i < jsAndWebAPIVariableStatements.length; i++) {
        var varStatementObject = jsAndWebAPIVariableStatements[i];
        var varStatementObjectName = varStatementObject.name;
        //if(varStatementObjectName === "Object" || varStatementObjectName === "Math" || varStatementObjectName === "String" || varStatementObjectName === "Date"){
        if (varStatementObjectName === "Object" || varStatementObjectName === "Math") {
            if (varStatementObject.properties && varStatementObject.properties.instanceProperties.length > 0) {
                // There are properties for this object
                // Add to possibleMethodsAndVariables["mapClassToInstanceProperties"]
                possibleMethodsAndVariables["mapClassToInstanceProperties"][varStatementObjectName] = varStatementObject.properties.instanceProperties;
            }
            if (varStatementObject.methods && varStatementObject.methods.instanceMethods.length > 0) {
                possibleMethodsAndVariables["mapClassToInstanceMethods"][varStatementObjectName] = varStatementObject.methods.instanceMethods;
            }
        }
    }
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
    //console.log(possibleMethodsAndVariables);
    //console.log(possibleMethodsAndVariables["mapClassToInstanceProperties"]);
    //console.log(possibleMethodsAndVariables["mapClassToInstanceMethods"]);
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
    /*const varToSolutionsMap = {};
    //console.log("beforeFindSolution");
    // for now, assume only 1 output var spec
    varToSolutionsMap[outputFileContents.variableStatements[0].name] = findSolution(outputFileContents.variableStatements[0], possibleMethodsAndVariables, variableTypeMap, possibleMethodsAndVariables["mapInstanceNameToObject"]);
    console.log("varToSolutionsMap");
    console.log(varToSolutionsMap);*/
    var codeSolutions = findSolution(outputFileContents.variableStatements[0], possibleMethodsAndVariables, variableTypeMap, possibleMethodsAndVariables["mapInstanceNameToObject"]);
    var codeSolutionsMap = {};
    codeSolutions.forEach(function (codeSolution) {
        codeSolutionsMap[codeSolution] = true;
    });
    var uniqueListOfCodeSolutions = Object.keys(codeSolutionsMap);
    return uniqueListOfCodeSolutions;
    //return codeSolutions;
    //return varToSolutionsMap;
}
exports.main = main;
function addInheritedMethodsPropertiesToNativeJSVariables(jsAndWebAPIVariableStatements, jsAndWebAPIInterfaceDeclarations) {
    jsAndWebAPIVariableStatements.forEach(function (variableStatement) {
        var variableType = variableStatement.type;
        // Find variableType in jsAndWebAPIInterfaceDeclarations,
        // and add the methods and properties to this jsAndWebAPIVariableStatement DocEntry
        var typeInterfaceObject = jsAndWebAPIInterfaceDeclarations[variableType];
        if (typeInterfaceObject) {
            addMethodsPropertiesOfInterfaceType(variableStatement, typeInterfaceObject);
        }
        var ownNameInterfaceObject = jsAndWebAPIInterfaceDeclarations[variableStatement.name];
        if (ownNameInterfaceObject) {
            addMethodsPropertiesOfInterfaceType(variableStatement, ownNameInterfaceObject);
        }
    });
}
function addMethodsPropertiesOfInterfaceType(variableStatementDocEntry, interfaceDocEntry) {
    //console.log(interfaceObject);
    /*if(variableStatementDocEntry.name === "Number"){
        //console.log(variableStatementDocEntry);
    }*/
    // Note: we don't distinguish between instance/static for interfaces, they're both set to the same list of methods or properties
    if (variableStatementDocEntry.methods) {
        if (!variableStatementDocEntry.methods.instanceMethods) {
            variableStatementDocEntry.methods.instanceMethods = [];
        }
        variableStatementDocEntry.methods.instanceMethods = variableStatementDocEntry.methods.instanceMethods.concat(interfaceDocEntry.methods.instanceMethods);
    }
    else {
        variableStatementDocEntry.methods = { "instanceMethods": [] };
        variableStatementDocEntry.methods.instanceMethods = interfaceDocEntry.methods.instanceMethods;
    }
    if (variableStatementDocEntry.properties) {
        if (!variableStatementDocEntry.properties.instanceProperties) {
            variableStatementDocEntry.properties.instanceProperties = [];
        }
        variableStatementDocEntry.properties.instanceProperties = variableStatementDocEntry.properties.instanceProperties.concat(interfaceDocEntry.properties.instanceProperties);
    }
    else {
        variableStatementDocEntry.properties = { "instanceProperties": [] };
        variableStatementDocEntry.properties.instanceProperties = interfaceDocEntry.properties.instanceProperties;
    }
    /*if(variableStatementDocEntry.name === "Number"){
        //console.log(variableStatementDocEntry);
        console.log(variableStatementDocEntry.methods.instanceMethods);
    }*/
}
function findSolution(outputVar, possibleMethodsAndVariables, variableTypeMap, mapInstanceNameToObject) {
    var synthesizedCandidateSolutions = [];
    //console.log("before searching possibleFunctions");
    var possibleFunctions = possibleMethodsAndVariables["possibleFunctions"];
    for (var i = 0; i < possibleFunctions.length; i++) {
        var funcObject = possibleFunctions[i];
        var aSolution = findSolutionWithGivenMethodOrFunction(outputVar, funcObject, variableTypeMap, "", mapInstanceNameToObject);
        //console.log(aSolution);
        if (aSolution) {
            synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(aSolution);
        }
    }
    //console.log("before searching mapClassToInstanceMethods");
    var mapClassToInstanceMethods = possibleMethodsAndVariables["mapClassToInstanceMethods"];
    synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(findSolutionWithMethods(outputVar, mapClassToInstanceMethods, variableTypeMap, mapInstanceNameToObject));
    //console.log("after searching mapClassToInstanceMethods");
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
            var aSolution = findSolutionWithGivenMethodOrFunction(outputVar, staticMethodObject, variableTypeMap, classOrInstanceName, mapInstanceNameToObject);
            /*if(staticMethodObject.name === "keys" && classOrInstanceName === "Object"){
                console.log("Object.keys");
                console.log("aSolution: " + aSolution);
            }*/
            if (aSolution) {
                synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(aSolution);
            }
        }
    }
    return synthesizedCandidateSolutions;
}
function findSolutionWithGivenMethodOrFunction(outputVar, funcDocEntry, variableTypeMap, classOrInstanceName, mapInstanceNameToObject) {
    /*if(funcDocEntry.name ===  "parseInt"){
        console.log("parseInt");
        console.log(funcDocEntry);
        console.log(funcDocEntry.signatureInfo[0].parameters);
    }*/
    var parameterOptions = getParameterOptions(funcDocEntry, variableTypeMap);
    var paramsOptional = [];
    var params = funcDocEntry.signatureInfo[0].parameters;
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        paramsOptional.push(param.optional);
    }
    /*if(funcDocEntry.name === "parseInt"){
        console.log(paramsOptional);
    }*/
    /*if(funcDocEntry.name === "keys" && classOrInstanceName === "Object"){
        console.log("Object.keys");
        console.log(funcDocEntry);
        console.log(parameterOptions);
    }*/
    var someParamNotSatisfiable = false;
    parameterOptions.forEach(function (optionsForParamIndexI) {
        if (optionsForParamIndexI.length === 0) {
            someParamNotSatisfiable = true;
        }
    });
    if (someParamNotSatisfiable) {
        return undefined;
    }
    /*console.log(funcDocEntry);
    console.log(parameterOptions);*/
    var methodOrFunctionNameWithScope;
    if (classOrInstanceName.length > 0) { // if static or instance method of a class
        methodOrFunctionNameWithScope = classOrInstanceName + "." + funcDocEntry.name;
    }
    else {
        methodOrFunctionNameWithScope = funcDocEntry.name;
    }
    if (funcDocEntry.name === "addTwoNumbers") {
        //console.log("funcDocEntry.name: " + funcDocEntry.name);
        //console.log("classOrInstanceName: " + classOrInstanceName);
        //console.log(funcDocEntry.signatureInfo[0].parameters);
    }
    if (funcDocEntry.signatureInfo[0].parameters.length === 0) {
        // Function takes no arguments
        // Check and see if calling the function (with no args of course) results in correct value
        var val = computeValue(funcDocEntry.name, classOrInstanceName, [], mapInstanceNameToObject);
        if (_.isEqual(val.computedValue, outputVar.value)) {
            // compose solution string and return result
            var solutionString = composeSolutionString(methodOrFunctionNameWithScope, []);
            return [solutionString];
        }
        else {
            return [];
        }
    }
    else {
        var validArgSets = recursiveCheckParamCombos(funcDocEntry.name, classOrInstanceName, outputVar.value, parameterOptions, [], mapInstanceNameToObject, paramsOptional);
        /*console.log("funcDocEntry.name: " + funcDocEntry.name);
        console.log("classOrInstanceName: " + classOrInstanceName);*/
        //console.log(validArgSets);
        //if(validArgSets){
        var synthesizedCandidateSolutions = [];
        for (var i = 0; i < validArgSets.length; i++) {
            var validArgs = validArgSets[i];
            var solutionString = composeSolutionString(methodOrFunctionNameWithScope, validArgs);
            synthesizedCandidateSolutions.push(solutionString);
        }
        return synthesizedCandidateSolutions;
    }
    //}else{
    //    return undefined;
    //}
}
function recursiveCheckParamCombos(funcName, className, outputVarValue, paramOptions, paramsChosenSoFar, mapInstanceNameToObject, paramsOptional) {
    var validArgSets = [];
    // If last param to be chosen
    if (paramsChosenSoFar.length === paramOptions.length - 1) {
        // For the last index in paramOptions, for each param option
        var optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        // If this param is optional, also compute the value at this point and with the args up till this point.
        if (paramsOptional[paramsChosenSoFar.length]) {
            var paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            var val = computeValue(funcName, className, paramsChosenSoFarClone, mapInstanceNameToObject);
            if (_.isEqual(val.computedValue, outputVarValue)) {
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        for (var i = 0; i < optionsForThisParam.length; i++) {
            var thisParamOption = optionsForThisParam[i];
            var paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            // Compute function call on these params (given the prior params paramsChosenSoFar and thisParamOption)
            var val = computeValue(funcName, className, paramsChosenSoFarClone, mapInstanceNameToObject);
            if (_.isEqual(val.computedValue, outputVarValue)) {
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        // Compute what the function eval would be, and compare to outputVarValue
        // If matches, return string representation
    }
    else { // If not last param to be chosen
        var optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        if (paramsOptional[paramsChosenSoFar.length]) {
            var paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            var val = computeValue(funcName, className, paramsChosenSoFarClone, mapInstanceNameToObject);
            if (_.isEqual(val.computedValue, outputVarValue)) {
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        for (var i = 0; i < optionsForThisParam.length; i++) {
            var thisParamOption = optionsForThisParam[i];
            var paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            var recursiveCheckParamCombosResult = recursiveCheckParamCombos(funcName, className, outputVarValue, paramOptions, paramsChosenSoFarClone, mapInstanceNameToObject, paramsOptional);
            if (recursiveCheckParamCombosResult) {
                validArgSets = validArgSets.concat(recursiveCheckParamCombosResult);
            }
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
            try {
                funcObject = nonStrictEval_1.nonStrictEval(classObject[funcName]);
            }
            catch (_e) { }
        }
        else { // "className" is actually an class instance object; use mapInstanceNameToObject to get the instance object
            var instanceObject = mapInstanceNameToObject[className];
            //console.log("instanceObject");
            //console.log(instanceObject);
            try {
                funcObject = nonStrictEval_1.nonStrictEval(instanceObject[funcName]);
            }
            catch (_f) { }
        }
        // something else?
    }
    //console.log("funcObject");
    //console.log(funcObject);
    //console.log("argValuesList");
    //console.log(argValuesList);
    var value = undefined;
    try {
        value = funcObject.apply(this, argValuesList);
    }
    catch (_g) { }
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
        /*if(funcDocEntry.name === "keys"){
            console.log(paramType);
            console.log(variableTypeMap["possibleVariables"]);
        }*/
        var possibleVariablesOfType = variableTypeMap["possibleVariables"][paramType];
        if (paramType === "{}" || paramType === "object") {
            if (!possibleVariablesOfType) {
                possibleVariablesOfType = [];
            }
            // Use any variable that is an object
            // Go through variableTypeMap["possibleVariables"] to find any variable that is an object
            var possibleVariableNames = Object.keys(variableTypeMap["possibleVariables"]);
            //let objectVariables = [];
            possibleVariableNames.forEach(function (varName) {
                var varType = variableTypeMap["possibleVariables"][varName][0].type;
                //console.log(varType);
                //console.log(eval(varType));
                //console.log(typeof varType);
                var actualType;
                try {
                    actualType = typeof eval(varType);
                    if (actualType === "object") {
                        possibleVariablesOfType.push(variableTypeMap["possibleVariables"][varName][0]);
                    }
                }
                catch (_a) {
                    possibleVariablesOfType.push(variableTypeMap["possibleVariables"][varName][0]);
                }
                /*if(typeof varType === "object"){
                    console.log(varName);
                }*/
            });
            //console.log("objectVariables");
            //console.log(possibleVariablesOfType);
        }
        //console.log(possibleVariablesOfType);
        // This would not work for paramType="any"
        // (in that case, maybe consider all variables in variableTypeMap)
        if (possibleVariablesOfType) {
            possibleVariablesOfType.forEach(function (variable) {
                var variableName = variable.name;
                var variableValue = variable.value;
                singleParamOptions.push({
                    name: variableName,
                    val: variableValue
                });
            });
        }
        var mapClassToInstanceTypes = variableTypeMap["mapClassToInstanceTypes"];
        if (mapClassToInstanceTypes) {
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
        }
        var mapClassToStaticTypes = variableTypeMap["mapClassToStaticTypes"];
        if (mapClassToStaticTypes) {
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
        }
        /*if(paramType === "{}"){
            console.log("singleParamOptions");
            console.log(singleParamOptions);
        }*/
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
/*const fileNameRequiredInput:string = "./data/exampleInput.ts";
const fileNameRequiredOutput:string = "./data/exampleOutput.ts";
main(fileNameRequiredInput, fileNameRequiredOutput);*/ 
