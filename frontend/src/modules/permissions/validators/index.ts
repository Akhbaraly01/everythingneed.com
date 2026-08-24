import { z } from "zod";

export const CreatePermissionSchema = z.object({
  name: z.string().min(2).max(50),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  group: z.string().min(1).max(50),
});

export const UpdatePermissionSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  group: z.string().min(1).max(50).optional(),
});

export const GrantPermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  grantedBy: z.string().uuid().optional(),
});

export const RevokePermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>;
export type GrantPermissionInput = z.infer<typeof GrantPermissionSchema>;
export type RevokePermissionInput = z.infer<typeof RevokePermissionSchema>;
