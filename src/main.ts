import {getDocEntrys,isVariableStatement,FileContents,getPossibleFunctions,getPossibleMethodsAndVariables,mapVariablesToTypes, DocEntry} from "./getTypeInfo";
import * as ts from "typescript";
import {nonStrictEval} from "./nonStrictEval";
import * as _ from "lodash";
import * as fs from "fs";
import { type } from "os";
//const nonStrictEval = require('./nonStrictEval');

const javascript_declaration_file = "./lib.d.ts";

export function transpileCode(tsCodeString:string){
    const transpiledCode:string = ts.transpileModule(tsCodeString,
        {
            compilerOptions: {
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.CommonJS,
                noImplicitUseStrict: true
            },
        }
    ).outputText;
    return transpiledCode;
}

let transpiledInputFileContentsString;
//export function main(fileNameRequiredInput:string, fileNameRequiredOutput:string):{[str:string]:string[]} {
export function main(fileNameRequiredInput:string, fileNameRequiredOutput:string):string[]{

    // Get string of the code in the input file
    let inputFileContentsString = fs.readFileSync(fileNameRequiredInput, "utf8");
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
    const inputFileContents:FileContents = getDocEntrys([fileNameRequiredInput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false, transpiledInputFileContentsString);
    //}, true, transpiledInputFileContentsString);
    //console.log("inputFileContents");
    //console.log(inputFileContents);

    // Process required output; save as DocEntry[]

    const isVarStatement:boolean = isVariableStatement([fileNameRequiredOutput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    });

    if(!isVarStatement){
        return undefined;
    }

    const outputFileContents:FileContents = getDocEntrys([fileNameRequiredOutput], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, false, inputFileContentsString);
    // console.log("outputFileContents");
    // console.log(outputFileContents);

    const ecmaScriptFileContents:FileContents = getDocEntrys([javascript_declaration_file], {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    }, true, inputFileContentsString);

    const jsAndWebAPIInterfaceDeclarations = ecmaScriptFileContents["interfaceDeclarations"];
    const jsAndWebAPIFunctionDeclarations = ecmaScriptFileContents["functionDeclarations"];
    const jsAndWebAPIVariableStatements = ecmaScriptFileContents["variableStatements"];

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

    let possibleMethodsAndVariables = getPossibleMethodsAndVariables(inputFileContents, outputFileContents);
    
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

    

    for(let i = 0; i < jsAndWebAPIVariableStatements.length; i++){
        const varStatementObject:DocEntry = jsAndWebAPIVariableStatements[i];
        const varStatementObjectName = varStatementObject.name;
        //if(varStatementObjectName === "Object" || varStatementObjectName === "Math" || varStatementObjectName === "String" || varStatementObjectName === "Date"){
        if(varStatementObjectName === "Object" || varStatementObjectName === "Math"){
            if(varStatementObject.properties && varStatementObject.properties.instanceProperties.length > 0){
                // There are properties for this object
                // Add to possibleMethodsAndVariables["mapClassToInstanceProperties"]
                possibleMethodsAndVariables["mapClassToInstanceProperties"][varStatementObjectName] = varStatementObject.properties.instanceProperties;
            }
            if(varStatementObject.methods && varStatementObject.methods.instanceMethods.length > 0){
                possibleMethodsAndVariables["mapClassToInstanceMethods"][varStatementObjectName] = varStatementObject.methods.instanceMethods;
            }
        }
    }

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

    const codeSolutions:string[] = findSolution(outputFileContents.variableStatements[0], possibleMethodsAndVariables, variableTypeMap, possibleMethodsAndVariables["mapInstanceNameToObject"]);

    const codeSolutionsMap = {};
    codeSolutions.forEach(function(codeSolution){
        codeSolutionsMap[codeSolution] = true;
    });

    const uniqueListOfCodeSolutions = Object.keys(codeSolutionsMap);

    return uniqueListOfCodeSolutions;
    //return codeSolutions;
    //return varToSolutionsMap;
}

function addInheritedMethodsPropertiesToNativeJSVariables(jsAndWebAPIVariableStatements, jsAndWebAPIInterfaceDeclarations){
    jsAndWebAPIVariableStatements.forEach(function(variableStatement:DocEntry){
        const variableType = variableStatement.type;

        // Find variableType in jsAndWebAPIInterfaceDeclarations,
        // and add the methods and properties to this jsAndWebAPIVariableStatement DocEntry
    
        const typeInterfaceObject:DocEntry = jsAndWebAPIInterfaceDeclarations[variableType];
        if(typeInterfaceObject){
            addMethodsPropertiesOfInterfaceType(variableStatement, typeInterfaceObject);
        }

        const ownNameInterfaceObject:DocEntry = jsAndWebAPIInterfaceDeclarations[variableStatement.name];
        if(ownNameInterfaceObject){
            addMethodsPropertiesOfInterfaceType(variableStatement, ownNameInterfaceObject)
        }
    });
}

function addMethodsPropertiesOfInterfaceType(variableStatementDocEntry:DocEntry, interfaceDocEntry:DocEntry){
    
    //console.log(interfaceObject);

    /*if(variableStatementDocEntry.name === "Number"){
        //console.log(variableStatementDocEntry);
    }*/

    // Note: we don't distinguish between instance/static for interfaces, they're both set to the same list of methods or properties

    if(variableStatementDocEntry.methods){
        if(!variableStatementDocEntry.methods.instanceMethods){
            variableStatementDocEntry.methods.instanceMethods = [];
        }
        variableStatementDocEntry.methods.instanceMethods = variableStatementDocEntry.methods.instanceMethods.concat(interfaceDocEntry.methods.instanceMethods);
    }else{
        variableStatementDocEntry.methods = {"instanceMethods": []};
        variableStatementDocEntry.methods.instanceMethods = interfaceDocEntry.methods.instanceMethods;
    }

    if(variableStatementDocEntry.properties){
        if(!variableStatementDocEntry.properties.instanceProperties){
            variableStatementDocEntry.properties.instanceProperties = [];
        }
        variableStatementDocEntry.properties.instanceProperties = variableStatementDocEntry.properties.instanceProperties.concat(interfaceDocEntry.properties.instanceProperties);
    }else{
        variableStatementDocEntry.properties = {"instanceProperties": []};
        variableStatementDocEntry.properties.instanceProperties = interfaceDocEntry.properties.instanceProperties;
    }

    
    /*if(variableStatementDocEntry.name === "Number"){
        //console.log(variableStatementDocEntry);
        console.log(variableStatementDocEntry.methods.instanceMethods);
    }*/
}

function findSolution(outputVar:DocEntry, possibleMethodsAndVariables, variableTypeMap, mapInstanceNameToObject):string[]{
    let synthesizedCandidateSolutions:string[] = [];
    
    //console.log("before searching possibleFunctions");
    const possibleFunctions = possibleMethodsAndVariables["possibleFunctions"];
    for(let i = 0; i < possibleFunctions.length; i++){
        const funcObject = possibleFunctions[i];
        const aSolution = findSolutionWithGivenMethodOrFunction(outputVar, funcObject, variableTypeMap, "", mapInstanceNameToObject);
        //console.log(aSolution);
        if(aSolution){
            synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(aSolution);
        }
    }

    //console.log("before searching mapClassToInstanceMethods");
    const mapClassToInstanceMethods = possibleMethodsAndVariables["mapClassToInstanceMethods"];
    synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(findSolutionWithMethods(outputVar, mapClassToInstanceMethods, variableTypeMap, mapInstanceNameToObject));
    //console.log("after searching mapClassToInstanceMethods");

    const mapClassToStaticMethods = possibleMethodsAndVariables["mapClassToStaticMethods"];
    synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(findSolutionWithMethods(outputVar, mapClassToStaticMethods, variableTypeMap, mapInstanceNameToObject));

    return synthesizedCandidateSolutions;
    
}

function findSolutionWithMethods(outputVar:DocEntry, mapClassToMethods, variableTypeMap, mapInstanceNameToObject){
    let synthesizedCandidateSolutions:string[] = [];

    const classOrInstanceNames = Object.keys(mapClassToMethods);
    for(let i = 0; i < classOrInstanceNames.length; i++){
        const classOrInstanceName = classOrInstanceNames[i];
        const classOrInstanceMethods:DocEntry[] = mapClassToMethods[classOrInstanceName];
        for(let j = 0; j < classOrInstanceMethods.length; j++){
            const staticMethodObject = classOrInstanceMethods[j];
            const aSolution = findSolutionWithGivenMethodOrFunction(outputVar, staticMethodObject, variableTypeMap, classOrInstanceName, mapInstanceNameToObject);
            /*if(staticMethodObject.name === "keys" && classOrInstanceName === "Object"){
                console.log("Object.keys");
                console.log("aSolution: " + aSolution);
            }*/
            if(aSolution){
                synthesizedCandidateSolutions = synthesizedCandidateSolutions.concat(aSolution);
            }
        }
    }

    return synthesizedCandidateSolutions;
}

function findSolutionWithGivenMethodOrFunction(outputVar:DocEntry, funcDocEntry:DocEntry, variableTypeMap, classOrInstanceName:string, mapInstanceNameToObject):string[]{


    /*if(funcDocEntry.name ===  "parseInt"){
        console.log("parseInt");
        console.log(funcDocEntry);
        console.log(funcDocEntry.signatureInfo[0].parameters);
    }*/

    const parameterOptions:({name:string, val:any})[][] = getParameterOptions(funcDocEntry, variableTypeMap);
    
    const paramsOptional:boolean[] = [];
    const params = funcDocEntry.signatureInfo[0].parameters;
    for(let i = 0; i < params.length; i++){
        let param = params[i];
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

    let someParamNotSatisfiable:boolean = false;
    parameterOptions.forEach(function(optionsForParamIndexI){
        if(optionsForParamIndexI.length === 0){
            someParamNotSatisfiable = true;
        }
    });

    if(someParamNotSatisfiable){
        return undefined;
    }
    /*console.log(funcDocEntry);
    console.log(parameterOptions);*/
    
    let methodOrFunctionNameWithScope;
    if(classOrInstanceName.length > 0){ // if static or instance method of a class
        methodOrFunctionNameWithScope = classOrInstanceName + "." + funcDocEntry.name;
    }else{
        methodOrFunctionNameWithScope = funcDocEntry.name;
    }

    if(funcDocEntry.name === "addTwoNumbers"){
        //console.log("funcDocEntry.name: " + funcDocEntry.name);
        //console.log("classOrInstanceName: " + classOrInstanceName);
        //console.log(funcDocEntry.signatureInfo[0].parameters);
    }
    
    if(funcDocEntry.signatureInfo[0].parameters.length === 0){
        // Function takes no arguments
        // Check and see if calling the function (with no args of course) results in correct value

        const val:{argNamesList:string[], computedValue:any} = computeValue(funcDocEntry.name, classOrInstanceName, [], mapInstanceNameToObject);  
        if(_.isEqual(val.computedValue, outputVar.value)){
            // compose solution string and return result
            const solutionString = composeSolutionString(methodOrFunctionNameWithScope, []);
            return [solutionString];
        }else{
            return [];
        }
    }else{
        const validArgSets:({name:string, val:any})[][] = recursiveCheckParamCombos(funcDocEntry.name, classOrInstanceName, outputVar.value, parameterOptions, [], mapInstanceNameToObject, paramsOptional);
        /*console.log("funcDocEntry.name: " + funcDocEntry.name);
        console.log("classOrInstanceName: " + classOrInstanceName);*/
        //console.log(validArgSets);
        //if(validArgSets){
        const synthesizedCandidateSolutions:string[] = [];

        for(let i = 0; i < validArgSets.length; i++){
            const validArgs:({name:string, val:any})[] = validArgSets[i];
            const solutionString = composeSolutionString(methodOrFunctionNameWithScope, validArgs);
            synthesizedCandidateSolutions.push(solutionString);
        }
        return synthesizedCandidateSolutions;
    }
    //}else{
    //    return undefined;
    //}
}

function recursiveCheckParamCombos(funcName:string, className:string, outputVarValue, paramOptions:({name:string, val:any})[][], paramsChosenSoFar:({name:string, val:any})[], mapInstanceNameToObject, paramsOptional:boolean[]):({name:string, val:any})[][]{
    let validArgSets:({name:string, val:any})[][] = [];

    // If last param to be chosen
    if(paramsChosenSoFar.length === paramOptions.length-1){
        // For the last index in paramOptions, for each param option
        const optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        
        // If this param is optional, also compute the value at this point and with the args up till this point.
        if(paramsOptional[paramsChosenSoFar.length]){
            const paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            const val:{argNamesList:string[], computedValue:any} = computeValue(funcName, className, paramsChosenSoFarClone, mapInstanceNameToObject);
            if(_.isEqual(val.computedValue, outputVarValue)){
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        
        
        for(let i = 0; i < optionsForThisParam.length; i++){
            const thisParamOption = optionsForThisParam[i];
            const paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            // Compute function call on these params (given the prior params paramsChosenSoFar and thisParamOption)
            const val:{argNamesList:string[], computedValue:any} = computeValue(funcName, className, paramsChosenSoFarClone, mapInstanceNameToObject);
            if(_.isEqual(val.computedValue, outputVarValue)){
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        // Compute what the function eval would be, and compare to outputVarValue
        // If matches, return string representation
    }else{ // If not last param to be chosen
        const optionsForThisParam = paramOptions[paramsChosenSoFar.length];
        
        if(paramsOptional[paramsChosenSoFar.length]){
            const paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            const val:{argNamesList:string[], computedValue:any} = computeValue(funcName, className, paramsChosenSoFarClone, mapInstanceNameToObject);
            if(_.isEqual(val.computedValue, outputVarValue)){
                validArgSets.push(paramsChosenSoFarClone);
            }
        }
        
        for(let i = 0; i < optionsForThisParam.length; i++){
            const thisParamOption = optionsForThisParam[i];
            const paramsChosenSoFarClone = _.cloneDeep(paramsChosenSoFar);
            paramsChosenSoFarClone.push(thisParamOption);
            const recursiveCheckParamCombosResult = recursiveCheckParamCombos(funcName, className, outputVarValue, paramOptions, paramsChosenSoFarClone, mapInstanceNameToObject, paramsOptional);
            if(recursiveCheckParamCombosResult){
                validArgSets = validArgSets.concat(recursiveCheckParamCombosResult);
            }
        }
    }
    return validArgSets;
}

function computeValue(funcName:string, className:string, params:({name:string, val:any})[], mapInstanceNameToObject) : {argNamesList:string[], computedValue:any}{
    //console.log("computeValue called");

    /*console.log("funcName");
    console.log(funcName);
    console.log("className");
    console.log(className);*/

    const argNamesList = [];
    const argValuesList = [];
    for(let i = 0; i < params.length; i++){
        const param = params[i];
        argNamesList.push(param.name);
        argValuesList.push(param.val);
    }

    let funcObject;
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

    try{
        funcObject = nonStrictEval("(" + funcName + ")");
    }catch{
        try{
            funcObject = nonStrictEval("(" + transpiledInputFileContentsString + funcName + ")");
        }catch{
            try{
                funcObject = nonStrictEval(transpiledInputFileContentsString + funcName);
            }catch{
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

    if(className.length > 0){ // Assume all user-defined classes are defined in "classes" module
        let classObject;
        try{
            classObject = nonStrictEval("(" + transpiledInputFileContentsString + className + ")");
        }catch{
            classObject = nonStrictEval(transpiledInputFileContentsString + className);
        }
        //const classObject = exampleInput[className];
        if(classObject){ // if "className" is an actual class name
            //funcObject = nonStrictEval(exampleInput[className][funcName]);
            try{
                funcObject = nonStrictEval(classObject[funcName]);
            }catch{}
        }else{ // "className" is actually an class instance object; use mapInstanceNameToObject to get the instance object
            const instanceObject = mapInstanceNameToObject[className];
            //console.log("instanceObject");
            //console.log(instanceObject);
            try{
                funcObject = nonStrictEval(instanceObject[funcName]);
            }catch{}
        }
        // something else?
    }
    //console.log("funcObject");
    //console.log(funcObject);

    //console.log("argValuesList");
    //console.log(argValuesList);

    let value = undefined;
    try{
        value = funcObject.apply(this, argValuesList);
    }catch{}
    //console.log("computedValue");
    //console.log(value);

    return {
        "argNamesList": argNamesList,
        "computedValue": value
    }

    //console.log(exampleInput["addTwoNumbers"].apply(this, argList));
}

function composeSolutionString(funcName:string, validArgs:({name:string, val:any})[]):string{
    let paramCodeString = funcName + "(";
    for(let paramIndex = 0; paramIndex < validArgs.length; paramIndex++){
        paramCodeString += validArgs[paramIndex].name;
        //paramCodeString += nonStrictEval(validArgs[paramIndex].name);
        if(paramIndex < validArgs.length-1){
            paramCodeString += ", ";
        }
    }
    paramCodeString += ")";
    return paramCodeString;
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

        /*if(funcDocEntry.name === "keys"){
            console.log(paramType);
            console.log(variableTypeMap["possibleVariables"]);
        }*/

        let possibleVariablesOfType = variableTypeMap["possibleVariables"][paramType];

        if(paramType === "{}" || paramType === "object"){
            if(!possibleVariablesOfType){
                possibleVariablesOfType = [];
            }
            // Use any variable that is an object
            // Go through variableTypeMap["possibleVariables"] to find any variable that is an object
            const possibleVariableNames = Object.keys(variableTypeMap["possibleVariables"]);
            //let objectVariables = [];
            possibleVariableNames.forEach(function(varName){
                const varType = variableTypeMap["possibleVariables"][varName][0].type;
                //console.log(varType);
                //console.log(eval(varType));
                //console.log(typeof varType);

                let actualType;
                try{
                    actualType = typeof eval(varType);
                    if(actualType === "object"){
                        possibleVariablesOfType.push(variableTypeMap["possibleVariables"][varName][0]);
                    }
                }catch{
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
        if(possibleVariablesOfType){
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
        }

        const mapClassToInstanceTypes = variableTypeMap["mapClassToInstanceTypes"];
        if(mapClassToInstanceTypes){
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
        }

        const mapClassToStaticTypes = variableTypeMap["mapClassToStaticTypes"];
        if(mapClassToStaticTypes){
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