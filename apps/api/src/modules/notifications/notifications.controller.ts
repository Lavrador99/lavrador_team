import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get('vapid-public-key')
  getVapidKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? null };
  }

  @Post('subscribe')
  subscribe(
    @CurrentUser('sub') userId: string,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.svc.subscribe(userId, body);
  }

  @Delete('subscribe')
  unsubscribe(
    @CurrentUser('sub') userId: string,
    @Body('endpoint') endpoint: string,
  ) {
    return this.svc.unsubscribe(userId, endpoint);
  }
}
