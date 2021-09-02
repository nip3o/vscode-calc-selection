// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as math from "mathjs";

let myStatusBarItem: vscode.StatusBarItem;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    -100
  );
  myStatusBarItem.command = "vscode-calc-selection";
  context.subscriptions.push(myStatusBarItem);

  // register some listener that make sure the status bar
  // item always up-to-date
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBar)
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(updateStatusBar)
  );

  // update status bar item once at start
  updateStatusBar();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-calc-selection.calculateAndAddComment",
      calculateAndAddComment
    )
  );
}

function calculateAndAddComment() {
  const result = evaluateResult();
  const editor = vscode.window.activeTextEditor;
  if (!editor || result === undefined) {
    return;
  }
  if (!editor.selection || !editor.selection.isSingleLine) {
    return;
  }
  const originalText = editor.document.getText(editor.selection);

  editor.edit((textEditorEdit) => {
    textEditorEdit.replace(editor.selection, `${result} # = ${originalText}`);
  });
}

function updateStatusBar() {
  const result = evaluateResult();
  if (result === undefined) {
    myStatusBarItem.hide();
  } else {
    myStatusBarItem.text = `= ${result}`;
    myStatusBarItem.show();
  }
}

function evaluateResult() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  if (
    !editor.selection ||
    !editor.selection.isSingleLine ||
    editor.selection.end.character - editor.selection.start.character > 1000
  ) {
    return;
  }
  const text = editor.document
    .getText(editor.selection)
    .trim()
    .replace(/,/g, ".")
    .replace(/^\/\//g, "")
    .replace(/[#=]/g, "");

  try {
    return math.round(math.evaluate(text), 2);
  } catch (e) {
    return;
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
