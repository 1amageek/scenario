"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsondiffpatch_1 = require("jsondiffpatch");
const shouldBeHandling = (delta, dependencies) => {
    return dependencies.reduce((prev, dependency) => {
        if (dependency in delta) {
            return true;
        }
        return prev;
    }, false);
};
class ChapterContext {
    constructor(document, title) {
        this.sections = [];
        this.document = document;
        this.title = title;
    }
    onWrite(handler, dependencies, title) {
        const sectionTitle = title || 'onWrite';
        this.sections.push({
            title: sectionTitle,
            body: this.document.onWrite((change, context) => {
                const before = change.before.data();
                const after = change.after.data();
                const delta = jsondiffpatch_1.diff(before, after);
                if (delta && shouldBeHandling(delta, dependencies)) {
                    handler(change, context);
                }
            })
        });
    }
    onUpdate(handler, dependencies, title) {
        const sectionTitle = title || 'onUpdate';
        this.sections.push({
            title: sectionTitle,
            body: this.document.onUpdate((change, context) => {
                const before = change.before.data();
                const after = change.after.data();
                const delta = jsondiffpatch_1.diff(before, after);
                if (delta && shouldBeHandling(delta, dependencies)) {
                    handler(change, context);
                }
            })
        });
    }
    onCreate(handler, title) {
        const sectionTitle = title || 'onCreate';
        this.sections.push({
            title: sectionTitle,
            body: this.document.onCreate(handler)
        });
    }
    onDelete(handler, title) {
        const sectionTitle = title || 'onDelete';
        this.sections.push({
            title: sectionTitle,
            body: this.document.onDelete(handler)
        });
    }
    build() {
        return Object.fromEntries(new Map(this.sections.map(section => {
            return [section.title, section.body];
        })));
    }
}
class ScenarioContext {
    constructor(functionBuilder) {
        this.chapters = [];
        this.functionBuilder = functionBuilder;
    }
    handler(path, handler, title) {
        const chapterTitle = title || `${this.chapters.length}`;
        const context = new ChapterContext(this.functionBuilder.firestore.document(path), chapterTitle);
        handler(context);
        this.chapters.push(context);
    }
    build() {
        return Object.fromEntries(new Map(this.chapters.map(chapter => {
            return [chapter.title, chapter.build()];
        })));
    }
}
exports.default = (functionBuilder, handler) => {
    const context = new ScenarioContext(functionBuilder);
    handler(context);
    return context.build();
};
//# sourceMappingURL=index.js.map