import {C} from "./../test";
//import "./../test";

const numToWord:{[num:number]:string} = {1: "one", 2: "two", 3: "three"};
const byeVar:string = 'bye';
const numVar:number = 1001;
const myArr:number[] = [1,5,3,7];
//const myDate:Date = new Date();
const myClass:C = new C("hello");

export function addTwoNumbers(a:number, b:number) { return a + b; };
export function returnKeys(dict:{ [num:number]:string }, str:string) { return Object.keys(dict); };
export function returnValues(dict:{ [num:number]:string }) {
	return Object.keys(dict).map((key) => { return dict[key]; });
};
export function concatStrings(str1:string, str2:string){
	return str1.concat(str2);
};
// function returnBeys(dict:{ [num:number]:string }) { return dict.keys(); };