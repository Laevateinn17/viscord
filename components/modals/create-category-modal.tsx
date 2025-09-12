import { GUILDS_CACHE } from "@/constants/query-keys";
import { ChannelType } from "@/enums/channel-type.enum";
import { CreateChannelDTO } from "@/interfaces/dto/create-channel.dto";
import { Guild } from "@/interfaces/guild";
import { createGuildChannel } from "@/services/channels/channels.service";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Modal from "./modal";
import styled from "styled-components";
import TextInputSecondary from "../text-input/text-input-secondary";
import { MdClose } from "react-icons/md";
import { PiHash } from "react-icons/pi";
import { FaLock } from "react-icons/fa6";
import Checkbox from "../checkbox/checkbox";
import SecondaryButton from "../buttons/secondary-button";
import PrimaryButton from "../buttons/primary-button";
import { useRouter } from "next/navigation";

const ContentContainer = styled.div`
    background: var(--modal-background);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-faint);
    width: 496px;
`

const ContentHeader = styled.div`
    padding: 16px 24px 0;
    display: flex;
    justify-content: space-between;

    h1 {
        color: var(--header-primary);
        font-size: var(--text-lg);
        font-weight: var(--font-weight-regular);
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

const ContentSection = styled.div`
    margin-bottom: 20px;

    p {
        font-size: var(--text-sm);
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


export function CreateCategoryModal({ guildId, onClose }: { guildId: string, onClose: () => void }) {
    const [category, setChannel] = useState<CreateChannelDTO>({ type: ChannelType.Category,  guildId, isPrivate: false, name: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const router = useRouter();
    const queryClient = useQueryClient();

    function setChannelType(type: ChannelType) {
        setChannel({ ...category, type })
    }


    async function handleCreateChannel() {
        setIsLoading(true);
        const response = await createGuildChannel(category);
        setIsLoading(false);
        if (!response.success) {
            setError(response.message as string);
            return;
        }
        queryClient.setQueryData<Guild>([GUILDS_CACHE, guildId], (old) => {
            if (!old) return old;

            return {
                ...old, 
                channels: [...old.channels, response.data!]
            };
        })
        onClose();
    }

    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Create Category</h1>
                    </div>
                    <button onClick={onClose}><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <ContentSection>
                        <h2>Category Name</h2>
                        <TextInputSecondary
                            value={category.name}
                            onChange={(val) => setChannel({ ...category, name: val })}
                            placeholder="New Category">
                        </TextInputSecondary>
                        {error && <p>{error}</p>}
                    </ContentSection>
                    <ContentSection>
                        <div className="flex justify-between">
                            <div className="flex items-center gap-1">
                                <FaLock size={14} fill="var(--header-primary)" />
                                <h1>Private Category</h1>
                            </div>
                            <Checkbox value={category.isPrivate} onChange={(val) => setChannel({ ...category, isPrivate: val })}></Checkbox>
                        </div>
                        <p className="mt-[8px] leading-[20px]">By making a category private, only select members and roles will be able to view this category. Linked channels in this category will automatically match to this setting.</p>
                    </ContentSection>
                </ContentBody>
                <ContentFooter>
                    <SecondaryButton onClick={onClose} size="lg">Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleCreateChannel} disabled={category.name.length === 0 || isLoading} size="lg">Create Category</PrimaryButton>
                </ContentFooter>
            </ContentContainer>
        </Modal>
    );
}