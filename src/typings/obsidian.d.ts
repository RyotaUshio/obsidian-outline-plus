import { FileView, HeadingCache } from 'obsidian';

interface OutlineView extends FileView {
    update(): void;
    createItemDom(heading: HeadingCache): OutlineItemDom;
}

interface OutlineItemDom {
    heading: HeadingCache;
    vChildren: VChildren;
    innerEl: HTMLElement;
    selfEl: HTMLElement;
    view: OutlineView;
    setCollapsible(collapsible: boolean): void;
}

interface VChildren {
    hasChildren(): boolean;
}
