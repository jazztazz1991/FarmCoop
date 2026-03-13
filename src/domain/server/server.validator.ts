import { z } from "zod";

export const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  transportType: z.enum(["local", "ftp"]),
  transportConfig: z.record(z.string(), z.unknown()),
});
