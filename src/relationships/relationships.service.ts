import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { Relationship } from "./entities/relationship.entity";
import { Repository } from "typeorm";
import { UserProfilesService } from "src/user-profiles/user-profiles.service";
import { Result } from "src/interfaces/result.interface";
import { UsersService } from "src/users/users.service";
import { RelationshipType } from "./enums/relationship-type.enum";
import { RelationshipResponseDTO } from "./dto/relationship-response.dto";

@Injectable()
export class RelationshipsService {
  constructor(
    private readonly userProfilesService: UserProfilesService,
    @InjectRepository(Relationship) private readonly relationshipRepository: Repository<Relationship>,

  ) { }
  async create(senderId: string, dto: CreateRelationshipDto): Promise<Result<null>> {
    const userProfileResponse = await this.userProfilesService.getProfileByUsername(dto.username);

    if (userProfileResponse.status != HttpStatus.OK) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Hm, didn't work. Double check that the username is correct.",
        data: null
      };
    }

    const recipient = userProfileResponse.data;

    if (recipient.id === senderId) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Hm, didn't work. Double check that the username is correct.",
        data: null
      };
    }

    const existingRelationship = await this.relationshipRepository.findOne({ where: [{ senderId: senderId, recipientId: recipient.id }, { recipientId: senderId, senderId: recipient.id }] });

    if (!existingRelationship) {
      const relationship: Relationship = new Relationship();
      relationship.senderId = senderId;
      relationship.recipientId = recipient.id;
      relationship.type = RelationshipType.Pending;

      try {
        await this.relationshipRepository.save(relationship);
      } catch (error) {
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "An unknown error occurred",
          data: null
        };
      }

      return {
        status: HttpStatus.NO_CONTENT,
        message: "Request sent successfully",
        data: null
      };
    }

    if (existingRelationship.type === RelationshipType.Friends) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "You're already friends with that user!",
        data: null
      };
    }
    else if ((existingRelationship.type === RelationshipType.Pending)) {
      if (existingRelationship.senderId != senderId) {
        const response = await this.acceptRequest(existingRelationship);
        if (response.status !== HttpStatus.NO_CONTENT) {
          return {
            status: HttpStatus.BAD_REQUEST,
            message: "Hm, didn't work. Double check that the username is correct.",
            data: null
          };
        }

        return {
          status: HttpStatus.NO_CONTENT,
          message: "Request accepted successfully",
          data: null
        };
      }
      else {
        return {
          status: HttpStatus.NO_CONTENT,
          message: "Request sent successfully",
          data: null
        };

      }
    }
    else if (existingRelationship.type === RelationshipType.Blocked && existingRelationship.senderId === senderId) {
      return this.update(senderId, existingRelationship.id, { type: RelationshipType.Friends });
    }
    return {
      status: HttpStatus.BAD_REQUEST,
      message: "Hm, didn't work. Double check that the username is correct.",
      data: null
    };
  }

  async findAll(userId: string): Promise<Result<RelationshipResponseDTO[]>> {
    if (!userId || userId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid user id",
        data: null
      };
    }

    const relationships: Relationship[] = await this.relationshipRepository.find({ where: [{ senderId: userId }, { recipientId: userId }] });

    const relationshipDTOs: RelationshipResponseDTO[] = await Promise.all(relationships.filter(rel => (rel.type !== RelationshipType.Blocked || rel.senderId === userId)).map(async (relationship) => {
      const user = (await this.userProfilesService.getById(relationship.senderId !== userId ? relationship.senderId : relationship.recipientId)).data;
      return {
        id: relationship.id,
        type: relationship.type === RelationshipType.Pending ? relationship.senderId === userId ? RelationshipType.Pending : RelationshipType.PendingReceived : relationship.type,
        user: user,
        createdAt: relationship.createdAt,
        updatedAt: relationship.updatedAt
      };
    }));


    return {
      status: HttpStatus.OK,
      message: "Relationships retrieved successfully",
      data: relationshipDTOs
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} relationship`;
  }

  async update(userId: string, id: string, dto: UpdateRelationshipDto): Promise<Result<null>> {
    if (!id || id.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid id",
        data: null
      };
    }

    if (!dto || !dto.type) {
      dto = { type: RelationshipType.Friends };
    }

    const relationship: Relationship = await this.relationshipRepository.findOneBy({ id: id });

    if (!relationship || (relationship.senderId != userId && relationship.recipientId != userId)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Relationship not found",
        data: null
      };
    }

    if (dto.type === RelationshipType.Blocked) {
      return this.blockUserUpdate(userId, relationship);
    }
    else if (dto.type === RelationshipType.Friends) {
      return this.acceptRequest(relationship);
    }
    else {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid request",
        data: null
      };
    }
  }

  public async blockUser(userId: string, blockedUserId: string): Promise<Result<null>> {
    if (!blockedUserId || blockedUserId.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid id",
        data: null
      };
    }

    const rel = await this.relationshipRepository.findOne({ where: [{ senderId: userId, recipientId: blockedUserId }, { senderId: blockedUserId, recipientId: userId }] });

    if (rel) {
      return this.blockUserUpdate(userId, rel);
    }

    const relationship = new Relationship();
    relationship.senderId = userId;
    relationship.recipientId = blockedUserId;
    relationship.type = RelationshipType.Blocked;

    await this.relationshipRepository.save(relationship);

    return {
      status: HttpStatus.NO_CONTENT,
      message: "User blocked successfully",
      data: null
    };
  }

  private async blockUserUpdate(userId: string, relationship: Relationship): Promise<Result<null>> {
    relationship.type = RelationshipType.Blocked;

    let blockedUserId: string = relationship.senderId === userId ? relationship.recipientId : relationship.senderId;

    relationship.senderId = userId;
    relationship.recipientId = blockedUserId;

    await this.relationshipRepository.save(relationship);

    return {
      status: HttpStatus.NO_CONTENT,
      message: "User blocked successfully",
      data: null
    };
  }

  private async acceptRequest(relationship: Relationship): Promise<Result<null>> {
    if (relationship.type !== RelationshipType.Pending && relationship.type !== RelationshipType.Blocked) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Cannot befriend this user",
        data: null
      }
    }

    relationship.type = RelationshipType.Friends;
    await this.relationshipRepository.save(relationship);

    return {
      status: HttpStatus.NO_CONTENT,
      message: "Friend request accepted successfully",
      data: null
    };
  }


  async remove(userId: string, id: string): Promise<Result<null>> {
    if (!id || id.length === 0) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid id",
        data: null
      };
    }
    let relationship: Relationship;
    try {
      console.log("id: ", id);
      relationship = await this.relationshipRepository.findOneBy({ id: id });

      if (!relationship || (relationship.senderId != userId && relationship.recipientId != userId)) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Invalid request",
          data: null
        }
      }
      if (relationship.type === RelationshipType.Blocked && relationship.senderId != userId) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Invalid request",
          data: null
        };
      }
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "An error occurred when deleting relationship",
        data: null
      };
    }

    try {
      await this.relationshipRepository.remove(relationship);
    } catch (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "An error occurred when deleting relationship",
        data: null
      };
    }

    return {
      status: HttpStatus.NO_CONTENT,
      message: "Relationship deleted",
      data: null
    }
  }
}
