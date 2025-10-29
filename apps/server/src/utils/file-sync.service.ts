import { spawn } from "child_process";
import * as path from "path";

import { directoriesConfig } from "../config/directories.config";
import { env } from "../env";

export interface SyncTask {
  id: string;
  objectName: string;
  type: "upload" | "delete";
  status: "pending" | "running" | "completed" | "failed";
  retries: number;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface SyncQueueStatus {
  totalTasks: number;
  runningTasks: number;
  pendingTasks: number;
  failedTasks: number;
  completedTasks: number;
}

export class FileSyncService {
  private static instance: FileSyncService;
  private isEnabled: boolean;
  private remoteHost: string;
  private remoteUser: string;
  private remotePath: string;
  private sshKeyPath?: string;
  private retryTimes: number;
  private retryDelay: number;
  private maxConcurrent: number;

  private queue: SyncTask[] = [];
  private runningTasks = new Set<string>();
  private history: SyncTask[] = [];
  private maxHistorySize = 1000;

  private constructor() {
    this.isEnabled = env.SYNC_ENABLED === "true";
    this.remoteHost = env.SYNC_REMOTE_HOST || "";
    this.remoteUser = env.SYNC_REMOTE_USER || "";
    this.remotePath = env.SYNC_REMOTE_PATH || "";
    this.sshKeyPath = env.SYNC_SSH_KEY_PATH;
    this.retryTimes = env.SYNC_RETRY_TIMES;
    this.retryDelay = env.SYNC_RETRY_DELAY;
    this.maxConcurrent = env.SYNC_MAX_CONCURRENT;

    if (this.isEnabled) {
      this.validateConfig();
      console.log("📡 File sync service initialized");
      console.log(`   Remote: ${this.remoteUser}@${this.remoteHost}:${this.remotePath}`);
      console.log(`   Max concurrent: ${this.maxConcurrent}`);
    }
  }

  public static getInstance(): FileSyncService {
    if (!FileSyncService.instance) {
      FileSyncService.instance = new FileSyncService();
    }
    return FileSyncService.instance;
  }

  private validateConfig(): void {
    if (!this.remoteHost || !this.remoteUser || !this.remotePath) {
      throw new Error(
        "File sync is enabled but configuration is incomplete. " +
          "Please set SYNC_REMOTE_HOST, SYNC_REMOTE_USER, and SYNC_REMOTE_PATH."
      );
    }
  }

  /**
   * Sync a file upload to remote server
   */
  public async syncFile(objectName: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const taskId = this.generateTaskId();
    const task: SyncTask = {
      id: taskId,
      objectName,
      type: "upload",
      status: "pending",
      retries: 0,
    };

    this.queue.push(task);
    console.log(`[SYNC] Queued file upload sync: ${objectName} (${taskId})`);

    // Process queue asynchronously
    this.processQueue().catch((err) => {
      console.error("[SYNC] Queue processing error:", err);
    });
  }

  /**
   * Sync a file deletion to remote server
   */
  public async syncDelete(objectName: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const taskId = this.generateTaskId();
    const task: SyncTask = {
      id: taskId,
      objectName,
      type: "delete",
      status: "pending",
      retries: 0,
    };

    this.queue.push(task);
    console.log(`[SYNC] Queued file deletion sync: ${objectName} (${taskId})`);

    // Process queue asynchronously
    this.processQueue().catch((err) => {
      console.error("[SYNC] Queue processing error:", err);
    });
  }

  private async processQueue(): Promise<void> {
    // Process tasks up to max concurrent limit
    while (this.runningTasks.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      task.status = "running";
      task.startTime = new Date();
      this.runningTasks.add(task.id);

      // Execute task asynchronously
      this.executeTask(task)
        .then(() => {
          task.status = "completed";
          task.endTime = new Date();
          console.log(`[SYNC] ✓ Completed: ${task.objectName} (${task.id})`);
        })
        .catch((error) => {
          console.error(`[SYNC] ✗ Failed: ${task.objectName} (${task.id})`, error.message);
          task.error = error.message;

          // Retry logic
          if (task.retries < this.retryTimes) {
            task.retries++;
            task.status = "pending";
            const delay = this.retryDelay * Math.pow(2, task.retries - 1); // Exponential backoff
            console.log(
              `[SYNC] Retrying ${task.objectName} in ${delay}ms (attempt ${task.retries}/${this.retryTimes})`
            );

            setTimeout(() => {
              this.queue.push(task);
              this.processQueue().catch((err) => {
                console.error("[SYNC] Retry queue processing error:", err);
              });
            }, delay);
          } else {
            task.status = "failed";
            task.endTime = new Date();
            console.error(`[SYNC] ✗ Permanently failed after ${this.retryTimes} retries: ${task.objectName}`);
          }
        })
        .finally(() => {
          this.runningTasks.delete(task.id);
          this.addToHistory(task);
          // Continue processing queue
          this.processQueue().catch((err) => {
            console.error("[SYNC] Continue queue processing error:", err);
          });
        });
    }
  }

