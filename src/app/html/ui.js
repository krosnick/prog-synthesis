// import * as fs from "fs";

var selectedCode;
var fullInputCode;
var leftOfEquals;

$(document).ready(function() {
    $('#synthesizeButton').on('click', function(){
        selectedCode = window.getSelection().toString().trim();
        fullInputCode = monaco.editor.getModels()[0].getValue().toString().trim();
        $("#origCode").html(selectedCode);

        getResults();
    });
    $("#results").on("click", ".btn", function(e){
        $("#results .btn").removeClass("active");
        $(event.target).parent(".btn").addClass("active");
        // Should 
    });

    $("#replaceButton").on("click", function(){
        var selectedOutput = $(".active").text();
        console.log(selectedOutput);
        replaceCodeSolutionInEditor(selectedOutput);

        // Clear list of solutions
        $("#list_of_solutions").empty();
        // Clear orig code
        $("#origCode").empty();

        // Hide results
        $("#results").hide();
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
    
    //console.log(fullInputCode);

    var indexOfSelectedCode = fullInputCode.indexOf(selectedCode);
    var codeBeforeSelection = fullInputCode.substring(0, indexOfSelectedCode);
    //console.log(codeBeforeSelection);

	$.post('/user_input', {desiredOutput: selectedCode, providedInput: codeBeforeSelection}, addCodeSolutionsToDOM);
	// outputFileSync('exampleInput.ts', user_input);
}

function putSolutionInVariableStatement(codeSolutionValue){
    leftOfEquals = selectedCode.substring(0, selectedCode.indexOf("="));
    var codeSolution = leftOfEquals + "= " + codeSolutionValue + ";";
    return codeSolution;
}

function addCodeSolutionsToDOM(results) {
    var codeSolutions = results["codeSolutions"];
    //console.log(codeSolutions);
    //document.getElementById("results").innerHTML = results;
    var btnGroup = $('<div class="btn-group-vertical btn-group-toggle" data-toggle="buttons" ></div>');
    codeSolutions.forEach(function(solution, index){
        btnGroup.append('<label class="btn btn-light btn-sm codeText"><input type="radio" name="options" id="solution_' + index + '" autocomplete="off">' + putSolutionInVariableStatement(solution) + '</label>');
    });
    $("#list_of_solutions").append(btnGroup);
    $("#results").show();
}
// Callback function that updates the DOM once the post data (programSynthesis results) comes back

function replaceCodeSolutionInEditor(codeSolution){
    var indexOfSelectedCode = fullInputCode.indexOf(selectedCode);
    var codeBeforeSelection = fullInputCode.substring(0, indexOfSelectedCode);
    var codeAfterSelection = fullInputCode.substring(indexOfSelectedCode + selectedCode.length);
    
    var newFullEditorCode = codeBeforeSelection + codeSolution + codeAfterSelection;
    //console.log(newFullEditorCode);
    monaco.editor.getModels()[0].setValue(newFullEditorCode);
}


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