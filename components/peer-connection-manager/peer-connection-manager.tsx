import { useVoiceEvents } from "@/app/(auth)/hooks/socket-events";
import { useAppSettingsStore } from "@/app/stores/app-settings-store";
import { usePlaySound } from "@/app/stores/audio-store";
import { useCurrentUserStore } from "@/app/stores/current-user-store";
import { useMediasoupStore } from "@/app/stores/mediasoup-store";
import { useSocketStore } from "@/app/stores/socket-store";
import { useGetChannelVoiceStates } from "@/app/stores/voice-state-store";
import { CONNECT_TRANSPORT, CREATE_CONSUMER, CREATE_PRODUCER, CREATE_RTC_ANSWER, CREATE_RTC_OFFER, CREATE_SEND_TRANSPORT, CREATE_RECV_TRANSPORT, VOICE_UPDATE_EVENT, RESUME_CONSUMER, CLOSE_SFU_CLIENT, JOIN_ROOM, CREATE_TRANSPORT, GET_PRODUCERS, PRODUCER_JOINED, ACTIVE_SPEAKER_STATE } from "@/constants/events";
import { useSocket } from "@/contexts/socket.context";
import { VoiceEventType } from "@/enums/voice-event-type";
import { ActiveSpeakerState } from "@/interfaces/active-speaker-state";
import { CloseSFUClientDTO } from "@/interfaces/dto/close-sfu-client.dto";
import { ConsumerCreatedDTO } from "@/interfaces/dto/consumer-created.dto";
import { CreateConsumerDTO } from "@/interfaces/dto/create-consumer.dto";
import { CreateProducerDTO } from "@/interfaces/dto/create-producer.dto";
import { ProducerCreatedDTO } from "@/interfaces/dto/producer-created.dto";
import { VoiceEventDTO } from "@/interfaces/dto/voice-event.dto";
import { Device } from "mediasoup-client";
import { ConsumerOptions, RtpCapabilities, Transport } from "mediasoup-client/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { GiConsoleController } from "react-icons/gi";
import { io } from "socket.io-client";

