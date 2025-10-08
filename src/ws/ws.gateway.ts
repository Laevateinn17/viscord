import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { RelationshipResponseDTO } from "src/relationships/dto/relationship-response.dto";
import { Body, Controller, HttpStatus, Inject, Injectable, OnModuleInit, ValidationPipe } from "@nestjs/common";
import { Payload } from "../interfaces/payload.dto";
import { ClientGrpc, ClientProxy, ClientProxyFactory, EventPattern, MessagePattern, Transport } from "@nestjs/microservices";
import { CLIENT_READY_EVENT, FRIEND_ADDED_EVENT, FRIEND_REMOVED_EVENT, FRIEND_REQUEST_RECEIVED_EVENT, GET_DM_CHANNELS_EVENT, GET_GUILDS_EVENT, GET_RELATIONSHIPS_EVENT, MESSAGE_RECEIVED_EVENT, USER_OFFLINE_EVENT, USER_ONLINE_EVENT, USER_QUEUE, USER_STATUS_UPDATE_EVENT, USER_TYPING_EVENT, VOICE_RING_EVENT, CHANNEL_QUEUE, VOICE_UPDATE_EVENT, GET_VOICE_STATES_EVENT, GET_VOICE_RINGS_EVENT, VOICE_RING_DISMISS_EVENT, VOICE_MUTE, GUILD_UPDATE_EVENT } from "src/constants/events";
import { UserStatusUpdateDTO } from "src/user-profiles/dto/user-status-update.dto";
import { UserTypingDTO } from "src/guilds/dto/user-typing.dto";
import { VoiceEventDTO } from "src/channels/dto/voice-event.dto";
import { SfuService } from "src/sfu/sfu.service";
import { ChannelsService } from "src/channels/grpc/channels.service";
import { firstValueFrom } from "rxjs";
import { UsersService } from "src/users/grpc/users.service";
import { RelationshipsService } from "src/relationships/grpc/relationships.service";
import { RedisService } from "src/redis/redis.service";
import { PresenceService } from "src/presence/presence.service";
import { UserProfileResponseDTO } from "src/user-profiles/dto/user-profile-response.dto";
import { Result } from "src/interfaces/result.interface";
import { GuildsService } from "src/guilds/guilds.service";
import { GuildResponseDTO } from "src/guilds/dto/guild-response.dto";

