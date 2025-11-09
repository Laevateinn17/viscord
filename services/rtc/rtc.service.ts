
export function createConnection(onIceCandidate: (candidate: RTCIceCandidate | null) => void, onTrack: (stream: MediaStream) => void) {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun.l.google.com:5349" },
            { urls: "stun:stun1.l.google.com:3478" },
            { urls: "stun:stun1.l.google.com:5349" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:5349" },
            { urls: "stun:stun3.l.google.com:3478" },
            { urls: "stun:stun3.l.google.com:5349" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:5349" }
        ]
    })
    pc.onicecandidate = (event) => {
        onIceCandidate(event.candidate);
    };

    pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
            onTrack(stream);
        }
    };

    return pc;
}