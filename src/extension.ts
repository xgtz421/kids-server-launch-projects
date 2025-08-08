import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceConfig {
    command: string;
    services: Array<{
        name: string;
        port: number;
        path: string;
    }>;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "kids-server-launch-projects" is now active!');

    const findProcess = async (port: number): Promise<string> => {
        try {
            return await new Promise<string>((resolve, reject) => {
                childProcess.exec(`netstat -ano | findstr ":${port}"`, (error, stdout) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout);
                    }
                });
            });
        } catch (error) {
            console.error(`Error checking service: ${error}`);
            return "";
        }
    };

    const killProcess = async (stdout: string): Promise<void> => {
        try {
            const pid = Number(stdout.split(" ").pop());
            if (pid) {
                childProcess.exec(`taskkill /F /PID ${pid}`);
            }
        } catch (error) {
            console.error(`Error killing process: ${error}`);
        }
    };

    const loadConfig = (serviceType: string): ServiceConfig => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder is open.');
        }

        const configPath = path.join(workspaceFolders[0].uri.fsPath, '.vscode', 'kids-launch.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('Configuration file not found. Please create .vscode/kids-launch.json');
        }

        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (!config[serviceType]) {
                throw new Error(`Service type '${serviceType}' not found in configuration.`);
            }
            return config[serviceType];
        } catch (error) {
            throw new Error(`Failed to parse configuration: ${error}`);
        }
    };

    const launchServices = async (serviceType: string) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        
        try {
            const config = loadConfig(serviceType);
            vscode.window.showInformationMessage(`正在启动 ${serviceType} 服务...`);

            for (const service of config.services) {
                const servicePath = path.join(rootPath, service.path);
                const terminalName = `${service.name}`;
                
                // 检查是否已存在同名的终端
                let terminal = vscode.window.terminals.find(t => t.name === terminalName);
                if (!terminal) {
                    terminal = vscode.window.createTerminal(terminalName);
                }
                
                terminal.show();

                // 检查并终止占用端口的进程
                try {
                    const result = await findProcess(service.port);
                    if (result) {
                        await killProcess(result);
                    }
                } catch (error) {
                    console.error(`Error checking port ${service.port}:`, error);
                }

                // 构建并执行命令
                const command = `cd ${JSON.stringify(servicePath)} && ${config.command}`;
                terminal.sendText(command);

                // 等待服务启动
                let isReady = false;
                const checkService = async () => {
                    try {
                        const result = await findProcess(service.port);
                        if (result && result.includes("LISTENING")) {
                            isReady = true;
                        }
                    } catch (error) {
                        console.error(`Error checking service: ${error}`);
                    }
                };

                // 每秒钟检查一次服务是否就绪
                while (!isReady) {
                    await checkService();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                vscode.window.showInformationMessage(`${serviceType} 服务 ${service.name} 已启动 (端口: ${service.port})`);
            }

            vscode.window.showInformationMessage(`${serviceType} 所有服务已启动完成！`);
        } catch (error: any) {
            vscode.window.showErrorMessage(`启动 ${serviceType} 服务时出错: ${error.message}`);
        }
    };

    // 注册命令
    const disposables = [
        vscode.commands.registerCommand('kids-server-dotnet-launcher.launchProjects', () => launchServices('dotnet')),
        vscode.commands.registerCommand('kids-server-node-launcher.launchProjects', () => launchServices('node')),
    ];

    // 注册所有命令
    context.subscriptions.push(...disposables);
}