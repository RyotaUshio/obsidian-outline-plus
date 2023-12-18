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

		// First, patch the outline view to access an OutlineItemDom object
		const uninstaller = around(outlineView.constructor.prototype, {
			getItemDom(old) {
				return function (heading: HeadingCache) {
					const itemDom = old.call(this, heading);
					// Second, patch OutlineItemDom
					plugin.patchOutlineItemDom(itemDom);
					// uninstall the patch for the outline view immediately once an OutlineItemDom is patched
					uninstaller();
					return itemDom;
				}
			}
		});

		this.updateOutlineView();

		return true;
	}

	patchOutlineItemDom(itemDom: OutlineItemDom): void {
		const plugin = this;
		const app = this.app;

		this.register(around(itemDom.constructor.prototype, {
			prerender(old) {
				return async function () {
					const self = this as OutlineItemDom;

					const originalHeading = self.heading;
					// temporary prefix to avoid the heading text being parsed as an list item or a heading
					// https://forum.obsidian.md/t/headings-with-numbers-miss-in-toc-outline-of-heading/65155?u=ush
					const prefix = 'ABC ';
					self.heading = Object.assign({}, originalHeading, { heading: prefix + originalHeading.heading });

					if (plugin.settings.renderMarkdown) {
						this.setCollapsible(this.vChildren.hasChildren());
						const tmpContainer = createDiv();
						await MarkdownRenderer.render(app, self.heading.heading, tmpContainer, self.view.file?.path ?? '', self.view);
						self.innerEl.replaceChildren(...tmpContainer.firstChild?.childNodes ?? []);
						self.innerEl.addClass('markdown-rendered');
					} else {
						old.call(self);
					}

					const child = self.innerEl.firstChild;
					if (child?.nodeType === Node.TEXT_NODE && child.textContent) {
						child.textContent = child.textContent.slice(prefix.length).trimStart();
					}

					self.heading = originalHeading;
				}
			}
		}));
	}

	updateOutlineView() {
		this.app.workspace.getLeavesOfType('outline').forEach((leaf) => {
			const view = leaf.view as OutlineView;
			view.update();
		});
	}
}
