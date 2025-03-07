import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, Res, Req, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from './dto/register-user.dto';
import { Request, Response } from 'express';
import { LoginDTO } from './dto/login.dto';
import { UpdatePasswordDTO } from './dto/update-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { RefreshTokenGuard } from "./guards/refresh-token.guard";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body(new ValidationPipe({ transform: true })) userData: RegisterUserDTO, @Res() res: Response) {
    const result = await this.authService.register(userData);
    const { status } = result

    if (status === HttpStatus.CREATED) {
      res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: '/',
        maxAge: 365 * 24 * 60 * 60 * 1000
      });
      res.cookie('accessToken', result.data.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        path: '/',
        maxAge: 5 * 60 * 1000 // 5 mins
      });
      delete result.data.accessToken;
      delete result.data.refreshToken;
    }

    return res.status(status).json(result);
  }

  @Post('login')
  async login(@Body(new ValidationPipe({ transform: true })) loginDTO: LoginDTO, @Res() res: Response) {
    const result = await this.authService.login(loginDTO);
    const { status } = result;

    if (status === HttpStatus.OK) {
      res.cookie('refreshToken', result.data.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        path: '/api/auth/refresh-token',
        maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
      });
      res.cookie('accessToken', result.data.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        path: '/',
        maxAge: 5 * 60 * 1000 // 5 mins
      });
      delete result.data.accessToken;
      delete result.data.refreshToken;
    }


    return res.status(status).json(result);
  }

  @UseGuards(AuthGuard)

  @UseGuards(AuthGuard)
  @Patch('update-password')
  async updatePassword(@Req() request: Request, @Body(new ValidationPipe({ transform: true })) dto: UpdatePasswordDTO, @Res() res: Response) {
    const id = request['userId'];
    const result = await this.authService.updatePassword(id, dto);
    const { status } = result;

    return res.status(status).json(result);
  }

  @UseGuards(AuthGuard)
  @Get('verify-token')
  async verifyToken(@Req() request: Request, @Res() res: Response) {
    const id = request['userId'];

    res.setHeader('X-User-Id', id);
    return res.status(HttpStatus.OK).json({ id });
  }

  @Get()
  async ping() {
    return 'hello';
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh-token')
  async refreshToken(@Req() request: Request, @Res() res: Response) {
    const id = request['userId'];
    const result = await this.authService.refreshToken(id);
    const { status } = result;
    if (result.status == HttpStatus.OK) {
      res.cookie('accessToken', result.data, {
        httpOnly: true,
        sameSite: "lax",
        path: '/',
        maxAge: 5 * 60 * 1000 // 5 mins
      });
      return res.status(status).json(result);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(HttpStatus.UNAUTHORIZED).send();
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    // res.cookie('accessToken', "", {
    //   httpOnly: true,
    //   sameSite: "lax",
    //   path: '/',
    //   maxAge: 0
    // })
    // res.cookie('refreshToken', "", {
    //   httpOnly: true,
    //   sameSite: "lax",
    //   path: '/refresh-token',
    //   maxAge: 0
    // })

    return res.status(HttpStatus.OK).send();
  }

  @Get('user/:id')
  async getUserIdentity(@Param('id') id: string, @Res() res: Response) {
    const result = await this.authService.getUserIdentity(id);
    const { status } = result;

    return res.status(status).json(result);
  }
}
