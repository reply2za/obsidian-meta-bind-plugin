import { InputFieldMDRC } from '../renderChildren/InputFieldMDRC';
import { ViewFieldParser } from '../parsers/viewFieldParser/ViewFieldParser';
import { BindTargetParser } from '../parsers/BindTargetParser';
import { ViewFieldMDRC } from '../renderChildren/ViewFieldMDRC';
import { JsViewFieldMDRC } from '../renderChildren/JsViewFieldMDRC';
import type MetaBindPlugin from '../main';
import { InputFieldDeclarationParser } from '../parsers/inputFieldParser/InputFieldParser';
import { type Component, type MarkdownPostProcessorContext } from 'obsidian';
import { InputFieldAPI } from './InputFieldAPI';
import { type IAPI } from './IAPI';
import { ExcludedMDRC } from '../renderChildren/ExcludedMDRC';
import {
	type InputFieldDeclaration,
	type UnvalidatedInputFieldDeclaration,
} from '../parsers/inputFieldParser/InputFieldDeclaration';
import { Signal } from '../utils/Signal';
import { type BindTargetScope } from '../metadata/BindTargetScope';
import { MetaBindTable } from '../fields/metaBindTable/MetaBindTable';
import { InputFieldFactory } from '../fields/inputFields/InputFieldFactory';
import {
	type JsViewFieldDeclaration,
	type UnvalidatedViewFieldDeclaration,
	type ViewFieldDeclaration,
} from '../parsers/viewFieldParser/ViewFieldDeclaration';
import { ViewFieldFactory } from '../fields/viewFields/ViewFieldFactory';
import { getUUID } from '../utils/Utils';
import { parsePropPath } from '../utils/prop/PropParser';
import { RenderChildType } from '../config/FieldConfigs';
import { type ButtonActionRunner } from '../fields/button/ButtonActionRunner';
import { ButtonManager } from '../fields/button/ButtonManager';
import { type BindTargetDeclaration, BindTargetStorageType } from '../parsers/BindTargetDeclaration';
import { ObsidianButtonActionRunner } from '../fields/button/ObsidianButtonActionRunner';
import { ButtonMDRC } from '../renderChildren/ButtonMDRC';
import { InlineButtonMDRC } from '../renderChildren/InlineButtonMDRC';

export class API implements IAPI {
	public plugin: MetaBindPlugin;
	public readonly inputField: InputFieldAPI;

	public readonly inputFieldParser: InputFieldDeclarationParser;
	public readonly viewFieldParser: ViewFieldParser;
	public readonly bindTargetParser: BindTargetParser;

	public readonly inputFieldFactory: InputFieldFactory;
	public readonly viewFieldFactory: ViewFieldFactory;

	public readonly buttonActionRunner: ButtonActionRunner;
	public readonly buttonManager: ButtonManager;

	constructor(plugin: MetaBindPlugin) {
		this.plugin = plugin;
		this.inputField = new InputFieldAPI(this);

		// this.inputFieldParser = new InputFieldDeclarationParser();
		this.inputFieldParser = new InputFieldDeclarationParser(this.plugin);
		this.viewFieldParser = new ViewFieldParser(this.plugin);
		this.bindTargetParser = new BindTargetParser(this.plugin);

		this.inputFieldFactory = new InputFieldFactory(this.plugin);
		this.viewFieldFactory = new ViewFieldFactory(this.plugin);

		this.buttonActionRunner = new ObsidianButtonActionRunner(this.plugin);
		this.buttonManager = new ButtonManager();
	}

