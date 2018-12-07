/**
 * Documentation for C
 */
export class C {
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
//C["forAll"] = 200;

//C.testStaticReturnBoolean('hello');
//C.testFunc('asdf');