import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	let timeout: NodeJS.Timeout | undefined;
	let activated = false;

	const activateExtensionCommand = vscode.commands.registerCommand('gopilot-vscode-ext.activateExtension', () => {
		vscode.window.showInformationMessage('Extension activated!');
		activated = true;
	});

	const deactivateExtensionCommand = vscode.commands.registerCommand('gopilot-vscode-ext.deactivateExtension', () => {
		vscode.window.showInformationMessage('Extension deactivated!');
		activated = false;
	});

	const provider: vscode.InlineCompletionItemProvider = {  
		provideInlineCompletionItems: async (document, position, context, token) => {  
			if (!activated) {
				return;
			}

		  	// Fetching the text before the cursor  
		  	const textBeforeCursor = document.getText();  
	  
			// If there's no text, return no items  
			if (textBeforeCursor.trim() === "") {  
				return { items: [] };  
			}  
		
			return new Promise(resolve => {
				// Set a delay of 1000ms before making a suggestion.
				timeout = setTimeout(async () => {
					// Fetching the code completion based on the text in the user's document  
					let tokens: string[] | undefined;

					try {  
						const editor = vscode.window.activeTextEditor;
						if (!editor) {
							vscode.window.showErrorMessage('No active editor found.');
							return;
						}
				
						const document = editor.document;
						const content = document.getText();
						const cursorOffset = document.offsetAt(editor.selection.start);
				
						const response = await axios.post('http://localhost:3000/complete', {
							content,
							cursorOffset,
						});
		
						tokens = [response.data.tokens];

						// If there's no response, return no items  
						if (tokens === null || tokens === undefined) {  
							resolve({ items: [] });  
						}  

						// Add the generated code to the inline suggestion list  
						const items: any[] = [];  
						for (let i = 0; i < tokens.length; i++) {  
							items.push({  
								insertText: tokens[i],  
								range: new vscode.Range(position.translate(0, tokens[i].length), position),  
								trackingId: `snippet-${i}`,  
							});  
						}

						resolve({ items });  
					} catch (err) {  
						vscode.window.showErrorMessage(`Error: ${err}`);
						resolve({ items: [] });  
					}  
				}, 1000);
			});
		}
	};  

	// Registering the provider for all files  
	vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider);
}

export function deactivate() {}
