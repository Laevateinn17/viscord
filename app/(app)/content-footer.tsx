import { ReactNode } from "react";
import styled from "styled-components";

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;

    &.inactive {
        visibility: hidden;
    }
    padding-bottom: 16px;
`

export function ContentFooter({hide, children}: {hide: boolean, children: ReactNode}) {
    return (
        <Container className={`${hide ? 'inactive' : ''}`}>
            {children}
        </Container>
    )
}