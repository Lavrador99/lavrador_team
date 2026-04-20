import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import webpush from 'web-push';

// VAPID keys must be set in environment:
// VAPID_PUBLIC_KEY=<key>
// VAPID_PRIVATE_KEY=<key>
// VAPID_SUBJECT=mailto:admin@example.com

function initWebPush() {
  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject    = process.env.VAPID_SUBJECT ?? 'mailto:admin@lavrador.pt';

  if (!publicKey || !privateKey) {
    Logger.warn('VAPID keys not set — Push Notifications disabled.', 'NotificationsService');
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

const webPushEnabled = initWebPush();

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async subscribe(userId: string, subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) {
    await this.prisma.$executeRaw`
      INSERT INTO "PushSubscription" ("userId", "endpoint", "p256dh", "auth", "createdAt")
      VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, NOW())
      ON CONFLICT ("endpoint") DO UPDATE SET "userId" = ${userId}, "p256dh" = ${subscription.keys.p256dh}, "auth" = ${subscription.keys.auth}
    `;
    return { ok: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.$executeRaw`
      DELETE FROM "PushSubscription" WHERE "userId" = ${userId} AND "endpoint" = ${endpoint}
    `;
    return { ok: true };
  }

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string; icon?: string }) {
    if (!webPushEnabled) return;

    const subs = await this.prisma.$queryRaw<{ endpoint: string; p256dh: string; auth: string }[]>`
      SELECT "endpoint", "p256dh", "auth" FROM "PushSubscription" WHERE "userId" = ${userId}
    `;

    const message = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      url:   payload.url  ?? '/',
      icon:  payload.icon ?? '/icons/icon-192x192.png',
    });

    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
        ).catch((err) => {
          if (err.statusCode === 410) {
            this.prisma.$executeRaw`DELETE FROM "PushSubscription" WHERE "endpoint" = ${sub.endpoint}`.catch(() => {});
          }
          this.logger.warn(`Push failed for ${sub.endpoint}: ${err.message}`);
        }),
      ),
    );
  }

  async sendToAll(payload: { title: string; body: string; url?: string }) {
    if (!webPushEnabled) return;

    const subs = await this.prisma.$queryRaw<{ userId: string; endpoint: string; p256dh: string; auth: string }[]>`
      SELECT "userId", "endpoint", "p256dh", "auth" FROM "PushSubscription"
    `;

    const message = JSON.stringify({ ...payload, icon: '/icons/icon-192x192.png' });

    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message,
        ).catch((err) => {
          if (err.statusCode === 410) {
            this.prisma.$executeRaw`DELETE FROM "PushSubscription" WHERE "endpoint" = ${sub.endpoint}`.catch(() => {});
          }
        }),
      ),
    );
  }
}
