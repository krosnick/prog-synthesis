function getExampleCodeTypes(exampleInputCodeFileName: string, exampleOutputCodeFileName: string){
    // can we use getTypeInfo stuff? will that work for variables?
}

function getFunctionSignatureTypes(functionClassFileNames: string[]){

}

function synthesizeCode(exampleInputCodeFileName: string, exampleOutputCodeFileName: string):string{
    getExampleCodeTypes(exampleInputCodeFileName, exampleOutputCodeFileName);


    // for all type declaration files in node_modules, in particular node_modules/typescript/lib,
        // extract function/class param+return types; compare to code in exampleInputCodeFileName, exampleOutputCodeFileName
}