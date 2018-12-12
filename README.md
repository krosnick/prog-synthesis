# prog-synthesis

Usage Instructions:

0. Start in the top level directory in a terminal

1. Run in terminal
cd src

2. Run in terminal
node src/app/html/server.js

3. Open a browser to http://localhost:8080/

4. Interact with the GUI
	Example:
	a) Highlight line 7 to specify which line you wish to synthesize code for.
	b) Click on the blue Synthesize button. Our program searches for a function
	   that will return the value on the right hand side of the equals sign in
	   the selected line.
	c) You will see results appear under the Synthesize button. Select the
	   result that appears by clicking on it in the list underneath the
	   "Candidate Solutions" subtitle (if you wanted, you may exit out of the
	   results using the x on the right).
	d) Click the dark gray Replace in editor button to replace your selected
	   line of code with this synthesized line of code.
	e) Add the following line at the end of the code in the editor:
	   console.log(out);
	f) Click the green Run code button to run all the code in the editor.
	   You may need to open up your browser's console to see the console.log()
	   output (on Mac's you can access this using command+option+i).

Some code adapted from https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
