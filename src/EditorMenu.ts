import { type Editor, type Menu, stringifyYaml } from 'obsidian';
import type MetaBindPlugin from './main';
import { createInputFieldInsertExamples, createViewFieldInsertExamples } from './faq/InputFieldExamples';
import { ButtonBuilderModal } from './fields/button/ButtonBuilderModal';

export function createEditorMenu(menu: Menu, editor: Editor, plugin: MetaBindPlugin): void {
	const inputFieldExamples = createInputFieldInsertExamples(plugin);
	const viewFieldExamples = createViewFieldInsertExamples(plugin);

	menu.addItem(mbItem => {
		mbItem.setTitle('Meta Bind');
		mbItem.setIcon('blocks');

		const mbSubmenu = mbItem.setSubmenu();

		mbSubmenu.addItem(ipfItem => {
			ipfItem.setTitle('Input Field');

			const ipfSubmenu = ipfItem.setSubmenu();

			for (const [type, declaration] of inputFieldExamples) {
				ipfSubmenu.addItem(item => {
					item.setTitle(type);
					item.onClick(() => insetAtCursor(editor, declaration));
				});
			}
		});

		mbSubmenu.addItem(vfItem => {
			vfItem.setTitle('View Field');

			const vfSubmenu = vfItem.setSubmenu();

			for (const [type, declaration] of viewFieldExamples) {
				vfSubmenu.addItem(item => {
					item.setTitle(type);
					item.onClick(() => insetAtCursor(editor, declaration));
				});
			}
		});

		mbSubmenu.addItem(inlineButtonItem => {
			inlineButtonItem.setTitle('Inline Button');
			inlineButtonItem.onClick(() => {
				insetAtCursor(editor, '`BUTTON[example-id]`');
			});
		});

		mbSubmenu.addItem(buttonItem => {
			buttonItem.setTitle('Button');
			buttonItem.onClick(() => {
				new ButtonBuilderModal(
					plugin,
					config => {
						insetAtCursor(editor, `\`\`\`meta-bind-button\n${stringifyYaml(config)}\n\`\`\``);
					},
					'Insert',
				).open();
			});
		});
	});
}

function insetAtCursor(editor: Editor, text: string): void {
	editor.replaceSelection(text);
}
