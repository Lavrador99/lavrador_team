import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { MessagesService } from './messages.service';

@UseGuards(JwtGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

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
}
