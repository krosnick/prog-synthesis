/**
 * Documentation for C
 */
export class C {
    /**
     * constructor documentation
     * @param a my parameter documentation
     * @param b another parameter documentation
     */
    constructor(a: string, b: C) { }

    public pubValue:number;
    private privValue:string;

    public static addNewDemonstration(demonstration:string):boolean{
        return true;
    }
    
    public testFunc(str:string):boolean{
        return true;
    }
}

C.addNewDemonstration('hello');
//C.testFunc('asdf');