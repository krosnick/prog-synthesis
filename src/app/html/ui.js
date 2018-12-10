// import * as fs from "fs";


$(document).ready(function() {
    $('#synthesize').on('click', getResults);
    $("#results").on("click", ".btn", function(e){
        $("#results .btn").removeClass("active");
        $(event.target).parent(".btn").addClass("active");
        // Should 
    });
});

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
    var selectedCode = window.getSelection().toString().trim();
    //console.log(selectedCode);
    //console.log($("#program"));
    //{"inputCode": , "desiredOutput": selectedCode}

    // input code
    var fullInputCode = monaco.editor.getModels()[0].getValue().toString().trim();
    //console.log(fullInputCode);

    var indexOfSelectedCode = fullInputCode.indexOf(selectedCode);
    var codeBeforeSelection = fullInputCode.substring(0, indexOfSelectedCode);
    //console.log(codeBeforeSelection);

	$.post('/user_input', {desiredOutput: selectedCode, providedInput: codeBeforeSelection}, updateDOM);
	// outputFileSync('exampleInput.ts', user_input);
}

function updateDOM(results) {
    var codeSolutions = results["codeSolutions"];
    //console.log(codeSolutions);
    //document.getElementById("results").innerHTML = results;
    var btnGroup = $('<div class="btn-group-vertical btn-group-toggle" data-toggle="buttons" ></div>');
    codeSolutions.forEach(function(solution, index){
        btnGroup.append('<label class="btn btn-light"><input type="radio" name="options" id="solution_' + index + '" autocomplete="off">' + solution + '</label>');
    });
    $("#list_of_solutions").append(btnGroup);
    $("#results").show();
}
// Callback function that updates the DOM once the post data (programSynthesis results) comes back

function runProgram() {
    programOutput = eval(monaco.editor.getModels()[0].getValue().toString());
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
    //document.getElementById("program").innerHTML = programOutput;
}