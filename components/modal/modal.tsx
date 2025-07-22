import { Dispatch, MouseEvent, ReactNode, SetStateAction, useState } from "react";
import styled from "styled-components";


const ModalBackground = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 69;
    background-color: rgba(0, 0, 0, 0.7);
    justify-content: center;
    align-items: center;
    display: none;

    &.active {
        display: flex;
    }
`


export default function Modal({children, show, setShow}: {children: ReactNode, show: boolean, setShow: Dispatch<SetStateAction<boolean>>}) {
    
    function hideModal(e: MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) {
            setShow(false);
        }
    }
    
    return (
        <ModalBackground onClick={hideModal} className={`${show ? 'active' : ''}`}>
            {children}
        </ModalBackground>
    )
}