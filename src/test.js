"use strict";
exports.__esModule = true;
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
exports.C = C;
//C["forAll"] = 200;
//C.testStaticReturnBoolean('hello');
//C.testFunc('asdf');
