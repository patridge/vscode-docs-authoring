"use-strict";

import os = require("os");
import * as vscode from "vscode";
import * as log from "./log";

/**
 * Provide current os platform
 */
export function getOSPlatform(this: any) {
    if (this.osPlatform == null) {
        this.osPlatform = os.platform();
        this.osPlatform = this.osPlatform;
    }
    return this.osPlatform;
}

/**
 * Create a posted warning message and applies the message to the log
 * @param {string} message - the message to post to the editor as an warning.
 */
export function postWarning(message: string) {
    log.debug(message);
    vscode.window.showWarningMessage(message);
}

/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
export function postInformation(message: string) {
    log.debug(message);
    vscode.window.showInformationMessage(message);
}

/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
export function postError(message: string) {
    log.debug(message);
    vscode.window.showErrorMessage(message);
}

/**
 * Checks that there is a document open, and the document has selected text.
 * Displays warning to users if error is caught.
 * @param {vscode.TextEditor} editor - the activeTextEditor in the vscode window
 * @param {boolean} testSelection - test to see if the selection includes text in addition to testing a editor is open.
 * @param {string} senderName - the name of the command running the test.
 */
export function isValidEditor(editor: vscode.TextEditor, testSelection: boolean, senderName: string) {
    if (editor === undefined) {
        log.error("Please open a document to apply " + senderName + " to.");
        return false;
    }

    if (testSelection && editor.selection.isEmpty) {
        if (senderName === "format bold" || senderName === "format italic" || senderName === "format code") {
            log.debug("VS Code active editor has valid configuration to apply " + senderName + " to.");
            return true;
        }
        log.error("No text selected, cannot apply " + senderName + ".");
        return false;
    }

    log.debug("VS Code active editor has valid configuration to apply " + senderName + " to.");
    return true;
}

export function GetEditorText(editor: vscode.TextEditor, senderName: string): string {
    let content = "";
    const emptyString = "";
    if (isValidEditor(editor, false, senderName)) {
        if (content !== undefined && content.trim() !== "") {
            content = editor.document.getText();
            return content;
        } else {
            return emptyString;
        }
    }
    return emptyString;
}

export function GetEditorFileName(editor: vscode.TextEditor, senderName: string): string {
    const emptyString = "";
    if (editor !== undefined && editor.document !== undefined) {
        const fileName = editor.document.fileName;
        return fileName;
    } else {
        return emptyString;
    }
}

/** Tests to see if there is content on the page.
 * @param {vscode.TextEditor} editor - the current active editor
 */
export function hasContentAlready(editor: any) {
    let content = editor.document.getText();
    content = content.trim();

    if (content !== "") {
        return false;
    }

    return true;
}

export function hasValidWorkSpaceRootPath(senderName: string) {
    const folderPath = vscode.workspace.rootPath;

    if (folderPath == null) {
        postWarning("The " + senderName + " command requires an active workspace. Please open VS Code from the root of your clone to continue.");
        return false;
    }

    return true;
}

/**
 * Inserts or Replaces text at the current selection in the editor.
 * If overwrite is set the content will replace current selection.
 * @param {vscode.TextEditor} editor - the active editor in vs code.
 * @param {string} senderName - the name of the function that is calling this function
 * which is used to provide tracibility in logging.
 * @param {string} string - the content to insert.
 * @param {boolean} overwrite - if true replaces current selection.
 * @param {vscode.Range} selection - if null uses the current selection for the insert or update.
 * If provided will insert or update at the given range.
 */

export function insertContentToEditor(editor: vscode.TextEditor, senderName: string, content: string, overwrite: boolean = false, selection: vscode.Range = null!) {
    log.debug("Adding content to the active editor: " + content);

    if (selection == null) {
        selection = editor.selection;
    }

    try {
        if (overwrite) {
            editor.edit((update) => {
                update.replace(selection, content);
            });
            log.debug(senderName + " applied content overwritten current selection: " + content);
        } else {
            // Gets the cursor position
            const position = editor.selection.active;

            editor.edit((selected) => {
                selected.insert(position, content);
            });
            log.debug(senderName + " applied at current cursor: " + content);
        }
    } catch (error) {
        log.error("Could not write content to active editor window: " + error);
    }
}

