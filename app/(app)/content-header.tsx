"use client"
import { ReactNode } from "react";
import styled from "styled-components";

const Container = styled.div`
    min-height: 48px;
    max-height: 48px;
    height: 48px;
    border-bottom: 1px solid oklab(0.678888 0.00325716 -0.011175 / 0.121569);
    width: 100%;
    padding: 8px;
    padding-left: 20px;
    display: flex;

    &.inactive {
        visibility: hidden;
    }
`

export default function ContentHeader({ children, hide }: { children: ReactNode, hide?: boolean }) {
    return (
        <Container className={`${hide ? 'inactive' : ''}`}>
            {children}
        </Container>
    )
}