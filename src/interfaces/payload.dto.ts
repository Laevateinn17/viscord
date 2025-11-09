import { AutoMap } from "@automapper/classes"

export class Payload<T> {

    @AutoMap()
    recipients: string[];

    @AutoMap()
    targetIds: string[];

    @AutoMap()
    data: T
}