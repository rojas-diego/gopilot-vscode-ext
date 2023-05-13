import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('gopilot-vscode-ext');
	let activated = false;
	let apiUrl = config.get('apiUrl', '');

    if (!apiUrl) {
        vscode.window.showInformationMessage('Please configure the API URL for GoPilot completion service', 'Configure').then((action) => {
            if (action === 'Configure') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'gopilot-vscode-ext.apiUrl');
            }
        });
    }

	const activateExtensionCommand = vscode.commands.registerCommand('gopilot-vscode-ext.activateExtension', () => {
		vscode.window.showInformationMessage('Extension activated!');
		activated = true;
	});

	const deactivateExtensionCommand = vscode.commands.registerCommand('gopilot-vscode-ext.deactivateExtension', () => {
		vscode.window.showInformationMessage('Extension deactivated!');
		activated = false;
	});

	const updateApiUrlCommand = vscode.commands.registerCommand('gopilot-vscode-ext.updateApiUrl', async () => {
        const newApiUrl = await vscode.window.showInputBox({
            prompt: 'Enter the API URL for GoPilot completion service',
            value: apiUrl || '',
        });

        if (newApiUrl !== undefined) {
            apiUrl = newApiUrl;
            await config.update('apiUrl', apiUrl, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('API URL has been updated.');
        }
    });

	const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('gopilot-vscode-ext.apiUrl')) {
            apiUrl = config.get('apiUrl', '');
        }
    });

	const provider: vscode.InlineCompletionItemProvider = {  
		provideInlineCompletionItems: async (document, position, context, token) => {  
			if (!activated || !apiUrl) {
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
				setTimeout(async () => {
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

						const response = await axios.post(`${apiUrl}/complete`, {
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

	// Registering the commands
	context.subscriptions.push(activateExtensionCommand);
	context.subscriptions.push(deactivateExtensionCommand);
	context.subscriptions.push(updateApiUrlCommand);

	// Registering the event listener
	context.subscriptions.push(onDidChangeConfiguration);

	// Registering the provider for all files
	vscode.languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider);
}

export function deactivate() {}
