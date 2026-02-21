import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Checks if the current authenticated user has a specific permission.
 * If the user's role is SUPER_ADMIN, they have all permissions.
 * Otherwise, it checks against their assigned PermissionProfile.
 */
export async function checkPermission(permission: string): Promise<boolean> {
    const session = await auth();
    if (!session?.user) return false;

    // SUPER_ADMIN always has access
    if ((session.user.role as string) === "SUPER_ADMIN") return true;

    // ADMINs without a specific profile also have full access for now (graceful transition)
    if (!session.user.profileId) {
        return (session.user.role as string) === "ADMIN";
    }

    const profile = await db.permissionProfile.findUnique({
        where: { id: session.user.profileId }
    });

    if (!profile) return false;

    return profile.permissions.includes(permission) || profile.permissions.includes("admin:full");
}

/**
 * Client-side version of permission check (if needed)
 * This is just a placeholder, as full RBAC should be enforced on server.
 */
export function hasPermission(user: any, permission: string): boolean {
    if (user.role === "SUPER_ADMIN") return true;
    if (!user.profileId) return user.role === "ADMIN";

    // In next-auth session, we should include the permissions array to avoid DB hits on every check
    return user.permissions?.includes(permission) || user.permissions?.includes("admin:full");
}
