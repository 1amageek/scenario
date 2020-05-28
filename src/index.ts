import { firestore, Change, EventContext, CloudFunction, FunctionBuilder } from 'firebase-functions';
import { diff, Delta } from 'jsondiffpatch';

type Field = string
type Section = {
    title: string
    body: CloudFunction<firestore.DocumentSnapshot> | CloudFunction<Change<firestore.DocumentSnapshot>>
}

const shouldBeHandling = (delta: Delta, dependencies: Field[]) => {
    return dependencies.reduce((prev, dependency) => {
        if (dependency in delta) {
            return true
        }
        return prev
    }, false)
}

class ChapterContext {

    private document: firestore.DocumentBuilder

    public title: string

    public sections: Section[] = []

    public constructor(document: firestore.DocumentBuilder, title: string) {
        this.document = document
        this.title = title
    }

    public onWrite(handler: (change: Change<firestore.DocumentSnapshot>, context: EventContext) => PromiseLike<any> | any, dependencies: Field[], title?: string) {
        const sectionTitle = title || 'onWrite'
        this.sections.push({
            title: sectionTitle,
            body: this.document.onWrite((change, context) => {
                const before = change.before.data()
                const after = change.after.data()
                const delta = diff(before, after)
                if (delta && shouldBeHandling(delta, dependencies)) {
                    handler(change, context)
                }
            })
        })
    }

    public onUpdate(handler: (change: Change<firestore.DocumentSnapshot>, context: EventContext) => PromiseLike<any> | any, dependencies: Field[], title?: string) {
        const sectionTitle = title || 'onUpdate'
        this.sections.push({
            title: sectionTitle,
            body: this.document.onUpdate((change, context) => {
                const before = change.before.data()
                const after = change.after.data()
                const delta = diff(before, after)
                if (delta && shouldBeHandling(delta, dependencies)) {
                    handler(change, context)
                }
            })
        })
    }

    public onCreate(handler: (snapshot: firestore.DocumentSnapshot, context: EventContext) => PromiseLike<any> | any, title?: string) {
        const sectionTitle = title || 'onCreate'
        this.sections.push({
            title: sectionTitle,
            body: this.document.onCreate(handler)
        })
    }

    public onDelete(handler: (snapshot: firestore.DocumentSnapshot, context: EventContext) => PromiseLike<any> | any, title?: string) {
        const sectionTitle = title || 'onDelete'
        this.sections.push({
            title: sectionTitle,
            body: this.document.onDelete(handler)
        })
    }

    build() {
        return Object.fromEntries(new Map(this.sections.map(section => {
            return [section.title, section.body]
        })))
    }
}

class ScenarioContext {

    private functionBuilder: FunctionBuilder

    public chapters: ChapterContext[] = []

    public constructor(functionBuilder: FunctionBuilder) {
        this.functionBuilder = functionBuilder
    }

    public handler(path: string, handler: (document: ChapterContext) => void, title?: string) {
        const chapterTitle = title || `${this.chapters.length}`
        const context = new ChapterContext(this.functionBuilder.firestore.document(path), chapterTitle)
        handler(context)
        this.chapters.push(context)
    }

    build() {
        return Object.fromEntries(new Map(this.chapters.map(chapter => {
            return [chapter.title, chapter.build()]
        })))
    }
}

export default (functionBuilder: FunctionBuilder, handler: (context: ScenarioContext) => void) => {
    const context: ScenarioContext = new ScenarioContext(functionBuilder)
    handler(context)
    return context.build()
}
