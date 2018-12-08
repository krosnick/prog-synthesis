/**
 * Documentation for C
 */
export class C {
    /**
     * constructor documentation
     * @param a my parameter documentation
     * @param b another parameter documentation
     */
    constructor(a: string) { }

    public pubValue:number = 1234321;
    private privValue:string;
    public static forAll:number;

    public static addNewDemonstration(demonstration:string):boolean{
        return true;
    }

    public testFunc(str:string):boolean{
        return true;
    }
}

C.addNewDemonstration('hello');
//C.testFunc('asdf');