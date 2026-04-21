import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OnboardingService, OnboardingIntakeDto } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly svc: OnboardingService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('generate-link')
  generateLink(
    @CurrentUser('sub') ptUserId: string,
    @Body() body: { clientName?: string; clientEmail?: string },
  ) {
    return this.svc.generateToken(ptUserId, body.clientName, body.clientEmail);
  }

  // Public — no JWT required
  @Get(':token')
  getTokenInfo(@Param('token') token: string) {
    return this.svc.getTokenInfo(token);
  }

  // Public — client submits their own data
  @Post(':token/submit')
  submitIntake(
    @Param('token') token: string,
    @Body() body: OnboardingIntakeDto,
  ) {
    return this.svc.submitIntake(token, body);
  }
}
