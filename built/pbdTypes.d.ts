export declare type ElID = number;
export declare type DEMOID = number;
export declare type BEHAVIORID = number;
export declare type ACTIONID = number;
export declare type Expression = Operation | StateUIAttribute;
export interface RuntimeJSONObject {
    demonstrations: Demonstration[];
    behaviors: {
        condition: Condition;
        events: PbDEvent[];
        actions: Action[];
        demonstrations: Demonstration[];
    }[];
}
export interface State {
    elements: {
        [key: number]: UIElement;
    };
}
export interface UIElement {
    id: ElID;
    x: number;
    y: number;
    name?: string;
    bbWidth: number;
    bbHeight: number;
}
export interface SolidElement {
    id: ElID;
    x: number;
    y: number;
    bbWidth: number;
    bbHeight: number;
    color: Color;
}
export interface TextElement {
    id: ElID;
    x: number;
    y: number;
    text: string;
    font_size: string;
}
export interface ImageElement {
    id: ElID;
    x: number;
    y: number;
    src: string;
    width: number;
    height: number;
}
export interface PbDEvent {
}
export interface UserInteractionEvent {
    event: Event;
}
export interface TimePassedEvent {
    startTimeMilliseconds: number;
    endTimeMilliseconds: number;
}
export interface Demonstration {
    before_state: State;
    after_state: State;
    candidate_events: PbDEvent[];
    id: DEMOID;
}
export interface StateUIAttribute {
    elementID: ElID;
    attribute: string;
}
export interface Parameter {
    value: Operation | StateUIAttribute | boolean | number | string;
}
export interface Condition {
    expression: Operation;
}
export declare enum Operator {
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
    operator: ActionOperator;
    parameters: (Operation | StateUIAttribute | boolean | number | string)[];
}
export declare enum ActionType {
    Absolute = "Absolute",
    Relative = "Relative"
}
export declare enum ActionOperator {
    Equals = "Equals",
    PlusEquals = "PlusEquals",
    MinusEquals = "MinusEquals",
    MultiplyEquals = "MultiplyEquals",
    DivideEquals = "DivideEquals",
    ModulusEquals = "ModulusEquals"
}
export interface Behavior {
    condition?: Condition;
    event: PbDEvent;
    actions: Action[];
    demonstrations: Demonstration[];
    id: BEHAVIORID;
}
export interface UIElementDiff {
    id: ElID;
    name?: string;
    before_state: UIElementValues;
    after_state: UIElementValues;
    diff: UIElementValues;
}
export interface UIElementValues {
    x: number;
    y: number;
    bbWidth: number;
    bbHeight: number;
    color: Color;
    text: string;
    font_size: string;
    src: string;
    width: number;
    height: number;
}
export interface Color {
    r: number;
    g: number;
    b: number;
}
export interface StateDiff {
    [elementID: number]: {
        [propertyName: string]: PropertyDiff;
    };
}
export interface PropertyDiff {
    stateA: any;
    stateB: any;
    diff: any;
}
export interface DiffAndAction {
    diff: StateDiff;
    action: Action;
}
export interface ElementPropertyInfo {
    decisionTree?: DecisionTree;
    demoRelativeAbsoluteActionOptions: {
        [demonstrationID: number]: {
            relativeAction: Action;
            absoluteAction: Action;
        };
    };
    action?: Action;
    demonstrations: Demonstration[];
}
export interface ElementPropertyActionDemoInfo {
    [elementID: number]: {
        [propertyName: string]: ElementPropertyInfo;
    };
}
export interface EventDemoActionInfo {
    demonstrations: Demonstration[];
    elementPropertyActionDemoInfo: ElementPropertyActionDemoInfo;
}
export interface PropertyNameToElementIDs {
    [propertyName: string]: number[];
}
export interface ComputedDecisionTreeColumnTypeComputeValueFunc {
    (newDemonstration: Demonstration, propertyNameToElementIDs: PropertyNameToElementIDs, demoBeforeAfterDiff: StateDiff): any;
}
export interface ComputedDecisionTreeColumnTypeEnumerateColumnsFunc {
    (newDemonstration: Demonstration, propertyNameToElementIDs: PropertyNameToElementIDs, demoBeforeAfterDiff: StateDiff, actionDemoInfoObject: ElementPropertyInfo): string[];
}
export interface ComputedDecisionTreeColumnType {
    [propertyName: string]: {
        "enumerateColumns": ComputedDecisionTreeColumnTypeEnumerateColumnsFunc;
        [propName: string]: any;
    };
}
export interface ExpressionNameToObject {
    [expressionName: string]: Expression;
}
export interface DemonstrationIDToObject {
    [demoID: number]: Demonstration;
}
export interface DecisionTreeColumn {
    evalExpressionFunc: any;
    elementIDs: number[];
}
export interface DecisionTreeColumnMap {
    [colID: string]: DecisionTreeColumn;
}
export interface DecisionTree {
    decisionTreeColumnMap: DecisionTreeColumnMap;
    decisionTreeTable: DecisionTreeTable;
    decisionTreeDemoToAction?: DecisionTreeDemoToAction;
}
export interface DecisionTreeTable {
    [demoID: number]: {
        [colID: string]: (boolean | number | string);
    };
}
export interface DecisionTreeDemoToAction {
    [demoID: number]: Action;
}
