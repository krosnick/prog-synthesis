interface UIElement {
	id:number;
	x:number;
	y:number;
	name?:string;
	bbWidth:number;
    bbHeight:number;
    (source: string, subString: string): boolean;
}