/**
 * Remove the selected content from the active editor in the vs code window.
 * @param {vscode.TextEditor} editor - the active editor in vs code.
 * @param {string} senderName - the name of the the function that called the removal
 * @param {string} content - the content that is being removed.
 */
export function removeContentFromEditor(editor: vscode.TextEditor, senderName: string, content: string) {
    try {
        editor.edit((update) => {
            update.delete(editor.selection);
        });
        log.debug(senderName + " removed the content: " + content);
    } catch (error) {
        log.error("Could not remove content from active editor window:" + error);
    }
}

/**
 * Set the cursor to a new position, based on X and Y coordinates.
 * @param {vscode.TextEditor} editor -
 * @param {number} yPosition -
 * @param {number} xPosition -
 */
export function setCursorPosition(editor: vscode.TextEditor, yPosition: number, xPosition: number) {
    const cursorPosition = editor.selection.active;
    const newPosition = cursorPosition.with(yPosition, xPosition);
    const newSelection = new vscode.Selection(newPosition, newPosition);
    editor.selection = newSelection;
}

export function setSelectorPosition(editor: vscode.TextEditor, fromLine: number, fromCharacter: number, toLine: number, toCharacter: number) {
    const cursorPosition = editor.selection.active;
    const fromPosition = cursorPosition.with(fromLine, fromCharacter);
    const toPosition = cursorPosition.with(toLine, toCharacter);
    const newSelection = new vscode.Selection(fromPosition, toPosition);
    editor.selection = newSelection;
}

export function setNewPosition(editor: vscode.TextEditor, offset: number, startLine: number, endLine: number) {
    const selection = editor.selection;
    let newCursorPosition = selection.active.character + offset;
    newCursorPosition = newCursorPosition < 0 ? 0 : newCursorPosition;

    if (selection.start.character === selection.end.character && selection.start.line === selection.end.line) {
        setCursorPosition(editor, selection.active.line, newCursorPosition);
    } else {
        let newStartCharacter = 0;
        let newEndCharacter = 0;
        if (selection.active.character === selection.start.character) {
            newStartCharacter = selection.end.character + offset;
            newEndCharacter = selection.start.character + offset;
        } else {
            newStartCharacter = selection.start.character + offset;
            newEndCharacter = selection.end.character + offset;
        }

        newStartCharacter = newStartCharacter < 0 ? 0 : newStartCharacter;
        newEndCharacter = newEndCharacter < 0 ? 0 : newEndCharacter;

        let newStartLine = 0;
        let newEndLine = 0;
        if (selection.start.line === selection.end.line || startLine === endLine) {
            newStartLine = newEndLine = selection.active.line;
        } else if (selection.active.line === startLine) {
            newStartLine = endLine;
            newEndLine = startLine;
        } else {
            newStartLine = startLine;
            newEndLine = endLine;
        }
        setSelectorPosition(editor, newStartLine, newStartCharacter, newEndLine, newEndCharacter);
    }
}

/**
 *  Function does trim from the right on the the string. It removes specified characters.
 *  @param {string} str - string to trim.
 *  @param {string} chr - searched characters to trim.
 */
export function rtrim(str: string, chr: string) {
    const rgxtrim = (!chr) ? new RegExp("\\s+$") : new RegExp(chr + "+$");
    return str.replace(rgxtrim, "");
}

/**
 * Checks to see if the active file is markdown.
 * Commands should only run on markdown files.
 * @param {vscode.TextEditor} editor - the active editor in vs code.
 */
export function isMarkdownFileCheck(editor: vscode.TextEditor, languageId: boolean) {
    if (editor.document.languageId !== "markdown") {
        postInformation("The docs-markdown extension only works on Markdown files.");
        return false;
    } else {
        return true;
    }
}

/**
 * Telemetry or Trace Log Type
 */
export enum LogType {
    Telemetry, Trace,
}
