import { Throttle } from '@nestjs/throttler';

export const ThrottleAuth    = () => Throttle({ auth:    { limit: 5,  ttl: 60_000 } });
export const ThrottleDefault = () => Throttle({ default: { limit: 60, ttl: 60_000 } });
export const ThrottleHeavy   = () => Throttle({ heavy:   { limit: 20, ttl: 60_000 } });
