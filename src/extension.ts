'use strict';
import * as vscode from 'vscode';
import { registerRangeType } from './range-type';
import { registerCompletion } from './completion';
import { ExtensionState } from './extension-state';
import { registerDiagnostics } from './diagnostics';
import { registerDefinition } from './definition';
import { registerReference } from './reference';
import { registerInlineRepl } from './inline-repl';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('GHC');

    const ext: ExtensionState = {
        context,
        outputChannel,
        documentManagers: new Map(),
        workspaceManagers: new Map(),
        workspaceTypeMap: new Map(),
        documentAssignment: new WeakMap()
    };

    registerRangeType(ext);
    registerCompletion(ext);
    registerDefinition(ext);
    registerReference(ext);
    registerInlineRepl(ext);

    const diagInit = registerDiagnostics(ext);

    function restart() {
        for (const [doc, session] of ext.documentManagers) {
            session.dispose();
        }

        ext.documentManagers.clear();

        for (const [ws, session] of ext.workspaceManagers) {
            session.dispose();
        }

        ext.workspaceManagers.clear();

        ext.documentAssignment = new WeakMap();

        diagInit();
    }

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(restart),
        vscode.commands.registerCommand('vscode-ghc-simple.restart', restart));

    vscode.workspace.onDidChangeWorkspaceFolders((changeEvent) => {
        for (const folder of changeEvent.removed)
            if (ext.workspaceManagers.has(folder))
                ext.workspaceManagers.get(folder).dispose();
    })
}

export function deactivate() {
}
