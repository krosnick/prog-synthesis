"use strict";
exports.__esModule = true;
var test_1 = require("./../test");
//import "./../test";
var numToWord = { 1: "one", 2: "two", 3: "three" };
var byeVar = 'bye';
var numVar = 1001;
var myArr = [1, 5, 3, 7];
//const myDate:Date = new Date();
var myClass = new test_1.C("hello");
function addTwoNumbers(a, b) { return a + b; }
exports.addTwoNumbers = addTwoNumbers;
;
function returnKeys(dict, str) { return dict.keys(); }
exports.returnKeys = returnKeys;
;
function returnValues(dict) {
    return Object.keys(dict).map(function (key) { return dict[key]; });
}
exports.returnValues = returnValues;
;
// function returnBeys(dict:{ [num:number]:string }) { return dict.keys(); };
