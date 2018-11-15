function getExampleCodeTypes(exampleInputCodeFileName, exampleOutputCodeFileName) {
    // can we use getTypeInfo stuff? will that work for variables?
}
function getFunctionSignatureTypes(functionClassFileNames) {
}
function synthesizeCode(exampleInputCodeFileName, exampleOutputCodeFileName) {
    getExampleCodeTypes(exampleInputCodeFileName, exampleOutputCodeFileName);
    // for all type declaration files in node_modules, in particular node_modules/typescript/lib,
    // extract function/class param+return types; compare to code in exampleInputCodeFileName, exampleOutputCodeFileName
}
//# sourceMappingURL=checkType.js.map