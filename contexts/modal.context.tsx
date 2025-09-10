import { CreateChannelModal } from "@/app/(app)/(guild)/channels/[guildId]/create-channel-modal";
import { CreateGuildModal } from "@/components/modal/create-guild-modal";
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
            {modal.type === ModalType.CREATE_CHANNEL && <CreateChannelModal category={modal.data} onClose={closeModal}/>}
            {modal.type === ModalType.CREATE_GUILD && <CreateGuildModal onClose={closeModal} />}
        </ModalContext.Provider>
    );
}