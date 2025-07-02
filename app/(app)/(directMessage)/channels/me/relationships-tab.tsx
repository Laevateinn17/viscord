
import { Channel } from "@/interfaces/channel";
import Relationship from "@/interfaces/relationship";
import { Fragment } from "react";
import styled from "styled-components";
import { ActionButton, ActionContainer } from "./action-button";
import { createDMChannel } from "@/services/channels/channels.service";
import RelationshipListItem from "../relationship-list-item";
import { RelationshipType } from "@/enums/relationship-type.enum";
import { MdCheck, MdClose } from "react-icons/md";
import { useCurrentUserQuery, useDMChannelsQuery } from "@/hooks/queries";
import { IoMdMore } from "react-icons/io";
import { useAuth } from "@/contexts/auth.context";
import { acceptFriendRequest, declineFriendRequest } from "@/services/relationships/relationships.service";
import { useQueryClient } from "@tanstack/react-query";
import { RELATIONSHIPS_CACHE } from "@/constants/cache";
import { useRouter } from "next/navigation";
import { useAcceptFriendRequestMutation, useDeleteRelationshipMutation } from "@/hooks/mutations";

const FilterTypeContainer = styled.div`
    padding: 16px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--header-secondary);
    border-bottom: 1px solid var(--border-container);
    box-sizing: border-box;
    line-height: 1.28;
`


function MessageActionButton({ channel, relationship }: { channel?: Channel, relationship: Relationship }) {
    const router = useRouter();
    return (
        <ActionButton
            tooltipText="Message"
            onClick={async () => {
                if (!channel) {
                    await createDMChannel(relationship.user.id);
                    return;
                }
                router.push(`/channels/me/${channel.id}`)
            }}>
            <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z"></path></svg>
        </ActionButton>
    );
}

export function OnlineFriendsTab({ relationships }: { relationships: Relationship[] }) {
    const { data: channels } = useDMChannelsQuery();

    return (
        <Fragment>
            <FilterTypeContainer>{`Online — ${relationships.length}`}</FilterTypeContainer>
            {relationships.map((rel) => {
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        <ActionContainer>
                            <MessageActionButton relationship={rel} channel={channels ? channels.find(ch => ch.recipients[0].id === rel.user.id) : undefined} />
                            <ActionButton tooltipText="More">
                                <IoMdMore size={20} />
                            </ActionButton>
                        </ActionContainer>
                    </RelationshipListItem>);
            })}
        </Fragment>
    );
}

export function AllFriendsTab({ relationships }: { relationships: Relationship[] }) {
    const { data: channels } = useDMChannelsQuery();
    const { data: user } = useCurrentUserQuery();

    return (
        <Fragment>
            <FilterTypeContainer>{`All friends — ${relationships.length}`}</FilterTypeContainer>
            {relationships.map((rel, index) => {
                const channel = channels?.find(ch => ch.recipients.find(r => r.id !== user!.id)!.id === rel.user.id)!;
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        {rel.type === RelationshipType.Friends &&
                            <ActionContainer>
                                <MessageActionButton relationship={rel} channel={channel} />
                                <ActionButton tooltipText="More">
                                    <IoMdMore size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }

                    </RelationshipListItem>);
            })}
        </Fragment>
    );
}

export function PendingRequestsTab({ relationships }: { relationships: Relationship[] }) {
    const { data: channels } = useDMChannelsQuery();
    const { data: user } = useCurrentUserQuery();
    const {mutate: declineFriendRequest} = useDeleteRelationshipMutation();
    const {mutate: acceptFriendRequest} = useAcceptFriendRequestMutation();

    return (
        <Fragment>
            {relationships.filter(rel => rel.type === RelationshipType.Pending).length > 0 &&
                <FilterTypeContainer>{`Sent — ${relationships.length}`}</FilterTypeContainer>}
            {relationships.filter(rel => rel.type === RelationshipType.Pending).map((rel) => {
                const channel = channels?.find(ch => ch.recipients.find(r => r.id !== user!.id)!.id === rel.user.id)!;
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        {rel.type === RelationshipType.Pending &&
                            <ActionContainer>
                                <ActionButton onClick={() => declineFriendRequest(rel)} className="reject" tooltipText="Cancel">
                                    <MdClose size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }
                        {rel.type === RelationshipType.Friends &&
                            <ActionContainer>
                                <MessageActionButton relationship={rel} channel={channel} />
                                <ActionButton tooltipText="More">
                                    <IoMdMore size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }

                    </RelationshipListItem>);
            })}
            {relationships.filter(rel => rel.type === RelationshipType.PendingReceived).length > 0 &&
                <FilterTypeContainer>{`Received — ${relationships.length}`}</FilterTypeContainer>}
            {relationships.filter(rel => rel.type === RelationshipType.PendingReceived).map((rel) => {
                return (
                    <RelationshipListItem relationship={rel} key={rel.id}>
                        {rel.type === RelationshipType.PendingReceived &&
                            <ActionContainer>
                                <ActionButton onClick={() => acceptFriendRequest(rel)} className="accept" tooltipText="Accept">
                                    <MdCheck size={20} />
                                </ActionButton>
                                <ActionButton onClick={() => declineFriendRequest(rel)} className="reject" tooltipText="Decline">
                                    <MdClose size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }
                        {rel.type === RelationshipType.Friends &&
                            <ActionContainer>
                                <MessageActionButton relationship={rel} channel={channels ? channels.find(ch => ch.recipients[0].id === rel.user.id) : undefined} />
                                <ActionButton tooltipText="More">
                                    <IoMdMore size={20} />
                                </ActionButton>
                            </ActionContainer>
                        }

                    </RelationshipListItem>);
            })}

        </Fragment>
    );
}