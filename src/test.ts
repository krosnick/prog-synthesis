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

<<<<<<< HEAD
    public pubValue:number = 1234321;
=======
    public pubValue:number;
    public strValue:string;
>>>>>>> bf5eff7e5af18cd1dc61a1b993617b021a883ad7
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