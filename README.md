# kids-server-launch-projects

一个用于在 VS Code 中快速启动多个 Leyser.Kids.dotnet 服务（如 Leyser.Kids.Kms 和 Leyser.Kids.Sns）的插件。

## Features

- 一键启动多个项目
- 每个服务使用独立终端面板执行 dotnet run
- 无需手动操作终端或点击文件夹

## Requirements

- 安装 .NET SDK
- 使用 VS Code 工作区打开包含两个项目的根目录

## Usage

按 `Ctrl+Shift+P` 输入 `Kids Launch .NET Services` 启动.net服务
按 `Ctrl+Shift+P` 输入 `Kids Launch Node Services` 启动node服务

## Configuration

在 `.vscode/kids-launch.json` 中添加以下配置来设置各个服务的启动参数：

```json
{
  "dotnet": {
    "command": "dotnet run",
    "services": [
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
  "node": {
    "command": "gulp",
    "services": [
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
}
```

## Release Notes

### 0.1.1

- 添加node和.net服务启动支持
- 支持自定义配置可启动的服务
