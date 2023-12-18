import { PluginSettingTab, Setting } from 'obsidian';
import OutlinePlus from './main';
import { OutlineView } from 'typings/obsidian';


export interface OutlinePlusSettings {
	renderMarkdown: boolean;
}

export const DEFAULT_SETTINGS: OutlinePlusSettings = {
	renderMarkdown: false,
};

// Inspired by https://stackoverflow.com/a/50851710/13613783
export type KeysOfType<Obj, Type> = NonNullable<{ [k in keyof Obj]: Obj[k] extends Type ? k : never }[keyof Obj]>;

export class OutlinePlusSettingTab extends PluginSettingTab {
	constructor(public plugin: OutlinePlus) {
		super(plugin.app, plugin);
	}

	addToggleSetting(settingName: KeysOfType<OutlinePlusSettings, boolean>, extraOnChange?: (value: boolean) => void) {
		return new Setting(this.containerEl)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings[settingName])
					.onChange(async (value) => {
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
						extraOnChange?.(value);
					});
			});
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		this.addToggleSetting('renderMarkdown', () => this.plugin.updateOutlineView())
			.setName('Render markdown in outline');
	}
}
