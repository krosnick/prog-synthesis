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
	var d = new Date();
	var startTime = d.getTime();
	var codeSolutions = synthesize.main('exampleInput.ts', 'exampleOutput.ts');
	var d2 = new Date();
	var timeElapsed = d2.getTime() - startTime;
	console.log("timeElapsed");
	console.log(timeElapsed);
	//console.log(codeSolutions);

	// Send results back to client
	res.json({
		"codeSolutions": codeSolutions
	});
});

app.post('/transpile_code', function(req, res){
	// transpile
	var transpiledCode = synthesize.transpileCode(req.body.fullCode);
	res.json({
		"transpiledCode": transpiledCode
	});
});

app.listen(8080);