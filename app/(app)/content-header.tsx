"use client"
import { ReactNode } from "react";
import styled from "styled-components";

const Container = styled.div`
    height: 48px;
    border-bottom: 1px solid oklab(0.678888 0.00325716 -0.011175 / 0.121569);
    width: 100%;
    padding: 8px;
    padding-left: 20px;
    display: flex;
`

export default function ContentHeader({ children }: { children: ReactNode }) {
    return (
        <Container>
            {children}
        </Container>
    )
}