import ChannelSettingsPage from "@/components/channel-settings-page/channel-settings-page";
import GuildSettingsPage from "@/components/guild-settings-page.tsx/guild-settings-page";
import { AddRoleMembersModal } from "@/components/modals/add-role-members-modal";
import { CreateCategoryModal } from "@/components/modals/create-category-modal";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { CreateGuildModal } from "@/components/modals/create-guild-modal";
import { CreateInviteModal } from "@/components/modals/create-invite-modal";
import { DeleteChannelModal } from "@/components/modals/delete-channel-modal";
import { DeleteRoleModal } from "@/components/modals/delete-role-modal";
import { LeaveGuildModal } from "@/components/modals/leave-guild-modal";
import { RemovePermissionOverwriteModal } from "@/components/modals/remove-permission-overwrite.modal";
import SettingsPage from "@/components/settings-page/settings-page";
import { ModalType } from "@/enums/modal-type.enum";
import { createContext, ReactNode, useContext, useState } from "react";

interface ModalMetadata {
    type: ModalType;
    data?: any;
}

interface ModalContextType {
    openModal: (type: ModalType, data?: any) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType>(null!);

export function useModal() {
    return useContext(ModalContext);
}

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalMetadata | null>(null);

    function openModal(type: ModalType, data?: any) {
        setModal({ type, data });
    }

    function closeModal() {
        setModal(null);
    }

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            {modal?.type === ModalType.CREATE_CHANNEL && <CreateChannelModal guildId={modal.data.guildId} category={modal.data.category} onClose={closeModal} />}
            {modal?.type === ModalType.CREATE_GUILD && <CreateGuildModal onClose={closeModal} />}
            {modal?.type === ModalType.CREATE_CATEGORY && <CreateCategoryModal guildId={modal.data.guildId} onClose={closeModal} />}
            {modal?.type === ModalType.DELETE_CHANNEL && <DeleteChannelModal channel={modal.data.channel} onClose={closeModal} />}
            {modal?.type === ModalType.LEAVE_GUILD && <LeaveGuildModal guildId={modal.data.guildId} onClose={closeModal} />}
            {modal?.type === ModalType.CREATE_INVITE && <CreateInviteModal guildId={modal.data.guildId} channelId={modal.data.channelId} onClose={closeModal} />}
            {modal?.type === ModalType.ADD_ROLE_MEMBERS && <AddRoleMembersModal guildId={modal.data.guildId} roleId={modal.data.roleId} onClose={closeModal} />}
            {modal?.type === ModalType.REMOVE_PERMISSION_OVERWRITE && <RemovePermissionOverwriteModal target={modal.data.target} channel={modal.data.channel} targetType={modal.data.targetType} onClose={closeModal} />}
            {modal?.type === ModalType.DELETE_ROLE && <DeleteRoleModal role={modal.data.role} onClose={closeModal} />}
        </ModalContext.Provider>
    );
}