import { firestore, Change, EventContext, CloudFunction, FunctionBuilder } from 'firebase-functions';
declare type Field = string;
declare type Section = {
    title: string;
    body: CloudFunction<firestore.DocumentSnapshot> | CloudFunction<Change<firestore.DocumentSnapshot>>;
};
declare class ChapterContext {
    private document;
    title: string;
    sections: Section[];
    constructor(document: firestore.DocumentBuilder, title: string);
    onWrite(handler: (change: Change<firestore.DocumentSnapshot>, context: EventContext) => PromiseLike<any> | any, dependencies: Field[], title?: string): void;
    onUpdate(handler: (change: Change<firestore.DocumentSnapshot>, context: EventContext) => PromiseLike<any> | any, dependencies: Field[], title?: string): void;
    onCreate(handler: (snapshot: firestore.DocumentSnapshot, context: EventContext) => PromiseLike<any> | any, title?: string): void;
    onDelete(handler: (snapshot: firestore.DocumentSnapshot, context: EventContext) => PromiseLike<any> | any, title?: string): void;
    build(): {
        [k: string]: CloudFunction<Change<firestore.DocumentSnapshot>> | CloudFunction<firestore.DocumentSnapshot>;
    };
}
declare class ScenarioContext {
    private functionBuilder;
    chapters: ChapterContext[];
    constructor(functionBuilder: FunctionBuilder);
    handler(path: string, handler: (document: ChapterContext) => void, title?: string): void;
    build(): {
        [k: string]: {
            [k: string]: CloudFunction<Change<firestore.DocumentSnapshot>> | CloudFunction<firestore.DocumentSnapshot>;
        };
    };
}
declare const _default: (functionBuilder: FunctionBuilder, handler: (context: ScenarioContext) => void) => {
    [k: string]: {
        [k: string]: CloudFunction<Change<firestore.DocumentSnapshot>> | CloudFunction<firestore.DocumentSnapshot>;
    };
};
export default _default;
