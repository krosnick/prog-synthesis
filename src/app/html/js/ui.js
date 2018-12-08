import * as fs from "fs";

function getResults() {
	// This is how to get all the contents of the editor:
	// alert(monaco.editor.getModels()[0].getValue());
	// Write the following to the exampleInput.ts file
	user_input = window.getSelection().toString().trim();
	// fp = new File('exampleInput.ts');
	var file = new File(user_input, 'exampleInput.ts', {
  		type: 'text/plain',
	});
	file.open('w')
	file.write(user_input);
}
