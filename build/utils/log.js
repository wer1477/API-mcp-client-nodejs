import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDir = path.join(__dirname, "../../logs");
let index = 0;
export var logType;
(function (logType) {
    logType["GetTools"] = "[GET Tools]";
    logType["GetToolsError"] = "[GET Tools Error]";
    logType["ConnectToServer"] = "[Connect To Server]";
    logType["LLMRequest"] = "[LLM Request]";
    logType["LLMResponse"] = "[LLM Response]";
    logType["LLMError"] = "[LLM Error]";
    logType["LLMStream"] = "[LLM Stream]";
    logType["ToolCall"] = "[Tool Call]";
    logType["ToolCallResponse"] = "[Tool Call Response]";
    logType["ToolCallError"] = "[Tool Call Error]";
})(logType || (logType = {}));
/**
 * 清空日志目录
 */
export function clearLogs() {
    fs.readdir(logsDir, (err, files) => {
        if (err) {
            console.error("清空日志目录失败:", err);
            return;
        }
        files.forEach((file) => {
            const filePath = path.join(logsDir, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`删除文件 ${filePath} 失败:`, err);
                }
                else {
                    console.log(`已删除历史日志文件 ${filePath}`);
                }
            });
        });
    });
}
/**
 * 添加日志
 * @param logData
 */
export function addLogs(logData, logType) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    // 替换文件名中的特殊字符为下划线
    const logFileName = `${index++}_${logType.replace(/[\[\]\s:]/g, '_')}_${year}-${month}-${day}_${hours}_${minutes}_${seconds}`;
    // console.log(logFileName, JSON.stringify(logData, null, 2));
    console.log(logFileName);
    if (logData) {
        const logFilePath = path.join(__dirname, `../../logs/${logFileName}.json`);
        const logFileDir = path.dirname(logFilePath);
        // 确保日志目录存在
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        if (!fs.existsSync(logFileDir)) {
            fs.mkdirSync(logFileDir, { recursive: true });
        }
        fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    }
}
