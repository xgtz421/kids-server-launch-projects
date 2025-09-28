import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceConfig {
    command: string;
    env?: Record<string, string>;
    services: Array<{
        name: string;
        port: number;
        path: string;
    }>;
}

// 默认配置
const defaultConfig: Record<string, ServiceConfig> = {
    dotnet: {
        command: "dotnet run",
        services: [
            { "name": "Account", "port": 30000, "path": "Leyser.Kids.Account" },
            { "name": "Communication", "port": 62000, "path": "Leyser.Kids.Communication" },
            { "name": "Gateway", "port": 4000, "path": "Leyser.Kids.Gateway" },
            { "name": "Intelligence", "port": 58070, "path": "Leyser.Kids.Intelligence" },
            { "name": "Kms", "port": 58050, "path": "Leyser.Kids.Kms" },
            { "name": "Levy", "port": 58040, "path": "Leyser.Kids.Levy" },
            { "name": "Sns", "port": 58120, "path": "Leyser.Kids.Sns" },
            { "name": "Teacher", "port": 60001, "path": "Leyser.Kids.Teacher" },
            { "name": "Teaching", "port": 60000, "path": "Leyser.Kids.Teaching" },
            { "name": "Worker", "port": 58030, "path": "Leyser.Kids.Worker" },
            { "name": "BusinessLog", "port": 61000, "path": "Leyser.Kids.BusinessLog" }
        ]
    },
    node: {
        command: "gulp",
        env: {
            "HOST": "localhost",
            "APIURLS_ACCOUNT_URL": "http://${HOST:-localhost}:3000",
            "APIURLS_GATEWAY_URL": "http://${HOST:-localhost}:4000",
            "APIURLS_KTS_URL": "http://${HOST:-localhost}:5000",
            "APIURLS_KPS_URL": "http://${HOST:-localhost}:6001",
            "APIURLS_KMS_URL": "http://${HOST:-localhost}:7000"
        },
        services: [
            { "name": "cloud", "port": 5000, "path": "develop/server/sites/cloud/" },
            { "name": "account", "port": 3000, "path": "develop/server/sites/account/" },
            { "name": "manage", "port": 7000, "path": "develop/server/sites/manage/" },
            { "name": "public", "port": 6001, "path": "develop/server/sites/public/" },
            { "name": "teaching", "port": 58000, "path": "develop/server/services/teaching/" },
            { "name": "communication", "port": 58010, "path": "develop/server/services/communication/" },
            { "name": "levy", "port": 9003, "path": "develop/server/services/levy/" },
            { "name": "sns", "port": 58020, "path": "develop/server/services/sns/" },
            { "name": "worker", "port": 59200, "path": "develop/server/services/worker/" }
        ]
    }
};

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "kids-server-launch-projects" is now active!');

    const findProcess = async (port: number): Promise<string> => {
        try {
            return await new Promise<string>((resolve, reject) => {
                // 使用 netstat 获取所有连接，然后在 JavaScript 中精确匹配端口
                childProcess.exec('netstat -ano', (error, stdout) => {
                    if (error) {
                        if (error.message.includes('returned non-zero exit status 1')) {
                            resolve('');
                        } else {
                            reject(error);
                        }
                    } else {
                        // 按行分割结果
                        const lines = stdout.split('\n');
                        // 过滤出包含精确端口号的行
                        const matchedLines = lines.filter(line => {
                            // 匹配格式如 "TCP    0.0.0.0:3000          0.0.0.0:0" 或 "  TCP    0.0.0.0:3000          :::0"
                            return line.match(new RegExp(`:${port}(\\s|$)`));
                        });
                        // 返回匹配的行，如果没有匹配则返回空字符串
                        resolve(matchedLines.join('\n'));
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
        
        // 如果配置文件不存在，返回默认配置
        if (!fs.existsSync(configPath)) {
            if (!defaultConfig[serviceType]) {
                throw new Error(`Service type '${serviceType}' not found in default configuration.`);
            }
            return defaultConfig[serviceType];
        }

        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (!config[serviceType]) {
                // 如果配置文件中没有找到对应的服务类型，尝试返回默认配置
                if (defaultConfig[serviceType]) {
                    return defaultConfig[serviceType];
                }
                throw new Error(`Service type '${serviceType}' not found in configuration.`);
            }
            return config[serviceType];
        } catch (error) {
            console.error('Failed to load configuration, using default config:', error);
            if (defaultConfig[serviceType]) {
                return defaultConfig[serviceType];
            }
            throw new Error(`Failed to load configuration and no default config for '${serviceType}': ${error}`);
        }
    };

    // 检测终端类型并构建相应的命令
    const buildCommand = (servicePath: string, command: string, terminal: vscode.Terminal): string => {
        // 检测终端类型
        const terminalName = terminal.name.toLowerCase();
        const isGitBash = terminalName.includes('bash') || terminalName.includes('git');
        const isPowerShell = terminalName.includes('powershell') || terminalName.includes('pwsh');
        const isCmd = terminalName.includes('cmd') || terminalName.includes('command');
        
        if (isGitBash) {
            // Git Bash: 使用正斜杠和双引号
            const escapedPath = servicePath.replace(/\\/g, '/').replace(/"/g, '\\"');
            return `cd "${escapedPath}" && ${command}`;
        } else if (isPowerShell) {
            // PowerShell: 使用反斜杠和单引号
            const escapedPath = servicePath.replace(/'/g, "''");
            return `cd '${escapedPath}'; ${command}`;
        } else if (isCmd) {
            // CMD: 使用反斜杠和双引号
            const escapedPath = servicePath.replace(/"/g, '\\"');
            return `cd "${escapedPath}" && ${command}`;
        } else {
            // 默认情况：尝试通用格式
            const escapedPath = servicePath.replace(/\\/g, '/').replace(/"/g, '\\"');
            return `cd "${escapedPath}" && ${command}`;
        }
    };

    // 构建备用命令（用于重试）
    const buildFallbackCommand = (servicePath: string, command: string, terminal: vscode.Terminal): string => {
        const terminalName = terminal.name.toLowerCase();
        const isGitBash = terminalName.includes('bash') || terminalName.includes('git');
        
        if (isGitBash) {
            // Git Bash 备用方案：使用不同的路径格式
            const escapedPath = servicePath.replace(/\\/g, '/');
            // 尝试不使用引号，或者使用单引号
            return `cd ${escapedPath} && ${command}`;
        } else {
            // 其他终端使用原始命令
            return buildCommand(servicePath, command, terminal);
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

                await new Promise((resolve) => setTimeout(resolve, 200));

                // 检查并终止占用端口的进程
                try {
                    const result = await findProcess(service.port);
                    if (result) {
                        await killProcess(result);
                    }
                } catch (error) {
                    console.error(`Error checking port ${service.port}:`, error);
                }

                // 设置环境变量
                if (config.env) {
                    const terminalName = terminal.name.toLowerCase();
                    const isGitBash = terminalName.includes('bash') || terminalName.includes('git');
                    const isPowerShell = terminalName.includes('powershell') || terminalName.includes('pwsh');
                    
                    for (const [key, value] of Object.entries(config.env)) {
                        if (isGitBash) {
                            // Git Bash: 使用 export 命令
                            terminal.sendText(`export ${key}="${value}"`);
                        } else if (isPowerShell) {
                            // PowerShell: 使用 $env: 语法
                            terminal.sendText(`$env:${key}="${value}"`);
                        } else {
                            // CMD: 使用 set 命令
                            terminal.sendText(`set ${key}=${value}`);
                        }
                    }
                }

                // 构建并执行命令
                const command = buildCommand(servicePath, config.command, terminal);
                
                // 执行命令并添加重试机制
                const executeCommandWithRetry = async () => {
                    let retryCount = 0;
                    const maxRetries = 2;
                    
                    const tryExecute = async () => {
                        if (retryCount === 0) {
                            // 第一次尝试：使用标准命令
                            terminal.sendText(command);
                        } else {
                            // 重试：使用备用命令格式
                            const fallbackCommand = buildFallbackCommand(servicePath, config.command, terminal);
                            terminal.sendText(fallbackCommand);
                        }
                        
                        // 等待命令执行
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        // 检查服务是否成功启动
                        try {
                            const result = await findProcess(service.port);
                            if (result && result.includes("LISTENING")) {
                                return true; // 成功启动
                            }
                        } catch (error) {
                            console.error(`Error checking service: ${error}`);
                        }
                        
                        return false; // 未成功启动
                    };
                    
                    // 尝试执行命令
                    let success = await tryExecute();
                    
                    // 如果失败且还有重试次数，则重试
                    while (!success && retryCount < maxRetries) {
                        retryCount++;
                        vscode.window.showWarningMessage(`服务 ${service.name} 启动可能失败，正在重试 (${retryCount}/${maxRetries})...`);
                        
                        // 等待一段时间后重试
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        success = await tryExecute();
                    }
                    
                    if (!success) {
                        vscode.window.showErrorMessage(`服务 ${service.name} 启动失败，请手动检查终端输出`);
                    }
                };
                
                await executeCommandWithRetry();

                // 如果服务成功启动，显示成功消息
                try {
                    const result = await findProcess(service.port);
                    if (result && result.includes("LISTENING")) {
                        vscode.window.showInformationMessage(`${serviceType} 服务 ${service.name} 已启动 (端口: ${service.port})`);
                    }
                } catch (error) {
                    console.error(`Error checking final service status: ${error}`);
                }
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