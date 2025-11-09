import { ModalType } from "@/enums/modal-type.enum";
import { create } from "zustand";

interface ModalMetadata {
    type: ModalType | null;
    data?: any;
}

interface ModalStore {
    openModal: (type: ModalType, data?: any) => void;
    closeModal: (type?: ModalType) => void;
    modal: ModalMetadata
}