  private async executeTask(task: SyncTask): Promise<void> {
    if (task.type === "upload") {
      return this.rsyncUpload(task.objectName);
    } else if (task.type === "delete") {
      return this.rsyncDelete(task.objectName);
    }
    throw new Error(`Unknown task type: ${task.type}`);
  }

  private async rsyncUpload(objectName: string): Promise<void> {
    const localPath = path.join(directoriesConfig.uploads, objectName);
    const remotePath = `${this.remoteUser}@${this.remoteHost}:${path.join(this.remotePath, objectName)}`;

    // Ensure remote directory exists
    const remoteDir = path.dirname(path.join(this.remotePath, objectName));
    await this.ensureRemoteDirectory(remoteDir);

    const args = ["-avz", "--timeout=300"];

    if (this.sshKeyPath) {
      args.push("-e", `ssh -i ${this.sshKeyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=30`);
    } else {
      args.push("-e", "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30");
    }

    args.push(localPath, remotePath);

    return this.executeRsync(args);
  }

  private async rsyncDelete(objectName: string): Promise<void> {
    const remotePath = path.join(this.remotePath, objectName);
    const sshCommand = this.sshKeyPath
      ? `ssh -i ${this.sshKeyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=30`
      : "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30";

    return new Promise((resolve, reject) => {
      const command = `${sshCommand} ${this.remoteUser}@${this.remoteHost} "rm -f ${remotePath}"`;
      const child = spawn("sh", ["-c", command]);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`SSH delete failed (exit ${code}): ${stderr || stdout}`));
        }
      });

      child.on("error", (error) => {
        reject(new Error(`SSH delete error: ${error.message}`));
      });
    });
  }

  private async ensureRemoteDirectory(remoteDir: string): Promise<void> {
    const sshCommand = this.sshKeyPath
      ? `ssh -i ${this.sshKeyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=30`
      : "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30";

    return new Promise((resolve, reject) => {
      const command = `${sshCommand} ${this.remoteUser}@${this.remoteHost} "mkdir -p ${remoteDir}"`;
      const child = spawn("sh", ["-c", command]);

      let stderr = "";

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`SSH mkdir failed (exit ${code}): ${stderr}`));
        }
      });

      child.on("error", (error) => {
        reject(new Error(`SSH mkdir error: ${error.message}`));
      });
    });
  }

  private async executeRsync(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn("rsync", args);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`rsync failed (exit ${code}): ${stderr || stdout}`));
        }
      });

      child.on("error", (error) => {
        reject(new Error(`rsync error: ${error.message}`));
      });
    });
  }

  private generateTaskId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private addToHistory(task: SyncTask): void {
    this.history.unshift(task);
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get current sync queue status
   */
  public getQueueStatus(): SyncQueueStatus {
    const runningTasks = this.runningTasks.size;
    const pendingTasks = this.queue.filter((t) => t.status === "pending").length;
    const completedTasks = this.history.filter((t) => t.status === "completed").length;
    const failedTasks = this.history.filter((t) => t.status === "failed").length;

    return {
      totalTasks: runningTasks + pendingTasks + completedTasks + failedTasks,
      runningTasks,
      pendingTasks,
      failedTasks,
      completedTasks,
    };
  }

  /**
   * Get sync history
   */
  public getHistory(limit: number = 100): SyncTask[] {
    return this.history.slice(0, limit);
  }

  /**
   * Retry a failed task
   */
  public async retryTask(taskId: string): Promise<boolean> {
    const task = this.history.find((t) => t.id === taskId && t.status === "failed");
    if (!task) {
      return false;
    }

    // Create a new task with reset retries
    const newTask: SyncTask = {
      ...task,
      id: this.generateTaskId(),
      status: "pending",
      retries: 0,
      error: undefined,
      startTime: undefined,
      endTime: undefined,
    };

    this.queue.push(newTask);
    console.log(`[SYNC] Manually retrying task: ${newTask.objectName} (${newTask.id})`);

    // Process queue
    this.processQueue().catch((err) => {
      console.error("[SYNC] Retry queue processing error:", err);
    });

    return true;
  }

  /**
   * Check if sync is enabled
   */
  public isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}
