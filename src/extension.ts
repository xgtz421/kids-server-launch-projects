import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as child_process from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "kids-server-launch-projects" is now active!');

	const findProcess = async (port: number) => {
		try {
			const result = await new Promise<string>((resolve, reject) => {
				child_process.exec(`netstat -ano | findstr ":${port}"`, (error, stdout) => {
					if (error) {
						reject(error);
					} else {
						resolve(stdout);
					}
				});
			});
			return result;
		} catch (error) {
			console.error(`Error checking service: ${error}`);
			return "";
		}
	};

	const kidProcess = async (stdout: string) => {
		try {
			const pid = Number(stdout.split(" ").pop());
			if (pid) {
				child_process.exec(`taskkill /F /PID ${pid}`);
			}
		} catch{}
	};
	

    const disposable = vscode.commands.registerCommand('kids-server-dotnet-launcher.launchProjects', async () => {
        vscode.window.showInformationMessage('正在按顺序启动服务...');

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;

        const executeDotnetRun = async (terminalName: string, port: number) => {
            const path = `${rootPath}/Leyser.Kids.${terminalName}`;
            
            // 检查是否已存在同名的终端
            let terminal = vscode.window.terminals.find(t => t.name === terminalName);
            
            // 如果不存在则创建新终端
            if (!terminal) {
                terminal = vscode.window.createTerminal(terminalName);
            }
            
            // 显示终端
            terminal.show();

			try {
				const result = await findProcess(port);
				if (result) {
					await kidProcess(result);
				}
			} catch{}

            // Start the service
            // 使用 JSON.stringify 来正确转义路径中的反斜杠
            const command = `cd ${JSON.stringify(path)} && dotnet run`;
            terminal.sendText(command);

            // Wait for the service to start
            let isReady = false;

            const checkService = async () => {
                try {
					const result = await findProcess(port);
					if (result && result.includes("LISTENING")) {
						isReady = true;
					}
                } catch (error) {
                    console.error(`Error checking service: ${error}`);
                }
            };

            // Check every second until service is ready
            while (!isReady) {
                await checkService();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        };

        try {
            // Start services in sequence
            await executeDotnetRun("Account", 30000);
            await executeDotnetRun("Communication", 62000);
            await executeDotnetRun("Gateway", 4000);
            await executeDotnetRun("Intelligence", 58070);
            await executeDotnetRun("Kms", 58050);
            await executeDotnetRun("Levy", 58040);
            await executeDotnetRun("Sns", 58120);
            await executeDotnetRun("Teacher", 60001);
            await executeDotnetRun("Teaching", 60000);
            await executeDotnetRun("Worker", 58030);
            await executeDotnetRun("BusinessLog", 61000);
            vscode.window.showInformationMessage('所有服务已按顺序启动完成！');
        } catch (error) {
            vscode.window.showErrorMessage(`启动过程中发生错误: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}