import {
  Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkoutTemplatesService } from './workout-templates.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('workout-templates')
export class WorkoutTemplatesController {
  constructor(private readonly service: WorkoutTemplatesService) {}

  @Roles('ADMIN')
  @Post()
  create(@Req() req: any, @Body() body: {
    name: string;
    description?: string;
    tags?: string[];
    blocks: any[];
    isPublic?: boolean;
  }) {
    return this.service.create({ ...body, createdBy: req.user.sub });
  }

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
