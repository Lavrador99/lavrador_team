import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Headers, RawBodyRequest, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InvoicesService } from './invoices.service';

@UseGuards(JwtGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() body: {
    clientId: string;
    amount: number;
    currency?: string;
    description: string;
    dueDate: string;
    notes?: string;
  }) {
    return this.invoicesService.create(body);
  }

  @Roles('ADMIN')
  @Get()
  findAll(@Query('clientId') clientId?: string) {
    return this.invoicesService.findAll(clientId);
  }

  @Roles('ADMIN')
  @Get('summary/:clientId')
  summary(@Param('clientId') clientId: string) {
    return this.invoicesService.summaryByClient(clientId);
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findById(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.invoicesService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.delete(id);
  }

  @Roles('ADMIN')
  @Post(':id/payment-link')
  createPaymentLink(@Param('id') id: string) {
    return this.invoicesService.createPaymentLink(id);
  }

  // Public endpoint for Stripe webhooks — skip JWT
  @Post('webhook/stripe')
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.invoicesService.handleStripeWebhook(req.rawBody!, signature);
  }
}
