import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Res } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';
import { Response } from "express";

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {
  }

  @Delete(":inviteId")
  async deleteInvite(@Headers('X-User-Id') userId: string, @Param('inviteId') inviteId: string, @Res() res: Response) {
    const result = await this.invitesService.deleteInvite(userId, inviteId);
    const {status} = result;

    return res.status(status).json(result);
  }

  @Post(":inviteCode")
  async joinGuild(@Headers('X-User-Id') userId: string, @Param('inviteCode') inviteCode: string, @Res() res: Response) {
    const result = await this.invitesService.joinGuild(userId, inviteCode);
    const {status} = result;

    return res.status(status).json(result);
  }
}
