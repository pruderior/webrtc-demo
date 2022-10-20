const firebase = require("firebase");
const { RTCSessionDescription, RTCIceCandidate } = require("wrtc");

const firebaseConfig = {
  apiKey: "AIzaSyDvGD_yf63chxX41uYp8Wv04IQ1-HKsR9w",
  authDomain: "webrtcdemo-4b9f9.firebaseapp.com",
  projectId: "webrtcdemo-4b9f9",
  storageBucket: "webrtcdemo-4b9f9.appspot.com",
  messagingSenderId: "598398284083",
  appId: "1:598398284083:web:cbe275a7a73632bb9fce46",
  measurementId: "G-WNDL3CLCZ7",
};
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const RTCPeerConnection = require("wrtc").RTCPeerConnection;
const pc = new RTCPeerConnection(servers);

// RTCDataChannel
let dataChannel;

// HTML elements

let stopCalling = false;
// 3. Answer the call with the unique ID
const answerFunc = async () => {
  pc.ondatachannel = (event) => {
    dataChannel = event.channel;
    setupDataChannel();
  };
  const allHvCalls = await firestore.collection("hv_calls").get();
  console.log(allHvCalls);
  allHvCalls.docs.forEach((doc) => {
    if (!stopCalling) callFunc(doc.id);
  });
};

const callFunc = async (callId) => {
  console.log("docId");
  console.log(callId);
  const callDoc = firestore.collection("hv_calls").doc(callId);
  const answerCandidates = callDoc.collection("answerCandidates");
  const offerCandidates = callDoc.collection("offerCandidates");
  pc.onicecandidate = (event) => {
    event.candidate &&
      answerCandidates.add(JSON.parse(JSON.stringify(event.candidate)));
  };

  const callData = (await callDoc.get()).data();

  console.log(callData);

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === "added") {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  // Listen for connectionstatechange on the local RTCPeerConnection
  pc.addEventListener("connectionstatechange", (event) => {
    console.log(pc.connectionState);
    if (pc.connectionState === "connected") {
      // Peers connected!
      stopCalling = true;
    }
  });
};

function setupDataChannel() {
  checkDataChannelState();
  dataChannel.onopen = checkDataChannelState;
  dataChannel.onclose = checkDataChannelState;
  dataChannel.onmessage = (event) => insertMessageToDOM(event.data);
}

function checkDataChannelState() {
  console.log("WebRTC channel state is:", dataChannel.readyState);
  if (dataChannel.readyState === "open") {
    insertMessageToDOM("WebRTC data channel is now open");
  }
}

function insertMessageToDOM(str) {
  console.log(str);
  dataChannel.send("receive!");
}

answerFunc();
