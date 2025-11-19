import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class UuidParamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const id = request.params?.id;
    
    // If id parameter exists and is not a valid UUID, reject it
    // This allows specific routes like 'my-samples' to match first
    if (id && id !== 'my-samples') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new BadRequestException(`Invalid UUID format: ${id}`);
      }
    }
    
    return true;
  }
}





