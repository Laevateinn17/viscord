
export enum ChannelType {
    Text = 0,
    Voice = 1,
    Category = 2,
    DM = 3,
}

export const ChannelTypeString = {
    [ChannelType.Text]: "Text",
    [ChannelType.Voice]: "Voice",
    [ChannelType.Category]: "Category",
    [ChannelType.DM]: "Direct Message",
}