import Checkbox from "@/components/checkbox/checkbox";
import Modal from "@/components/modals/modal";
import PrimaryButton from "@/components/buttons/primary-button";
import TextInputSecondary from "@/components/text-input/text-input-secondary";
import { useModal } from "@/contexts/modal.context";
import { Channel } from "@/interfaces/channel";
import { ReactNode, useState } from "react";
import { FaLock } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import { PiHash } from "react-icons/pi";
import styled from "styled-components";
import SecondaryButton from "@/components/buttons/secondary-button";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { ChannelType } from "@/enums/channel-type.enum";
import { createGuildChannel, deleteChannel } from "@/services/channels/channels.service";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { GUILDS_CACHE } from "@/constants/query-keys";
import { Guild } from "@/interfaces/guild";
import { useGuildDetailQuery } from "@/hooks/queries";
import { ModalType } from "@/enums/modal-type.enum";
import DangerButton from "../buttons/danger-button";

const ContentContainer = styled.div`
    background: var(--modal-background);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-faint);
    width: 400px;
`

const ContentHeader = styled.div`
    padding: 16px 24px 0;
    display: flex;
    justify-content: space-between;

    h1 {
        color: var(--header-primary);
        font-size: var(--text-lg);
        font-weight: var(--font-weight-semibold);
        line-height: var(--line-height-tight);
    }

    button {
        color: var(--interactive-normal);
        cursor: pointer;

        :hover {
            color: var(--interactive-hover);
        }
    }
`

const ChannelCategoryText = styled.p`
    font-size: var(--text-xs);
    color: var(--header-secondary);
    line-height: var(--line-height-tight);
`

const ContentBody = styled.div`
    padding: 8px 16px 0 24px;

    h2 {
        font-size: var(--text-base);
        color: var(--text-default);
        line-height: var(--line-height-tight);
        font-weight: var(--font-weight-regular);
        margin-bottom: 8px;
    }

    h3 {
        font-size: var(--text-xs);
        color: var(--header-primary);
        line-height: var(--line-height-tight);
        font-weight: var(--font-weight-medium);
        margin-bottom: 8px;
    }
`

const RadioButtonContainer = styled.div`
    padding: 12px 16px;
    display: flex;
    cursor: pointer;
    gap: 8px;
    align-items: center;
    border-radius: var(--rounded-lg);

    &:hover, &.selected {
        background: var(--background-mod-subtle);
    }

    margin-bottom: 4px;
`

const RadioInput = styled.div`
    height: 24px;
    width: 24px;
    border-radius: calc(infinity * 1px);
`

const RadioButtonLabelContainer = styled.div`
    display: flex;
    align-items: center;
    color: var(--interactive-normal);
`

const RadioButtonLabelTextContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-left: 12px;

    h1 {
        font-weight: var(--font-weight-medium);
        font-size: var(--text-base);
        color: var(--text-default);
    }

    p {
        font-size: var(--text-sm);
        color: var(--header-secondary);
        margin-top: 4px;
    }
`

const ContentSection = styled.div`
    margin-bottom: 20px;

    p {
        font-size: var(--text-base);
        color: var(--text-default);
        b {
        font-weight: var(--font-weight-semibold);
        }
    }
`

const ChannelNameInputIcon = styled.span`
    width: 34px;
    height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ContentFooter = styled.div`
    padding: 16px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`

function RadioButton({ children, isSelected, onClick }: { children: ReactNode, isSelected: boolean, onClick: () => void }) {
    return (
        <RadioButtonContainer onClick={onClick} className={`${isSelected ? 'selected' : ''}`}>
            <RadioInput>
                <svg viewBox="0 0 26 26">
                    {isSelected && <circle cx="13" cy="13" r="12" fill="var(--primary)"></circle>}
                    <circle cx="13" cy="13" r="12" strokeWidth="2" fill="none" stroke={isSelected ? 'var(--primary)' : 'var(--checkbox-border-default)'}></circle>
                    {isSelected && <circle cx="13" cy="13" r="5" fill="white"></circle>}
                </svg>
            </RadioInput>
            {children}
        </RadioButtonContainer>
    );
}

export function DeleteChannelModal({ channel, onClose }: { channel: Channel, onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { closeModal } = useModal();
    const {data: guild} = useGuildDetailQuery(channel.guildId);

    async function handleCreateChannel() {
        setIsLoading(true);
        const response = await deleteChannel(channel.id);
        setIsLoading(false);
        if (!response.success) {
            setError(response.message as string);
            return;
        }

        queryClient.setQueryData<Guild>([GUILDS_CACHE, channel.guildId], (old) => {
            if (!old) return old;

            return {
                ...old,
                channels: [...old.channels.filter(ch => ch.id !== channel.id)]
            };
        })
        const remainingChannels = guild?.channels.filter(ch => ch.id !== channel.id && ch.type === ChannelType.Text) ?? [];

        if (remainingChannels.length > 0) {
            router.push(`/channels/${guild!.id}/${remainingChannels[0].id}`);
        } else {
            router.push(`/channels/${channel.guildId}`);
        }

        onClose();
        closeModal(ModalType.CHANNEL_SETTINGS);
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Delete Channel</h1>
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <p>Are you sure you want to delete <b>{channel.type === ChannelType.Text ? `#${channel.name}` : channel.name}</b>? this cannot be undone.</p>
                    </ContentSection>
                </ContentBody>
                <ContentFooter>
                    <SecondaryButton onClick={onClose} size="lg">Cancel</SecondaryButton>
                    <DangerButton disabled={isLoading} onClick={handleCreateChannel} size="lg">Delete Channel</DangerButton>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}