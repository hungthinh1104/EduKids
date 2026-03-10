import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No role requirement
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException("User not authenticated");
    }

    const normalizedRequiredRoles = requiredRoles.map((role) =>
      role.toUpperCase(),
    );
    const userRole = String(user.role || "").toUpperCase();

    // For LEARNER role, check both role and childId presence
    if (normalizedRequiredRoles.includes("LEARNER")) {
      // If user has LEARNER role from switch-profile, they should have childId
      if (userRole === "LEARNER" && !user.childId) {
        throw new ForbiddenException(
          "Learner JWT must include childId. Please use switch-profile endpoint first.",
        );
      }
    }

    const hasRole = normalizedRequiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of roles: ${normalizedRequiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
