import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      restaurant: process.env.RESTAURANT_NAME,
      environment: process.env.NODE_ENV,
      status: 'ok',
    };
  }
}
