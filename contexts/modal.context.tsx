import { CreateCategoryModal } from "@/components/modals/create-category-modal";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { CreateGuildModal } from "@/components/modals/create-guild-modal";
import { ModalType } from "@/enums/modal-type.enum";
import { createContext, ReactNode, useContext, useState } from "react";

interface ModalMetadata {
    type: ModalType | null;
    data?: any;
}

interface ModalContextType {
    openModal: (type: ModalType, data?: any) => void;
    closeModal: () => void;
    modal: ModalMetadata
}

const ModalContext = createContext<ModalContextType>(null!);

export function useModal() {
    return useContext(ModalContext);
}

export function ModalProvider({children}: {children: ReactNode}) {
    const [modal, setModal] = useState<ModalMetadata>({type: null});

    function openModal(type: ModalType, data?: any) {
        setModal({type, data});
    }

    function closeModal() {
        setModal({type: null});
    }
    
    return (
        <ModalContext.Provider value={{openModal, closeModal, modal}}>
            {children}
            {modal.type === ModalType.CREATE_CHANNEL && <CreateChannelModal guildId={modal.data.guildId} category={modal.data.category} onClose={closeModal}/>}
            {modal.type === ModalType.CREATE_GUILD && <CreateGuildModal onClose={closeModal} />}
            {modal.type === ModalType.CREATE_CATEGORY && <CreateCategoryModal guildId={modal.data.guildId} onClose={closeModal}/>}
        </ModalContext.Provider>
    );
}