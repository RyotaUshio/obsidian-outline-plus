import { Plugin, HeadingCache, MarkdownRenderer } from 'obsidian';
import { around } from 'monkey-around';

import { DEFAULT_SETTINGS, OutlinePlusSettings, OutlinePlusSettingTab } from 'settings';
import { OutlineItemDom, OutlineView } from 'typings/obsidian';


export default class OutlinePlus extends Plugin {
	settings: OutlinePlusSettings;

	async onload() {
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new OutlinePlusSettingTab(this));

		this.app.workspace.onLayoutReady(() => {
			const success = this.patchOutlineView();
			if (!success) {
				const eventRef = this.app.workspace.on('layout-change', () => {
					const success = this.patchOutlineView();
					if (success) this.app.workspace.offref(eventRef);
				});
				this.registerEvent(eventRef);
			}
		});
	}

	onunload() {
		this.updateOutlineView();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	patchOutlineView() {
		const outlineView = this.app.workspace.getLeavesOfType('outline')[0]?.view;
		if (!outlineView) return false;
		const plugin = this;
		const app = this.app;

		// First, patch the outline view to access an OutlineItemDom object
		const uninstaller = around(outlineView.constructor.prototype, {
			createItemDom(old) {
				return function (originalHeading: HeadingCache) {
					// temporary prefix to avoid the heading text being parsed as an list item or a heading
					// https://forum.obsidian.md/t/headings-with-numbers-miss-in-toc-outline-of-heading/65155?u=ush
					const prefix = 'ABC ';
					const tmpHeading = Object.assign({}, originalHeading, { heading: prefix + originalHeading.heading });

					const dom = old.call(this, tmpHeading);
					dom.heading = originalHeading;

					const renderMarkdownIfNeeded = async () => {
						if (plugin.settings.renderMarkdown) {
							const tmpContainer = createDiv();
							await MarkdownRenderer.render(app, tmpHeading.heading, tmpContainer, dom.view.file?.path ?? '', dom.view);
							dom.innerEl.replaceChildren(...tmpContainer.firstChild?.childNodes ?? []);
							dom.innerEl.addClass('markdown-rendered');
						}
					};

					renderMarkdownIfNeeded().then(() => {
						const child = dom.innerEl.firstChild;
						if (child?.nodeType === Node.TEXT_NODE && child.textContent) {
							child.textContent = child.textContent.slice(prefix.length).trimStart();
						}
					});

					return dom;
				}
			}
		});

		this.register(uninstaller);

		this.updateOutlineView();

		return true;
	}

	updateOutlineView() {
		this.app.workspace.getLeavesOfType('outline').forEach((leaf) => {
			const view = leaf.view as OutlineView;
			view.update();
		});
	}
}
