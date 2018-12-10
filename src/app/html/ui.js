// import * as fs from "fs";


$(document).ready(function() {
	$('#synthesize').on('click', getResults);
})

function getResults() {
//     // This is how to get all the contents of the editor:
//     // alert(monaco.editor.getModels()[0].getValue());
//     // Write the following to the exampleInput.ts file
//     user_input = window.getSelection().toString().trim();
//     alert(user_input);
//     // fp = new File('exampleInput.ts');
//     // var file = new File(user_input, 'exampleInput.ts', {
//  //          type: 'text/plain',
//     // });
//     // file.open('w')
//     // file.write(user_input);
	user_input = window.getSelection().toString().trim();
	console.log($("#program"));
	$.post('/user_input', user_input, updateDOM);
	// outputFileSync('exampleInput.ts', user_input);
}

function updateDOM(results) {
	document.getElementById("results").innerHTML = results;
}
// Callback function that updates the DOM once the post data (programSynthesis results) comes back

function runProgram() {
    programOutput = eval(monaco.editor.getModels()[0].getValue());
    // alert(programOutput);
    // Get string of the code in the input file
    // let inputFileContentsString = fs.readFileSync(fileNameRequiredInput, "utf8");
    // transpiledInputFileContentsString = ts.transpileModule(inputFileContentsString,
    //     {
    //         compilerOptions: {
    //             target: ts.ScriptTarget.ES5,
    //             module: ts.ModuleKind.CommonJS,
    //             noImplicitUseStrict: true
    //         },
    //     }
    // ).outputText;
    document.getElementById("program").innerHTML = programOutput;
}