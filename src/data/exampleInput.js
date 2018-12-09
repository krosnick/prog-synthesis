//import {C} from "./../test";
//import "./../test";
/**
 * Documentation for C
 */
var C = /** @class */ (function () {
    /**
     * constructor documentation
     * @param a my parameter documentation
     * @param b another parameter documentation
     */
    function C(a) {
        this.pubValue = a.length * 100;
        this.strValue = a;
    }
    //public static forAll:number = 200;
    //public forAll:number = 200;
    C.testStaticReturnBoolean = function (arg) {
        return true;
    };
    C.testStaticReturnNumber = function (arg) {
        return 4;
    };
    C.testStaticReturnString = function (arg) {
        return "testString";
    };
    C.prototype.testInstanceReturnBoolean = function (arg) {
        return true;
    };
    C.prototype.testInstanceReturnNumber = function (arg) {
        return 4;
    };
    C.prototype.testInstanceReturnString = function (arg) {
        return "testString";
    };
    return C;
}());
/*const numA:number = 10;
const numB:number = 20;
const sum:number = numA + numB;*/
//const testVar:number = addTwoNumbers(1,2);
var numToWord = { 1: "one", 2: "two", 3: "three" };
var byeVar = 'bye';
var numVar = 1001;
var myArr = [1, 5, 3, 7];
//const myDate:Date = new Date();
var myClass = new C("hello");
var num2 = 2;
var num3 = 3;
function addTwoNumbers(a, b) { return a + b; }
;
function returnKeys(dict, str) { return Object.keys(dict); }
;
function returnValues(dict) {
    return Object.keys(dict).map(function (key) { return dict[key]; });
}
;
function concatStrings(str1, str2) {
    return str1.concat(str2);
}
