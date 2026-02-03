const socket = io();

const localVideo = document.getElementById("local");
const remoteVideo = document.getElementById("remote");

let localStream;
let peer;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  localVideo.srcObject = localStream;
}

socket.on("match", async () => {
  peer = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track =>
    peer.addTrack(track, localStream)
  );

  peer.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  peer.onicecandidate = e => {
    if (e.candidate) socket.emit("ice", e.candidate);
  };

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("offer", offer);
});

socket.on("offer", async offer => {
  peer = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track =>
    peer.addTrack(track, localStream)
  );

  peer.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  peer.onicecandidate = e => {
    if (e.candidate) socket.emit("ice", e.candidate);
  };

  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit("answer", answer);
});

socket.on("answer", answer => {
  peer.setRemoteDescription(answer);
});

socket.on("ice", candidate => {
  peer.addIceCandidate(candidate);
});

startCamera();
