import * as vscode from "vscode";
import * as math from "mathjs";

let statusBarItem: vscode.StatusBarItem;

function calculateAndReplace() {
  const result = evaluateResult();
  const editor = vscode.window.activeTextEditor;
  if (!editor || result === undefined) {
    return;
  }
  if (!editor.selection || !editor.selection.isSingleLine) {
    return;
  }
  const originalText = editor.document.getText(editor.selection);
  const commentChars = getCommentChars(editor.document.languageId);

  editor.edit((textEditorEdit) => {
    textEditorEdit.replace(
      editor.selection,
      `${result} ${commentChars} = ${originalText}`
    );
  });
}

function calculateAndCopy() {
  const result = evaluateResult();
  if (result === undefined) {
    return;
  }
  vscode.env.clipboard.writeText(result.toString());
}

function updateStatusBar() {
  const result = evaluateResult();
  if (result === undefined) {
    statusBarItem.hide();
  } else {
    statusBarItem.text = `= ${result}`;
    statusBarItem.show();
  }
}

function getCommentChars(languageId: string) {
  // Ideally this info should be retrieved from the vscode language config, but there is no API.
  // https://github.com/microsoft/vscode/issues/109919
  if (languageId === "python") {
    return "#";
  }
  return "//";
}

function evaluateResult(): number | undefined {
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

  // Trim away any garbage and allow using comma as decimal separator.
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

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    -100
  );
  statusBarItem.command = "vscode-calc-selection.calculateAndCopy";
  context.subscriptions.push(statusBarItem);

  // Subscribe to update status bar item when changing active editor or selection.
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBar)
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(updateStatusBar)
  );

  // Update status bar item once at start.
  updateStatusBar();

  // Add custom commands. Remember that these must be specified in package.json as well.
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-calc-selection.calculateAndReplace",
      calculateAndReplace
    ),
    vscode.commands.registerCommand(
      "vscode-calc-selection.calculateAndCopy",
      calculateAndCopy
    )
  );
}
export function deactivate() {}
