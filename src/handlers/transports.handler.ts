import { Request, Response } from "express";
import { Consumer, Producer, WebRtcTransport, Router } from "mediasoup/types";
import { createWorker } from "mediasoup";
import { CloseSFUClientDTO } from "../dto/close-sfu-client.dto";
import { STATUS_CODES } from "http";

let worker;
let router: Router;

const transports = new Map<string, WebRtcTransport>();
const consumers = new Map<string, Consumer>();
const producers = new Map<string, Producer>();
const channelProducers = new Map<string, { userId: string, producerId: string }[]>();

(async () => {
    worker = await createWorker();
    router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: "audio/opus",
                clockRate: 48000,
                channels: 2
            }
        ]
    });
})();

export async function getRTPCapabilities(req: Request, res: Response) {
    return res.status(200).json({ rtpCapabilities: router.rtpCapabilities });
}

export async function createTransport(req: Request, res: Response) {
    const transport = await router.createWebRtcTransport({
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        listenInfos: [
            {
                ip: "0.0.0.0",
                announcedAddress: process.env.HOST,
                portRange: { min: Number(process.env.RTC_MIN_PORT), max: Number(process.env.RTC_MAX_PORT) },
                protocol: "udp",
            }
        ],
    });


    transports.set(transport.id, transport);

    return res.status(200).json({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters
    });
}

export async function connectTransport(req: Request, res: Response) {
    const { transportId, dtlsParameters } = req.body;

    const transport = transports.get(transportId);
    if (!transport) return res.status(400).send();

    await transport.connect({ dtlsParameters });
    return res.status(200).send();
}

export async function produce(req: Request, res: Response) {
    const { channelId, transportId, kind, rtpParameters, userId } = req.body;
    const transport = transports.get(transportId);
    if (!transport) return res.status(404).send();

    const producer = await transport.produce({ kind: kind, rtpParameters })
    producers.set(producer.id, producer);

    const existing = channelProducers.get(channelId) || [];
    existing.push({ userId, producerId: producer.id });
    channelProducers.set(channelId, existing);

    return res.status(200).json({ id: producer.id, kind });
}

export async function consume(req: Request, res: Response) {
    const { transportId, producerId, rtpCapabilities } = req.body;

    const transport = transports.get(transportId);
    if (!transport) return res.status(400).send();

    const producer = producers.get(producerId);
    if (!producer) return res.status(400).send();


    const consumer = await transport.consume({ producerId, rtpCapabilities, paused: true });
    consumers.set(consumer.id, consumer);

    return res.status(200).json({ id: consumer.id, producerId: producer.id, kind: consumer.kind, rtpParameters: consumer.rtpParameters });
}


export async function resumeConsumer(req: Request, res: Response) {
    const { consumerId } = req.params;

    const consumer = consumers.get(consumerId);
    if (!consumer) return res.status(400).send();

    await consumer.resume();

    return res.status(204).send();
}

export async function closeClient(req: Request, res: Response) {
    const dto: CloseSFUClientDTO = req.body;

    const sendTransport = transports.get(dto.sendTransportId);
    const recvTransport = transports.get(dto.recvTransportId);

    for (const consumerId of dto.consumerIds) {
        const consumer = consumers.get(consumerId);
        if (consumer) consumer.close();
        consumers.delete(consumerId);
    }

    for (const producerId of dto.producerIds) {
        const producer = producers.get(producerId);
        if (producer) producer.close();

        producers.delete(producerId);
        for (const [k, v] of channelProducers.entries()) {
            const filtered = v.filter(p => !dto.producerIds.includes(p.producerId));
            if (filtered.length > 0) {
                channelProducers.set(k, filtered);
            } else {
                channelProducers.delete(k);
            }
        }
    }

    sendTransport?.close();
    recvTransport?.close();

    transports.delete(dto.sendTransportId);
    transports.delete(dto.recvTransportId);

}

export async function getChannelProducers(req: Request, res: Response) {
    const { channelId } = req.params;
    const producers = channelProducers.get(channelId) ?? [];

    return res.status(200).json({ producers: producers });
}

