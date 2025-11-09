import { AutoMap } from "@automapper/classes";

export class AttachmentResponseDTO {
    @AutoMap()
    id: string;

    @AutoMap()
    type: string;

    @AutoMap()
    url: string;
}