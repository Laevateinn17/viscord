"use client"
import { useChannelsStore, useGetChannel } from "@/app/stores/channels-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useUserProfileStore } from "@/app/stores/user-profiles-store";
import { useIsUserTyping, useTypingUsersFromChannel, useUserTypingStore } from "@/app/stores/user-typing-store";
import { LoadingIndicator } from "@/components/loading-indicator/loading-indicator";
import MessageItem from "@/components/message-item/message-item";
import { MESSAGES_CACHE } from "@/constants/query-keys";
import { MessageStatus } from "@/enums/message-status.enum";
import { useMessagesQuery } from "@/hooks/queries";
import { Channel } from "@/interfaces/channel";
import { CreateMessageDto } from "@/interfaces/dto/create-message.dto";
import { Message } from "@/interfaces/message";
import { sendTypingStatus } from "@/services/channels/channels.service";
import { acknowledgeMessage, sendMessage } from "@/services/messages/messages.service";
import { dateToShortDate } from "@/utils/date.utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation"
import { ChangeEvent, Fragment, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { FaCirclePlus } from "react-icons/fa6";
import styled from "styled-components";
import { DMChannelHeader } from "./channel-header";
import { LINE_HEIGHT, MAX_LINE_COUNT, VERTICAL_PADDING } from "@/constants/user-interface";


const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
`

const MessagesContainer = styled.div`
    flex-grow: 1;
    width: auto;
    overflow-y: auto;
    padding-top: 24px;
    padding-bottom: 12px;
    display: flex;
    flex-direction: column-reverse;
    overflow-anchor: auto;

    &::-webkit-scrollbar {
        width: 16px;
    }

    &::-webkit-scrollbar-thumb {
        border: 4px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
        border-radius: 10px;
        background-color: #888;
    }
`

const ChatInputWrapper = styled.div`
    padding: 0 8px;
    margin-bottom: 24px;
    position: relative;
`

const InputContainer = styled.div`
    width: 100%;
    background-color: var(--chat-background-default);
    border-radius: 8px;
    border: 1px solid var(--border-faint);
    display: flex;
    align-items: flex-start;
`

const TextInput = styled.textarea`
    padding: 16px 0;
    line-height: 22px;
    flex-grow: 1;
    background-color: initial;
    margin-left: 10px;
    min-height: 54px;
    resize: none;
    color: var(--text-normal);

    &:focus {
        outline: none;
    }

    &::placeholder {
        color: var(--placeholder);
    }

    &::-ms-input-placeholder {
        color: var(--placeholder);
    }

    &::-webkit-scrollbar {
        width: 10px;
    }

    &::-webkit-scrollbar-thumb {
        border: 3px solid rgba(0, 0, 0, 0);
        background-clip: padding-box;
        border-radius: 10px;
        background-color: #888;
    }
`

const UploadItemContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 10px 16px;
    color: var(--interactive-normal);
    cursor: pointer;
    min-height: 54px;
    
    &:hover {
        color: var(--interactive-hover);
    }
`

const MessageDivider = styled.div`
    height: 0;
    border-top: 1px solid rgba(151, 151, 159, 0.12);
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 16px;
    margin-top: 24px;
    p {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);   
        background-color: var(--background-secondary);
        padding: 0 4px;
    }
`

const LastReadDividerLine = styled.div`
    height: 0;
    border-top: 1px solid var(--status-danger);
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 6px 16px;
    position: relative;
    p {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-danger);   
        background-color: var(--background-secondary);
        padding: 0 4px;
    }
`



function TextInputItem({ channel, onSubmit }: { channel: Channel, onSubmit: (message: CreateMessageDto) => any }) {
    const [inputHeight, setInputHeight] = useState(LINE_HEIGHT + VERTICAL_PADDING)
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isTypingStatusCooldown, setTypingStatusCooldown] = useState(false);

    function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const dto: CreateMessageDto = { channelId: channel.id as string, content: text, attachments: attachments, mentions: [] as string[], createdAt: new Date() };
            onSubmit(dto);
            onInputChanged('');
        }
    }

    function onInputChanged(text: string) {
        setText(text);
        const lineCount = 1 + (text.match(/\n/g) || []).length;
        setInputHeight((lineCount > MAX_LINE_COUNT ? MAX_LINE_COUNT : lineCount) * LINE_HEIGHT + VERTICAL_PADDING);
        if (!isTypingStatusCooldown) {
            sendTypingStatus(channel.id);
            setTypingStatusCooldown(true);
            setTimeout(() => {
                setTypingStatusCooldown(false);
            }, 8000)
        }
    }

    const [text, setText] = useState('');
    return (
        <TextInput value={text} onKeyDown={handleKeyDown} style={{ height: inputHeight }} onChange={(e) => onInputChanged(e.target.value)} placeholder={`Message @${channel.recipients[0].displayName}`} />

    )
}

function LastReadDivider() {
    return (
        <LastReadDividerLine>
            <span className="absolute flex right-0 text-[10px] leading-[13px] font-bold bg-[var(--status-danger)] rounded-sm px-[4px]">
                NEW
            </span>
        </LastReadDividerLine>
    )
}

function formatTyping(names: string[]) {
    if (names.length <= 0) return "";
    if (names.length == 1) return names[0];
    else return names.concat(", ");

}