	/**
	 * Creates an input field from an unvalidated declaration.
	 *
	 * @param unvalidatedDeclaration the unvalidated declaration
	 * @param renderType whether to render the input field inline or as a block
	 * @param filePath the file path that the input field is in or an empty string if it is not in a file
	 * @param containerEl the container to mount the input field to
	 * @param component component for lifecycle management
	 * @param scope optional bind target scope
	 */
	public createInputField(
		unvalidatedDeclaration: UnvalidatedInputFieldDeclaration,
		renderType: RenderChildType,
		filePath: string,
		containerEl: HTMLElement,
		component: Component | MarkdownPostProcessorContext,
		scope?: BindTargetScope | undefined,
	): InputFieldMDRC | ExcludedMDRC {
		if (this.plugin.isFilePathExcluded(filePath)) {
			return this.createExcludedField(containerEl, filePath, component);
		}

		const declaration = this.inputFieldParser.validateDeclaration(unvalidatedDeclaration, filePath, scope);

		const inputField = new InputFieldMDRC(containerEl, renderType, declaration, this.plugin, filePath, getUUID());
		component.addChild(inputField);

		return inputField;
	}

	/**
	 * Creates an input field from a string.
	 * This will parse the string and create the input field.
	 *
	 * @param fullDeclaration the string
	 * @param renderType whether to render the input field inline or as a block
	 * @param filePath the file path that the input field is in or an empty string if it is not in a file
	 * @param containerEl the container to mount the input field to
	 * @param component component for lifecycle management
	 * @param scope optional bind target scope
	 */
	public createInputFieldFromString(
		fullDeclaration: string,
		renderType: RenderChildType,
		filePath: string,
		containerEl: HTMLElement,
		component: Component | MarkdownPostProcessorContext,
		scope?: BindTargetScope | undefined,
	): InputFieldMDRC | ExcludedMDRC {
		if (this.plugin.isFilePathExcluded(filePath)) {
			return this.createExcludedField(containerEl, filePath, component);
		}

		const declaration: InputFieldDeclaration = this.inputFieldParser.parseString(fullDeclaration, filePath, scope);

		const inputField = new InputFieldMDRC(containerEl, renderType, declaration, this.plugin, filePath, getUUID());
		component.addChild(inputField);

		return inputField;
	}

	/**
	 * Creates a view field from a string.
	 * This will parse the string and create the view field.
	 *
	 * @param fullDeclaration the string
	 * @param renderType whether to render the view field inline or as a block
	 * @param filePath the file path that the view field is in or an empty string if it is not in a file
	 * @param containerEl the container to mount the view field to
	 * @param component component for lifecycle management
	 * @param scope optional bind target scope
	 */
	public createViewFieldFromString(
		fullDeclaration: string,
		renderType: RenderChildType,
		filePath: string,
		containerEl: HTMLElement,
		component: Component | MarkdownPostProcessorContext,
		scope?: BindTargetScope | undefined,
	): ViewFieldMDRC | ExcludedMDRC {
		if (this.plugin.isFilePathExcluded(filePath)) {
			return this.createExcludedField(containerEl, filePath, component);
		}

		const declaration: ViewFieldDeclaration = this.viewFieldParser.parseString(fullDeclaration, filePath, scope);

		const viewField = new ViewFieldMDRC(containerEl, renderType, declaration, this.plugin, filePath, getUUID());
		component.addChild(viewField);

		return viewField;
	}

	/**
	 * Creates a js view field from a string.
	 * This will parse the string and create the js view field.
	 *
	 * @param fullDeclaration the string containing the header and the code
	 * @param renderType whether to render the js view field inline or as a block
	 * @param filePath the file path that the js view field is in or an empty string if it is not in a file
	 * @param containerEl the container to mount the js view field to
	 * @param component component for lifecycle management
	 */
	public createJsViewFieldFromString(
		fullDeclaration: string,
		renderType: RenderChildType,
		filePath: string,
		containerEl: HTMLElement,
		component: Component | MarkdownPostProcessorContext,
	): JsViewFieldMDRC | ExcludedMDRC {
		if (this.plugin.isFilePathExcluded(filePath)) {
			return this.createExcludedField(containerEl, filePath, component);
		}

		const declaration: JsViewFieldDeclaration = this.viewFieldParser.parseJsString(fullDeclaration, filePath);

		const viewField = new JsViewFieldMDRC(containerEl, renderType, declaration, this.plugin, filePath, getUUID());
		component.addChild(viewField);

		return viewField;
	}

