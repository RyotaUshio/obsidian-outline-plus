import { FileView, HeadingCache } from 'obsidian';

interface OutlineView extends FileView {}

interface OutlineItemDom {
    heading: HeadingCache;
    vChildren: VChildren;
    innerEl: HTMLElement;
    view: OutlineView;
    prerender(): void;
    setCollapsible(): void;
}

interface VChildren {
    hasChildren(): boolean;
}
