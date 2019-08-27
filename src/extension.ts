// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as shiki from "shiki";

let currentPanel: vscode.WebviewPanel | undefined = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("catCoding.start", async () => {
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
      // Create and show a new webview
      if (currentPanel) {
        // If we already have a panel, show it in the target column
        currentPanel.reveal(columnToShowIn);
      } else {
        currentPanel = vscode.window.createWebviewPanel(
          "catCoding", // Identifies the type of the webview. Used internally
          "Cat Coding", // Title of the panel displayed to the user
          vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
          {
            enableScripts: true
          } // Webview options. More on these later.
        );
        currentPanel.title = "Preview";
        currentPanel.webview.html = await getWebviewContent();

        currentPanel.webview.onDidReceiveMessage(
          message => {
            switch (message.command) {
              case "alert":
                vscode.window.showErrorMessage(message.text);
                return;
            }
          },
          undefined,
          context.subscriptions
        );

        // Reset when the current panel is closed
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
          },
          null,
          context.subscriptions
        );
      }
    })
  );
}

async function getWebviewContent() {
  let highlighter: any = await shiki.getHighlighter({
    theme: "nord"
  });
  let code = highlighter.codeToHtml(`console.log('shiki');`, "js");
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview</title>
  </head>
  <body>
      <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
        ${code}
  </body>
  </html>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}
