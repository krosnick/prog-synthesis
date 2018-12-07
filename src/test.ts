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

    public static addNewDemonstration(demonstration:string):boolean{
        return true;
    }

    public testFunc(str:string):boolean{
        return true;
    }
}
C["forAll"] = 200;

C.addNewDemonstration('hello');
//C.testFunc('asdf');