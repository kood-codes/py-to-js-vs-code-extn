import * as vscode from "vscode";
import * as shiki from "shiki";
const { getJsAst, toJavaScript } = require("antlr-parser-generator/index");

let currentPanel: vscode.WebviewPanel | undefined = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("jsTranslator.start", async () => {
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
      // Create and show a new webview
      if (currentPanel) {
        // If we already have a panel, show it in the target column
        currentPanel.reveal(columnToShowIn);
      } else {
        const editor: any = vscode.window.activeTextEditor;
        const text = editor.document.getText();

        const ast = getJsAst(text);
        const jsCode = toJavaScript(ast);

        currentPanel = vscode.window.createWebviewPanel(
          "jsTranslator", // Identifies the type of the webview. Used internally
          "Js Translator", // Title of the panel displayed to the user
          vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
          {
            enableScripts: true
          } // Webview options. More on these later.
        );
        currentPanel.title = "Preview";
        currentPanel.webview.html = await getWebviewContent(jsCode);

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

async function getWebviewContent(jsCode = "") {
  let highlighter: any = await shiki.getHighlighter({
    theme: "nord"
  });

  let code = highlighter.codeToHtml(jsCode, "js");
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Preview</title>
      <style>
      pre.shiki {
        font-size: 14px;
        background: transparent !important;
        font-family: "Fira Code";
      }
      </style>
  </head>
  <body>
    ${code}
  </body>
  </html>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}
