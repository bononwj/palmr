import { z } from "zod";

// 如果环境变量中没有设置 DATABASE_URL，则使用默认值
const DEFAULT_DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/palmr";

const envSchema = z.object({
  ENABLE_S3: z.union([z.literal("true"), z.literal("false")]).default("false"),
  ENCRYPTION_KEY: z.string().optional(),
  DISABLE_FILESYSTEM_ENCRYPTION: z.union([z.literal("true"), z.literal("false")]).default("true"),
  S3_ENDPOINT: z.string().optional(),
  S3_PORT: z.string().optional(),
  S3_USE_SSL: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.union([z.literal("true"), z.literal("false")]).default("false"),
  S3_REJECT_UNAUTHORIZED: z.union([z.literal("true"), z.literal("false")]).default("true"),
  PRESIGNED_URL_EXPIRATION: z.string().optional().default("3600"),
  SECURE_SITE: z.union([z.literal("true"), z.literal("false")]).default("false"),
  DATABASE_URL: z.string().default(DEFAULT_DATABASE_URL),
  DOWNLOAD_MAX_CONCURRENT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  DOWNLOAD_MEMORY_THRESHOLD_MB: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  DOWNLOAD_QUEUE_SIZE: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  DOWNLOAD_AUTO_SCALE: z.union([z.literal("true"), z.literal("false")]).default("true"),
  DOWNLOAD_MIN_FILE_SIZE_GB: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  CUSTOM_PATH: z.string().optional(),
  // File sync configuration
  SYNC_ENABLED: z.union([z.literal("true"), z.literal("false")]).default("false"),
  SYNC_REMOTE_HOST: z.string().optional(),
  SYNC_REMOTE_USER: z.string().optional(),
  SYNC_REMOTE_PATH: z.string().optional(),
  SYNC_SSH_KEY_PATH: z.string().optional(),
  SYNC_RETRY_TIMES: z
    .string()
    .optional()
    .default("3")
    .transform((val) => parseInt(val, 10)),
  SYNC_RETRY_DELAY: z
    .string()
    .optional()
    .default("5000")
    .transform((val) => parseInt(val, 10)),
  SYNC_MAX_CONCURRENT: z
    .string()
    .optional()
    .default("3")
    .transform((val) => parseInt(val, 10)),
});

export const env = envSchema.parse(process.env);
