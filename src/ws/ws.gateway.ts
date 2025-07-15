import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from "socket.io";
import { RelationshipResponseDTO } from "src/relationships/dto/relationship-response.dto";
import { Body, Controller, Inject, Injectable, ValidationPipe } from "@nestjs/common";
import { Payload } from "./dto/payload.dto";
import { ClientProxy, ClientProxyFactory, EventPattern, MessagePattern, Transport } from "@nestjs/microservices";
import { CLIENT_READY_EVENT, FRIEND_ADDED_EVENT, FRIEND_REMOVED_EVENT, FRIEND_REQUEST_RECEIVED_EVENT, GET_DM_CHANNELS_EVENT, GET_USERS_STATUS_EVENT, GET_USERS_STATUS_RESPONSE_EVENT, GET_GUILDS_EVENT, GET_RELATIONSHIPS_EVENT, MESSAGE_RECEIVED_EVENT, USER_OFFLINE_EVENT, USER_ONLINE_EVENT, USER_QUEUE, USER_STATUS_UPDATE_EVENT, USER_TYPING_EVENT } from "src/constants/events";
import { HttpService } from "@nestjs/axios";
import axios from "axios";
import { UserStatusUpdateDTO } from "src/user-profiles/dto/user-status-update.dto";
import { UserTypingDTO } from "src/guilds/dto/user-typing.dto";

@Injectable()
@WebSocketGateway({ namespace: "/ws" })
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private userMQ: ClientProxy;
  @WebSocketServer()
  server: Server
  private users: Map<string, string> = new Map();

  constructor() {
    this.userMQ = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RMQ_HOST}:${process.env.RMQ_PORT}`],
        queue: USER_QUEUE,
        queueOptions: { durable: true }
      }
    });
  }

  afterInit(server: Server) {
    console.log("websocket gateway initialized at port", process.env.WS_PORT);
  }

  handleConnection(client: Socket) {
    const id: string = client.handshake.headers['x-user-id'] as string;
    if (!id) {
      client.disconnect();
      return;
    }
    this.users.set(id, client.id);
    this.userMQ.emit(USER_ONLINE_EVENT, id);
  }

  handleDisconnect(client: Socket) {
    console.log(this.users);
    for (const [userId, socketId] of this.users.entries()) {
      if (socketId != client.id) continue;
      console.log("EMITTING USER OFFLINE");
      this.users.delete(userId);
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
    const userIds = payload.recipients as string[];

    userIds.forEach(userId => {
      const socketId = this.users.get(userId);
      if (socketId) {
        this.server.to(socketId).emit(USER_ONLINE_EVENT, payload.data);
      }
    });
  }

  async handleUserOffline(payload: Payload<string>) {
    const userIds = payload.recipients as string[];

    userIds.forEach(userId => {
      const socketId = this.users.get(userId);
      if (socketId) {
        this.server.to(socketId).emit(USER_OFFLINE_EVENT, payload.data);
      }
    });
  }

  async handleMessageReceived(payload: Payload<any>) {
    const userIds = payload.recipients;
    userIds.forEach(userId => {
      const socketId = this.users.get(userId);
      if (socketId) {
        this.server.to(socketId).emit(MESSAGE_RECEIVED_EVENT, payload.data);
      }
    })
  }

  @SubscribeMessage(GET_USERS_STATUS_EVENT)
  async handleGetFriendsStatus(@MessageBody() userIds: string[], @ConnectedSocket() client: Socket) {
    const userId = client.handshake.headers['x-user-id'] as string;

    if (!userId) {
      client.disconnect();
      return;
    }

    const friendsStatus: Record<string, boolean> = {};
    for (const friendId of userIds) {
      const socketId = this.users.get(friendId);
      friendsStatus[friendId] = !!socketId;
    }

    const socketId = this.users.get(userId as string);

    this.server.to(socketId).emit(GET_USERS_STATUS_RESPONSE_EVENT, friendsStatus);
  }

  async handleUserStatusUpdate(payload: Payload<UserStatusUpdateDTO>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }
    this.server.to(recipients).emit(USER_STATUS_UPDATE_EVENT, { userId: payload.data.userId, status: payload.data.status });
  }

  async handleBroadcastUserTyping(payload: Payload<UserTypingDTO>) {
    const recipients = [];
    for (const recipient of payload.recipients) {
      const socketId = this.users.get(recipient);
      if (socketId) {
        recipients.push(socketId);
      }
    }

    this.server.to(recipients).emit(USER_TYPING_EVENT, { userId: payload.data.userId, channelId: payload.data.channelId });
  }
}