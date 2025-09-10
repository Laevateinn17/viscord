import Modal from "@/components/modal/modal";
import { useModal } from "@/contexts/modal.context";
import { Channel } from "@/interfaces/channel";
import { useState } from "react";
import { MdClose } from "react-icons/md";
import styled from "styled-components";

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
        color: var(--header-primary);
        line-height: var(--line-height-tight);
    }
`

export function CreateChannelModal({ category, onClose }: { category: Channel, onClose: () => void }) {
    return (
        <Modal onClose={onClose}>
            <ContentContainer>
                <ContentHeader>
                    <div className="flex flex-col">
                        <h1>Create Channel</h1>
                        {category && <ChannelCategoryText>in {category.name}</ChannelCategoryText>}
                    </div>
                    <button><MdClose size={24} /></button>
                </ContentHeader>
                <ContentBody>
                    <h2>Channel Type</h2>
                </ContentBody>
            </ContentContainer>
        </Modal>
    );
}