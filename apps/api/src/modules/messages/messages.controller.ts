import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
  ) {}

  /** GET /messages/history/:withUserId — conversation history */
  @Get('history/:withUserId')
  getHistory(
    @Req() req: any,
    @Param('withUserId') withUserId: string,
    @Query('take') take?: string,
  ) {
    return this.messagesService.getHistory(req.user.sub, withUserId, take ? Number(take) : 50);
  }

  /** GET /messages/partners — list of people this user has messaged */
  @Get('partners')
  getPartners(@Req() req: any) {
    return this.messagesService.getConversationPartners(req.user.sub);
  }

  /** GET /messages/unread — count of unread messages */
  @Get('unread')
  getUnread(@Req() req: any) {
    return this.messagesService.countUnread(req.user.sub);
  }

  /** POST /messages/broadcast — send message to ALL clients (ADMIN only) */
  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async broadcast(@Req() req: any, @Body() body: { content: string }) {
    const allClients = await this.prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: { id: true },
    });
    const fromUserId = req.user.sub as string;
    await Promise.all(
      allClients.map((c) => this.messagesService.send(fromUserId, c.id, body.content)),
    );
    return { sent: allClients.length };
  }
}
