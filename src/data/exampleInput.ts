import {C} from "./../test";
//import "./../test";

const numToWord:{[num:number]:string} = {1: "one", 2: "two", 3: "three"};
const byeVar:string = 'bye';
const numVar:number = 1001;
const myArr:number[] = [1,5,3,7];
//const myDate:Date = new Date();
const myClass:C = new C("hello");

export function addTwoNumbers(a:number, b:number):number { return a + b; };
export function returnKeys(dict:{ [num:number]:string }, str:string) { return dict.keys(); };
export function returnValues(dict:{ [num:number]:string }) {
	return Object.keys(dict).map((key) => { return dict[key]; });
};
// function returnBeys(dict:{ [num:number]:string }) { return dict.keys(); };