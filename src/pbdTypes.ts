export type ElID = number;
export type DEMOID = number;
export type BEHAVIORID = number;
export type ACTIONID = number;
export type Expression = Operation | StateUIAttribute;

export interface RuntimeJSONObject {
	demonstrations: Demonstration[];
	behaviors: {
		condition: Condition,
		events: PbDEvent[],
		/*action: Action,*/
		actions: Action[],
		demonstrations: Demonstration[]
	}[]
}

export interface State {
	elements: {
		[key: number]: UIElement;
	}
}

export interface UIElement {
	id:ElID;
	x:number;
	y:number;
	name?:string;
	bbWidth:number;
	bbHeight:number;
}

export interface SolidElement /*extends UIElement*/ {
	id:ElID;
	x:number;
	y:number;
	bbWidth:number;
	bbHeight:number;
	//color: string;
	color: Color;
}

export interface TextElement /*extends UIElement*/ {
	id:ElID;
	x:number;
	y:number;
	text:string;
	font_size:string;
}

export interface ImageElement /*extends UIElement*/ {
	id:ElID;
	x:number;
	y:number;
	src:string;
	width:number;
	height:number;
}



export interface PbDEvent {
	/*computed UI state event, time pass, user interaction*/
	// subtypes?
}

export interface UserInteractionEvent /*implements PbDEvent*/{
	event:Event;
}

/*class UIStateEvent implements PbDEvent {
	//what's the difference between this and Condition?
	//event: Operation | ...
}*/

export interface TimePassedEvent /*implements PbDEvent*/ {
	startTimeMilliseconds:number;
	endTimeMilliseconds: number;
}

export interface Demonstration {
	before_state: State;
	after_state: State;
	candidate_events: PbDEvent[];
	id: DEMOID;
	/* How to represent that the user dragged an element from point A to point B? A list of mousedrag events?*/
	/* Or actually, should a candidate state be the UI before_state? */
	// optional per element, per property changes?
}

export interface StateUIAttribute {
	elementID: ElID;
	attribute: string;
}

export interface Parameter {
	value: Operation | StateUIAttribute | boolean | number | string;
	// Can be either an Operation, or some aspect of the current state, or some constant
}

export interface Condition {
	expression: Operation
};

export enum Operator {
	Less_than = "Less_than",
	Less_than_or_equal_to = "Less_than_or_equal_to",
	Greater_than = "Greater_than",
	Greater_than_or_equal_to = "Greater_than_or_equal_to",
	Equal_to = "Equal_to",
	And = "And",
	Or = "Or",
	Not = "Not",
	In = "In",
	Plus = "Plus",
	Minus = "Minus",
	Multiply = "Multiply",
	Divide = "Divide",
	Modulus = "Modulus"
}

export interface Operation {
	operator: Operator;
	parameters: (Operation | StateUIAttribute | boolean | number | string)[];
}

export interface Action {
	// relative change, absolute change; but "relative" change could mean various things; x+=2, x*=2
	// Maybe action code should have 2 subtypes: AbsoluteChange; RelativeChange
	// AbsoluteChange takes only the absolute value; RelativeChange takes 2 inputs: relative value change, and the operator (+, *, etc)
	// There also needs to be a UI element attribute
	/*type:ActionType;*/
	operator:ActionOperator;
	parameters: (Operation | StateUIAttribute | boolean | number | string)[];
}

export enum ActionType {
	Absolute = "Absolute",
	Relative = "Relative"
}

export enum ActionOperator {
	Equals = "Equals",
	PlusEquals = "PlusEquals",
	MinusEquals = "MinusEquals",
	MultiplyEquals = "MultiplyEquals",
	DivideEquals = "DivideEquals",
	ModulusEquals = "ModulusEquals"
}

export interface Behavior {
	condition?: Condition; // a condition isn't necessarily needed; maybe a particular event always results in the behavior
	event: PbDEvent;
	//action: Action;
	actions: Action[];
	demonstrations: Demonstration[];
	id: BEHAVIORID;
}

export interface UIElementDiff {
	id:ElID;
	name?:string;
	before_state:UIElementValues;
	after_state:UIElementValues;
	diff:UIElementValues;
}

export interface UIElementValues {
	x:number;
	y:number;
	bbWidth:number;
	bbHeight:number;
	//color: string;
	color: Color;
	text:string;
	font_size:string;
	src:string;
	width:number;
	height:number;
}

