//import {C} from "./../test";
//import "./../test";

/**
 * Documentation for C
 */
class C {
    /**
     * constructor documentation
     * @param a my parameter documentation
     * @param b another parameter documentation
     */
    constructor(a: string) {
        this.pubValue = a.length * 100;
        this.strValue = a;
    }

    public pubValue:number;
    public strValue:string;
    private privValue:string;
    //public static forAll:number = 200;
    //public forAll:number = 200;

    public static testStaticReturnBoolean(arg:string):boolean{
        return true;
    }

    public static testStaticReturnNumber(arg:string):number{
        return 4;
    }

    public static testStaticReturnString(arg:string):string{
        return "testString";
    }

    public testInstanceReturnBoolean(arg:string):boolean{
        return true;
    }

    public testInstanceReturnNumber(arg:string):number{
        return 4;
    }

    public testInstanceReturnString(arg:string):string{
        return "testString";
    }
}

/*const numA:number = 10;
const numB:number = 20;
const sum:number = numA + numB;*/
//const testVar:number = addTwoNumbers(1,2);
const numToWord:{[num:number]:string} = {1: "one", 2: "two", 3: "three"};
const byeVar:string = 'bye';
const numVar:number = 1001;
const myArr:number[] = [1,5,3,7];
//const myDate:Date = new Date();
const myClass:C = new C("hello");
const num2:number = 2;
const num3:number = 3;

function addTwoNumbers(a:number, b:number) { return a + b; };
function returnKeys(dict:{ [num:number]:string }, str:string) { return Object.keys(dict); };
function returnValues(dict:{ [num:number]:string }) {
	return Object.keys(dict).map((key) => { return dict[key]; });
};
function concatStrings(str1:string, str2:string){
	return str1.concat(str2);
}