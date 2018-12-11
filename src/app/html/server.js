var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var fs = require('fs');
var outputFileSync = require('output-file-sync');
var synthesize = require('../../main');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '')));

app.get('/',function(req,res){
	var options = {
		root: __dirname
	};
	res.render("index");
});

app.post('/user_input',function(req,res) {

	//console.log("WE ON THE SERVER ABOUT TO RUN")
	//outputFileSync('exampleInput.ts', Object.keys(req.body)[0]);
	outputFileSync('exampleInput.ts', req.body.providedInput);
	outputFileSync('exampleOutput.ts', req.body.desiredOutput);

	// Call synthesize on these
	var codeSolutions = synthesize.main('exampleInput.ts', 'exampleOutput.ts');
	//console.log(codeSolutions);

	// Send results back to client
	res.json({
		"codeSolutions": codeSolutions
	});
});
// app.get('/currentData',function(req,res){
// 	res.json({
// 		"views": Object.values(views),
// 		/*"elementRules": elementRules,*/
// 		"cssRules": cssRules
// 	});
// });

app.listen(8080);