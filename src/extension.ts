import * as vscode from "vscode";
import * as shiki from "shiki";
import traverse from "@babel/traverse";
import { parse } from "@babel/parser";
import { format } from "prettier";
import { getJsAst, toJavaScript } from "py-to-js";

const jsVisitor = {
  FunctionDeclaration({ node }: any) {
    let name = node.id.name;
    console.log(node.id.name);
    if (name.indexOf("_") > -1) {
      node.id.name = name
        .split("_")
        .map((part: string, i: number) => {
          if (i > 0) {
            part = part[0].toUpperCase() + part.substr(1);
          }
          return part;
        })
        .join("");
    }
  },
  CallExpression({ node }: any) {
    if (node.callee.name === "print") {
      node.callee.name = "console.log";
    }
  },
};

let currentPanel: vscode.WebviewPanel | undefined = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("py2jsTranslator.start", async () => {
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
        let jsCode;
        try {
          jsCode = format(toJavaScript(ast), {
            parser: "babel",
            singleQuote: true,
          });
          let jsAst = parse(jsCode, {
            presets: ["es2015"],
            allowImportExportEverywhere: true,
            classProperties: true,
          } as any);
          traverse(jsAst, jsVisitor);
          jsCode = format(toJavaScript(jsAst), {
            parser: "babel",
            singleQuote: true,
          });
        } catch (err) {
          jsCode = toJavaScript(ast);
        }
        console.log(jsCode);

        currentPanel = vscode.window.createWebviewPanel(
          "py2jsTranslator", // Identifies the type of the webview. Used internally
          "Py 2 Js Translator", // Title of the panel displayed to the user
          vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
          {
            enableScripts: true,
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
    theme: "nord",
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
