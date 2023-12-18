import { FileView, HeadingCache } from 'obsidian';

interface OutlineView extends FileView {}

interface OutlineItemDom {
    heading: HeadingCache;
    vChildren: VChildren;
    innerEl: HTMLElement;
    view: OutlineView;
    prerender(): void;
    setCollapsible(collapsible: boolean): void;
}

interface VChildren {
    hasChildren(): boolean;
}
