import { FastifyInstance } from "fastify";
import { z } from "zod";

import { SyncController } from "./controller";

export async function syncRoutes(app: FastifyInstance) {
  const syncController = new SyncController();

  // Get sync queue status
  app.get(
    "/sync/status",
    {
      schema: {
        tags: ["Sync"],
        operationId: "getSyncStatus",
        summary: "Get sync queue status",
        description: "Get the current status of the file sync queue",
        response: {
          200: z.object({
            enabled: z.boolean(),
            status: z
              .object({
                totalTasks: z.number(),
                runningTasks: z.number(),
                pendingTasks: z.number(),
                failedTasks: z.number(),
                completedTasks: z.number(),
              })
              .optional(),
            message: z.string().optional(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    syncController.getStatus.bind(syncController)
  );

  // Get sync history
  app.get(
    "/sync/history",
    {
      schema: {
        tags: ["Sync"],
        operationId: "getSyncHistory",
        summary: "Get sync history",
        description: "Get the sync history with optional limit",
        querystring: z.object({
          limit: z.string().optional(),
        }),
        response: {
          200: z.object({
            enabled: z.boolean(),
            history: z.array(z.any()),
            message: z.string().optional(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    syncController.getHistory.bind(syncController)
  );

  // Retry a failed sync task
  app.post(
    "/sync/retry/:taskId",
    {
      schema: {
        tags: ["Sync"],
        operationId: "retrySyncTask",
        summary: "Retry a failed sync task",
        description: "Manually retry a failed sync task",
        params: z.object({
          taskId: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string(),
            taskId: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
            taskId: z.string(),
          }),
          500: z.object({
            error: z.string(),
          }),
        },
      },
    },
    syncController.retryTask.bind(syncController)
  );
}
