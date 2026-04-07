import {
  Controller, Delete, Get, Param, Post, Req,
  UploadedFile, UseGuards, UseInterceptors, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

const uploadDir = join(process.cwd(), 'uploads', 'progress-photos');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@UseGuards(JwtGuard, RolesGuard)
@Controller('progress-photos')
export class ProgressPhotosController {
  constructor(private readonly prisma: PrismaService) {}

  @Roles('ADMIN')
  @Post('client/:clientId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
      },
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    }),
  )
  async upload(
    @Param('clientId') clientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { angle?: string; assessmentId?: string; notes?: string; takenAt?: string },
  ) {
    const url = `/uploads/progress-photos/${file.filename}`;
    return this.prisma.progressPhoto.create({
      data: {
        clientId,
        url,
        angle: body.angle,
        assessmentId: body.assessmentId || null,
        notes: body.notes,
        takenAt: body.takenAt ? new Date(body.takenAt) : new Date(),
      },
    });
  }

  @Roles('ADMIN')
  @Get('client/:clientId')
  getByClient(@Param('clientId') clientId: string) {
    return this.prisma.progressPhoto.findMany({
      where: { clientId },
      orderBy: { takenAt: 'desc' },
    });
  }

  @Roles('ADMIN')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.prisma.progressPhoto.delete({ where: { id } });
  }
}
