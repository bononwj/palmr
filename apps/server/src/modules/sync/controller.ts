import { FastifyReply, FastifyRequest } from "fastify";

import { FileSyncService } from "../../utils/file-sync.service";

export class SyncController {
  private syncService = FileSyncService.getInstance();

  /**
   * GET /api/sync/status
   * Get current sync queue status
   */
  async getStatus(_request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!this.syncService.isServiceEnabled()) {
        return reply.status(200).send({
          enabled: false,
          message: "File sync is not enabled",
        });
      }

      const status = this.syncService.getQueueStatus();
      return reply.status(200).send({
        enabled: true,
        status,
      });
    } catch (error) {
      console.error("Error getting sync status:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * GET /api/sync/history
   * Get sync history
   */
  async getHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!this.syncService.isServiceEnabled()) {
        return reply.status(200).send({
          enabled: false,
          message: "File sync is not enabled",
          history: [],
        });
      }

      const { limit } = request.query as { limit?: string };
      const limitNum = limit ? parseInt(limit, 10) : 100;

      const history = this.syncService.getHistory(limitNum);
      return reply.status(200).send({
        enabled: true,
        history,
      });
    } catch (error) {
      console.error("Error getting sync history:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  /**
   * POST /api/sync/retry/:taskId
   * Retry a failed sync task
   */
  async retryTask(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!this.syncService.isServiceEnabled()) {
        return reply.status(400).send({
          error: "File sync is not enabled",
        });
      }

      const { taskId } = request.params as { taskId: string };

      const success = await this.syncService.retryTask(taskId);

      if (success) {
        return reply.status(200).send({
          message: "Task retry initiated",
          taskId,
        });
      } else {
        return reply.status(404).send({
          error: "Task not found or not in failed state",
          taskId,
        });
      }
    } catch (error) {
      console.error("Error retrying sync task:", error);
      return reply.status(500).send({ error: "Internal server error" });
    }
  }
}