@Injectable()
@WebSocketGateway({ namespace: "/ws" })
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private channelsService: ChannelsService;
  private relationshipsService: RelationshipsService;
  private usersService: UsersService;
  private guildsService: GuildsService;
  private userMQ: ClientProxy;
  private channelMQ: ClientProxy;
  @WebSocketServer()
  server: Server
  private users: Map<string, string> = new Map();

  constructor(
    private readonly sfuService: SfuService,
    private readonly presenceService: PresenceService,
    @Inject('CHANNELS_SERVICE') private channelsGRPCClient: ClientGrpc,
    @Inject('USERS_SERVICE') private usersGRPCClient: ClientGrpc,
    @Inject('RELATIONSHIPS_SERVICE') private relationshipsGRPCClient: ClientGrpc,
    @Inject('GUILDS_SERVICE') private guildsGRPCClient: ClientGrpc,

  ) {
    this.userMQ = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
        queue: USER_QUEUE,
        queueOptions: { durable: true }
      }
    });
    this.channelMQ = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
        queue: CHANNEL_QUEUE,
        queueOptions: { durable: true }
      }
    });
  }

  afterInit(server: Server) {
    console.log("websocket gateway initialized at port", process.env.WS_PORT);
  }

  handleConnection(client: Socket) {
    const userId: string = client.handshake.headers['x-user-id'] as string;
    if (!userId) {
      client.disconnect();
      return;
    }
    this.users.set(userId, client.id);
    this.userMQ.emit(USER_ONLINE_EVENT, userId);

    this.presenceService.setUserPresence(userId);
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.users.entries()) {
      if (socketId != client.id) continue;
      this.users.delete(userId);
      this.presenceService.deleteUserPresence(userId);
      this.userMQ.emit(USER_OFFLINE_EVENT, userId);
    }
  }


  async handleFriendReceived(dto: Payload<RelationshipResponseDTO>) {
    const socketId = this.users.get(dto.recipients[0]);
    if (!socketId) {
      return;
    }
    this.server.to(socketId).emit(FRIEND_REQUEST_RECEIVED_EVENT, dto.data);
  }

  async handleFriendAdded(dto: Payload<RelationshipResponseDTO>) {
    const socketId = this.users.get(dto.recipients[0]);
    if (!socketId) {
      return;
    }
    this.server.to(socketId).emit(FRIEND_ADDED_EVENT, dto.data);
  }

  async handleFriendRemoved(dto: Payload<RelationshipResponseDTO>) {
    const socketId = this.users.get(dto.recipients[0]);
    if (!socketId) {
      return;
    }
    this.server.to(socketId).emit(FRIEND_REMOVED_EVENT, dto.data);
  }

  async handleUserOnline(payload: Payload<string>) {
    const userSocket = this.users.get(payload.data);
    if (!userSocket) return;

    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(USER_ONLINE_EVENT, payload.data);
  }

  async handleUserOffline(payload: Payload<string>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(USER_OFFLINE_EVENT, payload.data);
  }

  async handleMessageReceived(payload: Payload<any>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(MESSAGE_RECEIVED_EVENT, payload.data);
  }

  async handleUserStatusUpdate(payload: Payload<UserStatusUpdateDTO>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }
    if (recipients.length > 0) this.server.to(recipients).emit(USER_STATUS_UPDATE_EVENT, { userId: payload.data.userId, status: payload.data.status });
  }

  async handleBroadcastUserTyping(payload: Payload<UserTypingDTO>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(USER_TYPING_EVENT, payload);
  }

  async handleRingChannelRecipients(payload: Payload<VoiceEventDTO>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(VOICE_RING_EVENT, payload.data);
  }

  @SubscribeMessage(VOICE_UPDATE_EVENT)
  async handleVoiceUpdate(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.headers['x-user-id'] as string;

    this.channelMQ.emit(VOICE_UPDATE_EVENT, { ...payload, userId: userId });
  }

  async handleVoiceStateUpdate(payload: Payload<VoiceEventDTO>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(VOICE_UPDATE_EVENT, payload.data);
  }

  @SubscribeMessage(CLIENT_READY_EVENT)
  async handleClientReady(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.headers['x-user-id'] as string;

    try {
      const dmChannelsResponse = await firstValueFrom(this.channelsService.getDmChannels({ userId }));
      const userResponse = await firstValueFrom(this.usersService.getCurrentUser({ userId }));
      const relationshipResponse: Result<RelationshipResponseDTO[]> = await firstValueFrom(this.relationshipsService.getRelationships({ userId }));
      const visibleUsersResponse: Result<string[] | undefined> = await firstValueFrom(this.relationshipsService.getVisibleUsers({ userId }));
      const guildsResponse: Result<GuildResponseDTO[]> = await firstValueFrom(this.guildsService.findAll({ userId }));

      let userIds = visibleUsersResponse.data ?? [];
      let userPresence: string[] = [];

      if (userIds.length > 0) {
        userPresence = await this.presenceService.getUserPresence(userIds);
      }

      this.channelMQ.emit(GET_VOICE_STATES_EVENT, userId);
      this.channelMQ.emit(GET_VOICE_RINGS_EVENT, userId);

      return { user: userResponse.data, dmChannels: dmChannelsResponse.data, relationships: relationshipResponse.data, presences: userPresence, guilds: guildsResponse.data };
    } catch (error) {
      console.log('failed grpc request', error)
    }
  }

  async handleGetVoiceStates(payload: Payload<any>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(GET_VOICE_STATES_EVENT, payload.data);
  }

  async handleGetVoiceRings(payload: Payload<any>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(GET_VOICE_RINGS_EVENT, payload.data);
  }

  async handleVoiceRing(payload: Payload<any>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(VOICE_RING_EVENT, payload.data);
  }

  async handleVoiceRingDismiss(payload: Payload<any>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(VOICE_RING_DISMISS_EVENT, payload.data);
  }

  @SubscribeMessage(VOICE_MUTE)
  async handleMute(@ConnectedSocket() client: Socket, @Body() producerId: string) {
    const response = await this.sfuService.muteProducer(producerId);

    if (response.status !== HttpStatus.OK) return;
  }

  async handleGuildUpdate(payload: Payload<any>) {
    const recipients = payload.recipients;
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    if (recipients.length > 0) this.server.to(recipients).emit(GUILD_UPDATE_EVENT, payload.data);
  }

  onModuleInit() {
    this.channelsService = this.channelsGRPCClient.getService<ChannelsService>('ChannelsService');
    this.usersService = this.usersGRPCClient.getService<UsersService>('UsersService');
    this.relationshipsService = this.relationshipsGRPCClient.getService<RelationshipsService>('RelationshipsService');
    this.guildsService = this.guildsGRPCClient.getService<GuildsService>('GuildsService');
  }
}