	/**
	 * An excluded field will render a message that the file was excluded in the plugin settings.
	 *
	 * @param containerEl the container to mount the field to
	 * @param filePath the file path that the field should be in or an empty string if it is not in a file
	 * @param component component for lifecycle management
	 */
	public createExcludedField(
		containerEl: HTMLElement,
		filePath: string,
		component: Component | MarkdownPostProcessorContext,
	): ExcludedMDRC {
		const excludedField = new ExcludedMDRC(containerEl, RenderChildType.INLINE, this.plugin, filePath, getUUID());
		component.addChild(excludedField);

		return excludedField;
	}

	public createSignal<T>(value: T): Signal<T> {
		return new Signal<T>(value);
	}

	/**
	 * Registers a signal to a metadata property and returns a callback to unregister.
	 *
	 * @param signal a signal that will be updated with new metadata
	 * @param filePath the file path of the metadata to listen to
	 * @param metadataPath the object path of the metadata to listen to (e.g. ['task', '0', 'completed'])
	 * @param listenToChildren whether to listen to updates of the children of the metadata path, useful when listening to arrays or objects
	 * @param onDelete callback that will be called when the metadata becomes unavailable
	 */
	public listenToMetadata(
		signal: Signal<unknown>,
		filePath: string,
		metadataPath: string[],
		listenToChildren: boolean = false,
		onDelete?: () => void,
	): () => void {
		const uuid = getUUID();

		const subscription = this.plugin.metadataManager.subscribe(
			uuid,
			signal,
			{
				storageType: BindTargetStorageType.FRONTMATTER,
				storagePath: filePath,
				storageProp: parsePropPath(metadataPath),
				listenToChildren: listenToChildren,
			},
			onDelete ?? ((): void => {}),
		);

		return () => {
			subscription.unsubscribe();
		};
	}

	/**
	 * Creates an editable table.
	 *
	 * @param containerEl the container to mount the table to
	 * @param filePath the file path that the table is in or an empty string if it is not in a file
	 * @param component component for lifecycle management
	 * @param bindTarget the bind target of the table, it will be available to all input fields in the columns of the table as local scope
	 * @param tableHead the head of the table
	 * @param columns the columns of the table
	 */
	public createTable(
		containerEl: HTMLElement,
		filePath: string,
		component: Component | MarkdownPostProcessorContext,
		bindTarget: BindTargetDeclaration,
		tableHead: string[],
		columns: (UnvalidatedInputFieldDeclaration | UnvalidatedViewFieldDeclaration)[],
	): MetaBindTable {
		const table = new MetaBindTable(
			containerEl,
			RenderChildType.INLINE,
			this.plugin,
			filePath,
			getUUID(),
			bindTarget,
			tableHead,
			columns,
		);
		component.addChild(table);

		return table;
	}

	public createBindTarget(fullDeclaration: string, currentFilePath: string): BindTargetDeclaration {
		return this.bindTargetParser.parseAndValidateBindTarget(fullDeclaration, currentFilePath);
	}

	public createButtonFromString(
		fullDeclaration: string,
		filePath: string,
		containerEl: HTMLElement,
		component: Component | MarkdownPostProcessorContext,
	): ButtonMDRC | ExcludedMDRC {
		if (this.plugin.isFilePathExcluded(filePath)) {
			return this.createExcludedField(containerEl, filePath, component);
		}

		const button = new ButtonMDRC(containerEl, fullDeclaration, this.plugin, filePath, getUUID());
		component.addChild(button);

		return button;
	}

	public createInlineButtonFromString(
		fullDeclaration: string,
		filePath: string,
		containerEl: HTMLElement,
		component: Component | MarkdownPostProcessorContext,
	): InlineButtonMDRC | ExcludedMDRC {
		if (this.plugin.isFilePathExcluded(filePath)) {
			return this.createExcludedField(containerEl, filePath, component);
		}

		const button = new InlineButtonMDRC(containerEl, fullDeclaration, this.plugin, filePath, getUUID());
		component.addChild(button);

		return button;
	}
}
