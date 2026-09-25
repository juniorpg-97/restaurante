import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}
  getInfo() {
    return {
      restaurant: this.configService.getOrThrow<string>('RESTAURANT_NAME'),
      environment: this.configService.getOrThrow<string>('NODE_ENV'),
      status: 'ok',
    };
  }
}
