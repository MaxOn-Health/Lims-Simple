import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector, ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import { AuditService } from '../../modules/audit/audit.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuditLoggingInterceptor implements NestInterceptor {
  private auditService: AuditService;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Lazy load AuditService to avoid circular dependencies
    if (!this.auditService) {
      try {
        this.auditService = this.moduleRef.get(AuditService, { strict: false });
      } catch (error) {
        // If AuditService is not available, skip logging
        return next.handle();
      }
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { method, route, params, body } = request;
    const user = request.user;

    // Skip if not POST, PUT, or DELETE
    if (!['POST', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    // Extract entity type from route path
    const entityType = this.extractEntityType(route?.path || request.url);
    
    // Extract entity ID from params
    const entityId = params?.id || params?.entityId || null;

    // Determine action type
    const action = this.getActionType(method);

    // Extract IP address and user agent
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.headers['user-agent'] || null;

    // Get user ID
    const userId = user?.userId || null;

    // For PUT requests, we'll log after the request completes to get the updated entity
    // For POST and DELETE, we can log immediately
    if (method === 'POST' || method === 'DELETE') {
      // Log immediately for POST and DELETE
      this.logAuditEntry(
        userId,
        action,
        entityType,
        entityId,
        method === 'POST' ? { after: body } : { before: { id: entityId } },
        ipAddress,
        userAgent,
      ).catch((error) => {
        // Don't break request flow if logging fails
        console.error('Failed to log audit entry:', error);
      });
    }

    // For PUT requests, intercept the response to get updated entity
    if (method === 'PUT') {
      return next.handle().pipe(
        tap(async (response) => {
          // Log after successful update
          try {
            const changes = {
              after: response || body,
            };
            
            this.logAuditEntry(
              userId,
              action,
              entityType,
              entityId,
              changes,
              ipAddress,
              userAgent,
            ).catch((error) => {
              console.error('Failed to log audit entry:', error);
            });
          } catch (error) {
            console.error('Failed to log audit entry:', error);
          }
        }),
      );
    }

    return next.handle();
  }

  private extractEntityType(path: string): string {
    // Extract entity type from route path
    // Examples: /users/123 -> USER, /packages/456 -> PACKAGE
    const segments = path.split('/').filter(Boolean);
    
    // Map common route patterns to entity types
    const entityTypeMap: Record<string, string> = {
      users: 'USER',
      patients: 'PATIENT',
      packages: 'PACKAGE',
      tests: 'TEST',
      assignments: 'ASSIGNMENT',
      results: 'RESULT',
      'blood-samples': 'BLOOD_SAMPLE',
      'doctor-reviews': 'DOCTOR_REVIEW',
      reports: 'REPORT',
      auth: 'AUTH',
    };

    // Find the first segment that matches an entity type
    for (const segment of segments) {
      const normalizedSegment = segment.toLowerCase();
      if (entityTypeMap[normalizedSegment]) {
        return entityTypeMap[normalizedSegment];
      }
    }

    // Default fallback
    return 'UNKNOWN';
  }

  private getActionType(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actionMap[method] || 'UNKNOWN';
  }

  private extractIpAddress(request: Request): string | null {
    // Check for forwarded IP first (if behind proxy)
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    // Check for real IP header
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fallback to request IP
    return request.ip || request.socket.remoteAddress || null;
  }

  private async logAuditEntry(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    changes?: Record<string, any>,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    if (!this.auditService) {
      return;
    }
    
    try {
      await this.auditService.log(
        userId,
        action,
        entityType,
        entityId,
        changes,
        ipAddress,
        userAgent,
      );
    } catch (error) {
      // Log error but don't throw - audit logging should not break request flow
      console.error('Audit logging error:', error);
    }
  }
}
