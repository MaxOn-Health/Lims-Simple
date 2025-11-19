import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { QueryTestsDto } from './dto/query-tests.dto';
import { TestResponseDto } from './dto/test-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Test } from './entities/test.entity';

@ApiTags('Tests')
@Controller('tests')
@ApiBearerAuth('JWT-auth')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new test (SUPER_ADMIN only)' })
  @ApiResponse({
    status: 201,
    description: 'Test created successfully',
    type: TestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 409, description: 'Test name already exists' })
  async create(@Body() createTestDto: CreateTestDto): Promise<Test> {
    return this.testsService.create(createTestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tests (all authenticated users)' })
  @ApiQuery({ name: 'category', required: false, enum: ['on_site', 'lab'] })
  @ApiQuery({ name: 'admin_role', required: false, type: String })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of tests',
    type: [TestResponseDto],
  })
  async findAll(@Query() query: QueryTestsDto): Promise<Test[]> {
    return this.testsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get test by ID' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'Test details',
    type: TestResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async findOne(@Param('id') id: string): Promise<Test> {
    const test = await this.testsService.findById(id);
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return test;
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update test (SUPER_ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'Test updated successfully',
    type: TestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  @ApiResponse({ status: 409, description: 'Test name already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateTestDto: UpdateTestDto,
  ): Promise<Test> {
    return this.testsService.update(id, updateTestDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete test (SUPER_ADMIN only, soft delete)' })
  @ApiParam({ name: 'id', description: 'Test ID' })
  @ApiResponse({
    status: 200,
    description: 'Test deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Test deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Test is used in packages' })
  @ApiResponse({ status: 403, description: 'Forbidden - SUPER_ADMIN only' })
  @ApiResponse({ status: 404, description: 'Test not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.testsService.softDelete(id);
    return { message: 'Test deleted successfully' };
  }

  @Get('by-admin-role/:adminRole')
  @ApiOperation({ summary: 'Get tests by admin role' })
  @ApiParam({ name: 'adminRole', description: 'Admin role (e.g., audiometry, xray)' })
  @ApiResponse({
    status: 200,
    description: 'List of tests for the admin role',
    type: [TestResponseDto],
  })
  async findByAdminRole(@Param('adminRole') adminRole: string): Promise<Test[]> {
    return this.testsService.findByAdminRole(adminRole);
  }
}