export interface Color {
	r:number;
	g:number;
	b:number;
}

export interface StateDiff {
	[elementID: number]: {
		[propertyName: string]: PropertyDiff
	};
}

export interface PropertyDiff {
	// Later on better define the types of these
	stateA,
	stateB,
	diff
}

export interface DiffAndAction {
	diff:StateDiff,
	action:Action
}

/*export interface BehaviorInfo {
	decisionTree?: DecisionTree,
	behaviors: Behavior[]
}*/

export interface ElementPropertyInfo {
	decisionTree?: DecisionTree,
	demoRelativeAbsoluteActionOptions: { /*Will contain candidate actions (including "nothing" for demos that had no action for this element property) for all demos for this event*/
		[demonstrationID: number]: {
			/* Maybe modify later to be simpler representation
			(to make easier to compare across demos)*/
			relativeAction:Action,
			absoluteAction:Action
		}
	},
	action?:Action, /*Should have either an "action" or a "decisionTree"*/
	demonstrations:Demonstration[]/*,*/ /*Only the demonstrations that had a change for this element property*/
	//decisionTreeColumnFeatures?:Set<Operation>
}

export interface ElementPropertyActionDemoInfo {
	[elementID: number]: {
		[propertyName: string]: ElementPropertyInfo
		//{
			// decisionTree?: DecisionTree,
			// demoRelativeAbsoluteActionOptions: { /*Will contain candidate actions (including "nothing" for demos that had no action for this element property) for all demos for this event*/
			// 	[demonstrationID: number]: {
			// 		/* Maybe modify later to be simpler representation
			// 		(to make easier to compare across demos)*/
			// 		relativeAction:Action,
			// 		absoluteAction:Action
			// 	}
			// },
			// action?:Action, /*Should have either an "action" or a "decisionTree"*/
			// demonstrations:Demonstration[], /*Only the demonstrations that had a change for this element property*/
			// decisionTreeColumnFeatures?:Set<Operation>
			// /*,
			// demonstrationActionPairs: {
			// 	[demonstrationID: number]: ACTIONID
			// }*/
		//}
	}
}

export interface EventDemoActionInfo {
	demonstrations:Demonstration[],
	elementPropertyActionDemoInfo:ElementPropertyActionDemoInfo
}

export interface PropertyNameToElementIDs {
	[propertyName: string]: number[];
}

export interface ComputedDecisionTreeColumnTypeComputeValueFunc {
	(newDemonstration:Demonstration, propertyNameToElementIDs:PropertyNameToElementIDs, demoBeforeAfterDiff:StateDiff);
}

export interface ComputedDecisionTreeColumnTypeEnumerateColumnsFunc {
	(newDemonstration:Demonstration, propertyNameToElementIDs:PropertyNameToElementIDs, demoBeforeAfterDiff:StateDiff, actionDemoInfoObject:ElementPropertyInfo):string[]/*:[Expression]*/;
}

export interface ComputedDecisionTreeColumnType {
	[propertyName: string]: {
		/*"computeValue": ComputedDecisionTreeColumnTypeComputeValueFunc, // required func*/
		"enumerateColumns": ComputedDecisionTreeColumnTypeEnumerateColumnsFunc, // required func
		[propName: string]: any; // From https://www.typescriptlang.org/docs/handbook/interfaces.html, so that we can have any arbitrary extra properties/functions
	}
}

// export interface DecisionTreeTable {
// 	[demoID: number]: {
// 		/*[colID: string]: Expression;*/
// 		[colID: string]: DecisionTreeColumnInfo
// 	}
// }

export interface ExpressionNameToObject {
	[expressionName: string]: Expression;
}

export interface DemonstrationIDToObject {
	[demoID: number]: Demonstration;
}
export interface DecisionTreeColumn {
	evalExpressionFunc: any, // supposed to be function
	elementIDs: number[]
}

export interface DecisionTreeColumnMap {
	[colID: string]: DecisionTreeColumn
}

export interface DecisionTree {
	decisionTreeColumnMap: DecisionTreeColumnMap,
	decisionTreeTable: DecisionTreeTable,
	decisionTreeDemoToAction?: DecisionTreeDemoToAction
}

export interface DecisionTreeTable {
	[demoID: number]: {
		[colID: string]: (boolean | number | string),
	}
}

export interface DecisionTreeDemoToAction {
	[demoID: number]: Action;
}