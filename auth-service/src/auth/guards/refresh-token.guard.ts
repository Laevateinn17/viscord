import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Observable } from 'rxjs';

@Injectable()
export class RefreshTokenGuard implements CanActivate {

  constructor(private jwtService: JwtService) {

  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.cookies["refreshToken"];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
      console.log("verifying");
      request['userId'] = payload['userId'];
    } catch {
      console.log("NUH UH");
      throw new UnauthorizedException();
    }

    return true;
  }
}
