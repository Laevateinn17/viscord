import Modal from "@/components/modals/modal";
import { useModal } from "@/contexts/modal.context";
import { Channel } from "@/interfaces/channel";
import { ReactNode, useState } from "react";
import { MdClose } from "react-icons/md";
import styled from "styled-components";
import ButtonSecondary from "@/components/buttons/button-secondary";
import { ChannelType } from "@/enums/channel-type.enum";
import { useRouter } from "next/navigation";
import { ModalType } from "@/enums/modal-type.enum";
import ButtonDanger from "../buttons/button-danger";
import { useGetGuild } from "@/app/stores/guilds-store";
import { useDeleteGuildChannelMutation, useLeaveGuildMutation } from "@/hooks/mutations";
import { leaveGuild } from "@/services/guild/guild.service";
import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";

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
    line-height: 1.25;

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

export function LeaveGuildModal({ guildId, onClose }: { guildId: string, onClose: () => void }) {
    const [error, setError] = useState<string | undefined>(undefined);
    const router = useRouter();
    const { closeSettings } = useSettingsOverlay();
    const guild = useGetGuild(guildId)!;
    const { mutateAsync: leaveGuild, isPending } = useLeaveGuildMutation();

    async function handleLeaveGuild() {
        const response = await leaveGuild(guildId);
        if (!response.success) {
            setError(response.message as string);
            return;
        }

        router.push(`/channels/me`);

        onClose();
        closeSettings
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Leave '{guild.name}'</h1>
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <p>Are you sure you want to leave <b>{guild.name}</b>? You won't be able to rejoin this server unless you are re-invited</p>
                    </ContentSection>
                </ContentBody>
                <ContentFooter>
                    <ButtonSecondary onClick={onClose} size="lg">Cancel</ButtonSecondary>
                    <ButtonDanger disabled={isPending} onClick={handleLeaveGuild} size="lg">Leave Server</ButtonDanger>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}