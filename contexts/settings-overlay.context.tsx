import { useSettingsOverlay } from "@/app/stores/settings-overlay-store";
import ChannelSettingsPage from "@/components/channel-settings-page/channel-settings-page";
import GuildSettingsPage from "@/components/guild-settings-page.tsx/guild-settings-page";
import SettingsPage from "@/components/settings-page/settings-page";
import { SettingsOverlayType } from "@/enums/settings-overlay-type.enum";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";



export function SettingsOverlayProvider({ children }: { children: ReactNode }) {
    const { metadata, closeSettings } = useSettingsOverlay();

    function closeSettingsKeyListener(event: KeyboardEvent) {
        if (event.key === "Escape") {
            closeSettings();
        }
    }
    useEffect(() => {
        if (metadata) {
            document.addEventListener('keydown', closeSettingsKeyListener);
        }
        return () => {
            document.removeEventListener('keydown', closeSettingsKeyListener);
        }
    }, [metadata]);

    return (
        <div>
            {children}
            <SettingsPage show={metadata?.type === SettingsOverlayType.SETTINGS} onClose={closeSettings} />
            <ChannelSettingsPage channelId={metadata?.data?.channelId} guildId={metadata?.data?.guildId} show={metadata?.type === SettingsOverlayType.CHANNEL_SETTINGS} onClose={closeSettings} />
            <GuildSettingsPage guildId={metadata?.data?.guildId} show={metadata?.type === SettingsOverlayType.GUILD_SETTINGS} onClose={closeSettings} />
        </div>
    )
}