export default function Page() {
    const { channelId } = useParams();
    const { getChannel, updateChannel } = useChannelsStore();
    // const [channel, setChannel] = useState<Channel>(getChannel(channelId as string)!);
    const channel = useGetChannel(channelId as string);
    const { data: messages } = useMessagesQuery(channelId! as string);
    const groupedMessages = messages?.reduce((groups, message) => {
        const key = message.createdAt.toLocaleDateString();

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(message);

        return groups;
    }, {} as Record<string, Message[]>);
    const [isPageReady, setIsPageReady] = useState(false);
    const queryClient = useQueryClient();
    const { user } = useCurrentUserStore();
    const { getUserProfile } = useUserProfileStore();
    const { mutate: sendMessageMutation } = useMutation({
        mutationFn: (dto: CreateMessageDto) => sendMessage(dto),
        onSuccess: (response) => {
        }
    });

    const typingUsers = useTypingUsersFromChannel(channelId as string);

    async function handleAcknowledgeMessage(channelId: string, messageId: string) {
        if (!channel) return;

        updateChannel({ ...channel, lastReadId: messageId })
        acknowledgeMessage(channelId, messageId);
    }

    async function handleSubmit(dto: CreateMessageDto) {
        const id = `pending-${messages!.length}`
        const createdAt = new Date();
        const message: Message = {
            id: id,
            createdAt: createdAt,
            updatedAt: createdAt,
            senderId: user!.id,
            status: MessageStatus.Pending,
            attachments: [],
            channelId: channelId as string,
            content: dto.content,
            mentions: dto.mentions,
            is_pinned: false
        };

        if (channel) {
            updateChannel({ ...channel!, lastReadId: message.id });
        }


        queryClient.setQueryData<Message[]>([MESSAGES_CACHE, channelId], (old) => {
            if (!old) {
                return [];
            }

            const newMessages = [...old, message];

            return newMessages;
        })
        const response = await sendMessage(dto);

        if (!response.success) {
            queryClient.setQueryData<Message[]>([MESSAGES_CACHE, channelId], (old) => {
                if (!old) {
                    return [];
                }

                const newMessages = [...old].map(m => {
                    if (m.id === message.id) {
                        m.status = MessageStatus.Error;
                    }
                    return m;
                });
                return newMessages;
            })
            return;
        }

        queryClient.setQueryData<Message[]>([MESSAGES_CACHE, channelId], (old) => {
            if (!old) {
                return [];
            }
            const data = response.data!;
            data.createdAt = new Date(data.createdAt);

            const newMessages = [...old].map(m => {
                if (m.id === message.id) {
                    return response.data!;
                }
                return m;
            });
            return newMessages;
        });
        if (!channel) return;
        updateChannel({ ...channel, lastReadId: response.data!.id });
    }

    useEffect(() => {
        if (!channel) return;

        // const ch = channels.get(channel.id)
        // if (!ch) return;

        // setChannel(ch)
        document.title = `Viscord | @${channel.recipients[0].displayName}`
    }, [channel]);


    useEffect(() => {
        if (channel && messages && user) {
            setIsPageReady(true);
        }

    }, [channel, messages, user])

    useEffect(() => {
        if (!isPageReady) return;

        const lastMessageId = messages && messages.length > 0 ? messages.length > 1 ? messages[messages!.length - 1].id : messages[0].id : null;

        if (lastMessageId && lastMessageId !== channel?.lastReadId) handleAcknowledgeMessage(channel!.id, lastMessageId);

    }, [isPageReady])

    if (!channel) {
        return <p></p>
    }

    return (
        <div className="h-full flex flex-col">
            <DMChannelHeader channel={channel} />
            <ChatContainer>
                <MessagesContainer>
                    {groupedMessages && Object.keys(groupedMessages).map((key) => {
                        const messages = groupedMessages[key];
                        return (
                            <Fragment key={key}>
                                {messages?.map(message => {
                                    const index = messages.findIndex(m => m.id === message.id)
                                    const prev = messages.at(index - 1);
                                    const isSubsequent = index !== 0 && (message.createdAt.getMinutes() - prev!.createdAt.getMinutes()) < 5 && message.senderId === prev!.senderId;
                                    return (
                                        <Fragment key={message.id}>
                                            {message.id === channel.lastReadId && index !== messages.length - 1 && <LastReadDivider />}
                                            <MessageItem
                                                message={{ ...message }}
                                                isSubsequent={isSubsequent}
                                                sender={getUserProfile(message.senderId)!} />
                                        </Fragment>
                                    )
                                }).reverse()}
                                <MessageDivider><p>{dateToShortDate(messages[0].createdAt)}</p></MessageDivider>
                            </Fragment>)
                    }).reverse()}
                </MessagesContainer>
                <ChatInputWrapper>
                    <InputContainer>
                        <UploadItemContainer><FaCirclePlus size={20} /></UploadItemContainer>
                        <TextInputItem channel={channel} onSubmit={handleSubmit} />
                    </InputContainer>
                    {typingUsers.length > 0 &&
                        <div className="ml-2 text-[12px] h-[24px] items-center flex absolute w-full">
                            <span className="mr-2">
                                <LoadingIndicator></LoadingIndicator>
                            </span>

                            <span className="font-bold">{formatTyping(typingUsers.map(tu => getUserProfile(tu.userId)!.displayName))}</span>&nbsp;is typing...
                        </div>}
                </ChatInputWrapper>
            </ChatContainer>
        </div>
    )
}