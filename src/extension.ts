// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kids-server-launch-projects" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('kids-server-dotnet-launcher.launchProjects', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from kids-server-launch-projects!');

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folder is open.');
			return;
		}

		const rootPath = workspaceFolders[0].uri.fsPath;

		// Terminal for Leyser.Kids.Account
		const terminalAccount = vscode.window.createTerminal("Account");
		terminalAccount.show();
		terminalAccount.sendText(`cd "${rootPath}/Leyser.Kids.Account" && dotnet run`);

		// Terminal for Leyser.Kids.Communication
		const terminalCommunication = vscode.window.createTerminal("Communication");
		terminalCommunication.show();
		terminalCommunication.sendText(`cd "${rootPath}/Leyser.Kids.Communication" && dotnet run`);

		// Terminal for Leyser.Kids.Gateway
		const terminalGateway = vscode.window.createTerminal("Gateway");
		terminalGateway.show();
		terminalGateway.sendText(`cd "${rootPath}/Leyser.Kids.Gateway" && dotnet run`);

		// Terminal for Leyser.Kids.Intelligence
		const terminalIntelligence = vscode.window.createTerminal("Intelligence");
		terminalIntelligence.show();
		terminalIntelligence.sendText(`cd "${rootPath}/Leyser.Kids.Intelligence" && dotnet run`);

		// Terminal for Leyser.Kids.Kms
		const terminalKms = vscode.window.createTerminal("Kms");
		terminalKms.show();
		terminalKms.sendText(`cd "${rootPath}/Leyser.Kids.Kms" && dotnet run`);

		// Terminal for Leyser.Kids.Levy
		const terminalLevy = vscode.window.createTerminal("Levy");
		terminalLevy.show();
		terminalLevy.sendText(`cd "${rootPath}/Leyser.Kids.Levy" && dotnet run`);

		// Terminal for Leyser.Kids.Sns
		const terminalSns = vscode.window.createTerminal("Sns");
		terminalSns.show();
		terminalSns.sendText(`cd "${rootPath}/Leyser.Kids.Sns" && dotnet run`);

		// Terminal for Leyser.Kids.Teacher
		const terminalTeacher = vscode.window.createTerminal("Teacher");
		terminalTeacher.show();
		terminalTeacher.sendText(`cd "${rootPath}/Leyser.Kids.Teacher" && dotnet run`);

		// Terminal for Leyser.Kids.Teaching
		const terminalTeaching = vscode.window.createTerminal("Teaching");
		terminalTeaching.show();
		terminalTeaching.sendText(`cd "${rootPath}/Leyser.Kids.Teaching" && dotnet run`);

		// Terminal for Leyser.Kids.Worker
		const terminalWorker= vscode.window.createTerminal("Worker");
		terminalWorker.show();
		terminalWorker.sendText(`cd "${rootPath}/Leyser.Kids.Worker" && dotnet run`);

		// Terminal for Leyser.Kids.Worker
		const terminalBusinessLog= vscode.window.createTerminal("BusinessLog");
		terminalBusinessLog.show();
		terminalBusinessLog.sendText(`cd "${rootPath}/Leyser.Kids.BusinessLog" && dotnet run`);
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
