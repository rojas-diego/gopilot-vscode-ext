import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
	let coloredTextDecoration: vscode.TextEditorDecorationType | undefined;
	let tokens: string | undefined;

    const removeSuggestion = (editor: vscode.TextEditor) => {
        if (coloredTextDecoration) {
            editor.setDecorations(coloredTextDecoration, []);
            coloredTextDecoration.dispose();
            coloredTextDecoration = undefined;
        }
    };

	let autoCompleteCommand = vscode.commands.registerCommand('gopilot-vscode-ext.autoComplete', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const document = editor.document;
        const content = document.getText();
        const cursorOffset = document.offsetAt(editor.selection.start);

        try {
			const response = await axios.post('http://localhost:3000/complete', {
				content,
				cursorOffset,
			});
			
			tokens = response.data.tokens;

			vscode.window.showInformationMessage(`Tokens: ${tokens}`);
			
			// Define a decoration with colored text and custom content
			coloredTextDecoration = vscode.window.createTextEditorDecorationType({
				color: 'rgba(200, 100, 100, 1)',
				rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
				after: {
					contentText: tokens,
					color: 'rgba(0, 0, 0, 0.5)',
					fontStyle: 'italic',
				},
			});

			// Apply the decoration at the cursor position
			const cursorPosition = editor.selection.start;
			const startPosition = cursorPosition.translate(0, 0);
			const endPosition = cursorPosition.translate(0, 0); // Arbitrary length for the decoration
			const decorationRange = new vscode.Range(startPosition, endPosition);
			editor.setDecorations(coloredTextDecoration, [{ range: decorationRange }]);

			context.subscriptions.push(onDidChangeTextEditorSelection);
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    });

	const onDidChangeTextEditorSelection = vscode.window.onDidChangeTextEditorSelection(async (e) => {
        const editor = e.textEditor;

        if (coloredTextDecoration) {
            removeSuggestion(editor);
        }
    });

    context.subscriptions.push(autoCompleteCommand);
    context.subscriptions.push(onDidChangeTextEditorSelection);
}

export function deactivate() {}