export function PeerConnectionManager() {
    const { socket } = useSocket();
    const audioRef = useRef<HTMLAudioElement>(null);
    const { mediaSettings } = useAppSettingsStore();
    const { socket: peerSocket, updateActiveSpeakers, setSocket, setDevice, setSendTransport, setRecvTransport, setReady } = useMediasoupStore()
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = mediaSettings.outputVolume / 100;
    }, [mediaSettings.outputVolume])

    useEffect(() => {
        // let pc = usePeerConnectionStore.getState().peerConnection;
        // if (!pc) return;

        // navigator.mediaDevices.getUserMedia({
        //     audio: { deviceId: { exact: mediaSettings.audioInputDeviceId } }
        // }).then(stream => {
        //     const newAudioTrack = stream.getAudioTracks()[0];
        //     const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
        //     if (sender) {
        //         sender.replaceTrack(newAudioTrack);
        //     }
        // });
    }, [mediaSettings.audioInputDeviceId]);

    async function startVAD() {
        const { mediaSettings } = useAppSettingsStore.getState();
        const { socket } = useMediasoupStore.getState();
        const {user} = useCurrentUserStore.getState();
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: mediaSettings.audioInputDeviceId } }
        })
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Float32Array(analyser.fftSize);

        let speaking = false;
        let lastSpokeTime = 0;
        const SPEAK_THRESHOLD = 0.01;
        const STOP_DELAY = 300;

        function checkVolume() {
            analyser.getFloatTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);

            const now = Date.now();
            if (rms > SPEAK_THRESHOLD) {
                lastSpokeTime = now;
                if (!speaking) {
                    speaking = true;
                    console.log(user.id, updateActiveSpeakers);
                    updateActiveSpeakers(user.id, true);
                    socket?.emit(ACTIVE_SPEAKER_STATE, { speaking: true } as ActiveSpeakerState);
                }
            } else {
                if (speaking && now - lastSpokeTime > STOP_DELAY) {
                    speaking = false;
                    updateActiveSpeakers(user.id, false);
                    socket?.emit(ACTIVE_SPEAKER_STATE, { speaking: false } as ActiveSpeakerState);
                }
            }

            requestAnimationFrame(checkVolume);
        }

        requestAnimationFrame(checkVolume);
    }



    const setupJoinCall = (channelId: string) => {
        if (peerSocket) return;

        const socket = io(process.env.NEXT_PUBLIC_SFU_SERVER);
        const user = useCurrentUserStore.getState().user;
        setSocket(socket);

        const onRoomJoined = async ({ rtpCapabilities }: { rtpCapabilities: RtpCapabilities }) => {
            startVAD();
            console.log('room ', rtpCapabilities)
            const device = new Device();
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            setDevice(device, channelId);

            socket.emit(CREATE_TRANSPORT, onCreateSendTransport);
            socket.emit(CREATE_TRANSPORT, onCreateRecvTransport);
        };

        socket.on('connect_error', (e) => console.log('connect error', e));
        socket.on('connect', () => {
            socket.emit(JOIN_ROOM, { channelId, userId: user.id }, onRoomJoined);
        });
    }

    const onGetChannelProducers = ({ producers }: { producers: { userId: string, producerId: string }[] }) => {
        for (const producer of producers) {
            createConsumer({ producerId: producer.producerId, userId: producer.userId });
        }
    }


    const handleVoiceStateUpdate = async (event: VoiceEventDTO) => {
        const voiceStates = useGetChannelVoiceStates(event.channelId);
        const user = useCurrentUserStore.getState().user;
        if (event.type == VoiceEventType.VOICE_LEAVE) {
            if (event.userId === user?.id) {
                closeClient();
            }
            usePlaySound('voice-leave');
        }
        else if (event.type === VoiceEventType.VOICE_JOIN) {
            if (event.userId === user?.id) {
                setupJoinCall(event.channelId);
            }

            if (event.userId === user?.id || event.channelId === voiceStates.find(vs => vs.userId === user?.id)?.channelId) {
                usePlaySound('voice-join');
            }
        }
    }

    const onCreateSendTransport = async (payload: any) => {
        const { socket, device, addProducer, channelId } = useMediasoupStore.getState();
        if (!device) return;
        const transport = device.createSendTransport(payload);
        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            console.log('send transport connected', socket);
            try {
                socket?.emit(CONNECT_TRANSPORT, {
                    transportId: transport.id,
                    dtlsParameters
                }, callback);
            } catch (err) {
                console.log(err)
            }
        });
        transport.on('connectionstatechange', (e) => console.log(e));

        transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            try {
                socket?.emit(CREATE_PRODUCER, {
                    transportId: transport.id,
                    channelId: channelId,
                    kind,
                    rtpParameters,
                } as CreateProducerDTO, (producerId: string) => {
                    callback({ id: producerId });
                });
            } catch (err) {
                console.log(err);
            }
        });
        setSendTransport(transport);

        try {
            const inputId = useAppSettingsStore.getState().mediaSettings.audioInputDeviceId;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: inputId ? { exact: inputId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const [track] = stream.getAudioTracks();
            if (!track) {
                throw new Error('No audio track found in stream');
            }
            console.log('producee');
            const producer = await transport.produce({ track: track });

            addProducer(producer.id, producer);
        }
        catch (error) {
            console.error('Error creating producer:', error);
        }
    }

    const onCreateRecvTransport = (payload: any) => {
        const { socket, device, channelId } = useMediasoupStore.getState();
        if (!device) return;
        const transport = device.createRecvTransport(payload);
        transport.on('connect', async ({ dtlsParameters }, callback) => {
            console.log('recv transport is connected')
            try {
                socket?.emit(CONNECT_TRANSPORT, {
                    transportId: transport.id,
                    dtlsParameters
                }, callback);
            } catch (err) {
                console.log(err)
            }
        });
        setRecvTransport(transport);

        if (channelId) {
            socket?.emit(GET_PRODUCERS, onGetChannelProducers);
        }
    }


    const createConsumer = async (payload: ProducerCreatedDTO) => {
        const { socket, device, recvTransport } = useMediasoupStore.getState();
        const user = useCurrentUserStore.getState().user;
        console.log(device, recvTransport);
        if (!device || !recvTransport) return;
        if (payload.userId !== user?.id) {
            socket?.emit(CREATE_CONSUMER, {
                transportId: recvTransport.id,
                producerId: payload.producerId,
                rtpCapabilities: device.rtpCapabilities
            } as CreateConsumerDTO, onConsumerCreated);
        }
    }

    const onConsumerCreated = async (payload: ConsumerCreatedDTO) => {
        const { socket, recvTransport, addConsumer } = useMediasoupStore.getState();
        if (!recvTransport) {
            console.error('No receive transport available for consumer creation');
            return;
        }

        try {
            const consumer = await recvTransport.consume({
                id: payload.id,
                producerId: payload.producerId,
                kind: payload.kind,
                rtpParameters: payload.rtpParameters
            });

            if (audioRef.current) {
                const stream = new MediaStream([consumer.track]);
                audioRef.current.srcObject = stream;
                audioRef.current.autoplay = true;
                audioRef.current.muted = false;

            } else {
                console.error('Audio element not found');
            }

            socket?.emit(RESUME_CONSUMER, { consumerId: consumer.id }, () => {
                consumer.resume();
            });

            addConsumer(consumer.id, consumer);

        } catch (error) {
            console.error('Error creating consumer:', error);
        }
    }

    const closeClient = () => {
        const { socket, cleanup } = useMediasoupStore.getState();
        console.log('closing client', socket);

        socket?.emit(CLOSE_SFU_CLIENT);
        cleanup();
    }

    const handleBeforeUnload = useCallback(() => {
        const socket = useSocketStore.getState().socket;
        const { socket: peerSocket, channelId } = useMediasoupStore.getState();
        socket?.emit(VOICE_UPDATE_EVENT, { channelId, type: VoiceEventType.VOICE_LEAVE });
        console.log(socket, peerSocket, channelId);

        closeClient();
    }, [socket]);

    const onActiveSpeaker = (payload: ActiveSpeakerState) => {
        console.log('active speaker updated');
        updateActiveSpeakers(payload.userId, payload.speaking);
    }

    useEffect(() => {
        if (!socket) return;
        socket.on(VOICE_UPDATE_EVENT, handleVoiceStateUpdate);
        setReady(true);
        return () => {
            socket?.removeListener(VOICE_UPDATE_EVENT, handleVoiceStateUpdate);
        }
    }, [socket]);

    useEffect(() => {
        if (!peerSocket) return;
        peerSocket.on(PRODUCER_JOINED, createConsumer);
        peerSocket.on(ACTIVE_SPEAKER_STATE, onActiveSpeaker);

        return () => {
            peerSocket.removeListener(PRODUCER_JOINED, createConsumer);
            peerSocket.removeListener(ACTIVE_SPEAKER_STATE, onActiveSpeaker);
        }
    }, [peerSocket])



    useEffect(() => {
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            console.log('beforeunload listener removed');
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (
        <audio ref={audioRef} autoPlay playsInline />
    );
}