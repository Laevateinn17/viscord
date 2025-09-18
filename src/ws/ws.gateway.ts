import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { RelationshipResponseDTO } from "src/relationships/dto/relationship-response.dto";
import { Body, Controller, HttpStatus, Inject, Injectable, OnModuleInit, ValidationPipe } from "@nestjs/common";
import { Payload } from "../interfaces/payload.dto";
import { ClientGrpc, ClientProxy, ClientProxyFactory, EventPattern, MessagePattern, Transport } from "@nestjs/microservices";
import { CLIENT_READY_EVENT, FRIEND_ADDED_EVENT, FRIEND_REMOVED_EVENT, FRIEND_REQUEST_RECEIVED_EVENT, GET_DM_CHANNELS_EVENT, GET_USERS_PRESENCE_EVENT, GET_GUILDS_EVENT, GET_RELATIONSHIPS_EVENT, MESSAGE_RECEIVED_EVENT, USER_OFFLINE_EVENT, USER_ONLINE_EVENT, USER_QUEUE, USER_STATUS_UPDATE_EVENT, USER_TYPING_EVENT, VOICE_RING_EVENT, CHANNEL_QUEUE, VOICE_UPDATE_EVENT, GET_VOICE_STATES_EVENT, GET_VOICE_RINGS_EVENT, VOICE_RING_DISMISS_EVENT, CREATE_RTC_OFFER, CREATE_RTC_ANSWER, ICE_CANDIDATE, CREATE_SEND_TRANSPORT, CREATE_PRODUCER, CREATE_CONSUMER, CREATE_RECV_TRANSPORT, RESUME_CONSUMER, CONNECT_TRANSPORT, CLOSE_SFU_CLIENT, VOICE_MUTE, GET_USERS_PRESENCE_RESPONSE_EVENT } from "src/constants/events";
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

@Injectable()
@WebSocketGateway({ namespace: "/ws" })
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private channelsService: ChannelsService;
  private relationshipsService: RelationshipsService;
  private usersService: UsersService;
  private userMQ: ClientProxy;
  private channelMQ: ClientProxy;
  @WebSocketServer()
  server: Server
  private users: Map<string, string> = new Map();

  constructor(
    private readonly sfuService: SfuService,
    private readonly presenceService: PresenceService,
    @Inject('CHANNELS_SERVICE') private channelGRPCClient: ClientGrpc,
    @Inject('USERS_SERVICE') private userGRPCClient: ClientGrpc,
    @Inject('RELATIONSHIPS_SERVICE') private relationshipGRPCClient: ClientGrpc,
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

  @SubscribeMessage(GET_USERS_PRESENCE_EVENT)
  async handleGetFriendsPresence(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.headers['x-user-id'] as string;

    this.userMQ.emit(GET_USERS_PRESENCE_EVENT, userId);
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
  async handleVoiceJoin(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    const userId = client.handshake.headers['x-user-id'] as string;
    console.log('user ', userId, payload);

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
      const visibleUsersResponse: Result<string[]> = await firstValueFrom(this.relationshipsService.getVisibleUsers({ userId }));
      let userPresence: (string | null)[] = []
      if (visibleUsersResponse.status === HttpStatus.OK) {
        userPresence = await this.presenceService.getUserPresence(visibleUsersResponse.data);
      }

      this.channelMQ.emit(GET_VOICE_STATES_EVENT, userId);
      this.channelMQ.emit(GET_VOICE_RINGS_EVENT, userId);

      return { user: userResponse.data, dmChannels: dmChannelsResponse.data, relationships: relationshipResponse.data, presences: userPresence };
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

  async handleForwardUserPresence(payload: Payload<string[]>) {
    const recipient = payload.recipients[0];
    const socketId = this.users.get(recipient);

    if (socketId) this.server.to(socketId).emit(GET_USERS_PRESENCE_RESPONSE_EVENT)

  }




  onModuleInit() {
    this.channelsService = this.channelGRPCClient.getService<ChannelsService>('ChannelsService');
    this.usersService = this.userGRPCClient.getService<UsersService>('UsersService');
    this.relationshipsService = this.relationshipGRPCClient.getService<RelationshipsService>('RelationshipsService');
  }
}