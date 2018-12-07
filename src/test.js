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
    C.addNewDemonstration = function (demonstration) {
        return true;
    };
    C.prototype.testFunc = function (str) {
        return true;
    };
    return C;
}());
exports.C = C;
C["forAll"] = 200;
C.addNewDemonstration('hello');
//C.testFunc('asdf');
