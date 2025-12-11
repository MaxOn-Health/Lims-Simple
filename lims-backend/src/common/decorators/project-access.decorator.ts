import { SetMetadata } from '@nestjs/common';
import { RoleInProject } from '../../modules/projects/constants/role-in-project.enum';

export const PROJECT_ACCESS_KEY = 'project_access';

export const ProjectAccess = (roles: RoleInProject[] = []) => SetMetadata(PROJECT_ACCESS_KEY, roles);
