

import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDvGD_yf63chxX41uYp8Wv04IQ1-HKsR9w",
  authDomain: "webrtcdemo-4b9f9.firebaseapp.com",
  projectId: "webrtcdemo-4b9f9",
  storageBucket: "webrtcdemo-4b9f9.appspot.com",
  messagingSenderId: "598398284083",
  appId: "1:598398284083:web:cbe275a7a73632bb9fce46",
  measurementId: "G-WNDL3CLCZ7"
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);

// RTCDataChannel
let dataChannel;

// HTML elements


const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
// const answerButton = document.getElementById('answerButton');
const submitButton = document.getElementById('submitButton');
const localTextArea = document.getElementById('localTextArea');

// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  dataChannel = pc.createDataChannel('chat');
  setupDataChannel();
  const callDoc = firestore.collection('hv_calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

};

// // 3. Answer the call with the unique ID
// answerButton.onclick = async () => {
//   pc.ondatachannel = event => {
//     dataChannel = event.channel;
//     setupDataChannel();
//   }
//   const callId = callInput.value;
//   const callDoc = firestore.collection('calls').doc(callId);
//   const answerCandidates = callDoc.collection('answerCandidates');
//   const offerCandidates = callDoc.collection('offerCandidates');

//   pc.onicecandidate = (event) => {
//     event.candidate && answerCandidates.add(event.candidate.toJSON());
//   };

//   const callData = (await callDoc.get()).data();

//   const offerDescription = callData.offer;
//   await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

//   const answerDescription = await pc.createAnswer();
//   await pc.setLocalDescription(answerDescription);

//   const answer = {
//     type: answerDescription.type,
//     sdp: answerDescription.sdp,
//   };

//   await callDoc.update({ answer });

//   offerCandidates.onSnapshot((snapshot) => {
//     snapshot.docChanges().forEach((change) => {
//       console.log(change);
//       if (change.type === 'added') {
//         let data = change.doc.data();
//         pc.addIceCandidate(new RTCIceCandidate(data));
//       }
//     });
//   });
// };

submitButton.onclick = async() => {
  console.log(localTextArea.value);
  console.log(localTextArea.value.toString());
  dataChannel.send(localTextArea.value.toString());
}

function setupDataChannel() {
  checkDataChannelState();
  dataChannel.onopen = checkDataChannelState;
  dataChannel.onclose = checkDataChannelState;
  dataChannel.onmessage = event =>
    insertMessageToDOM(event.data)
}

function checkDataChannelState() {
  console.log('WebRTC channel state is:', dataChannel.readyState);
  if (dataChannel.readyState === 'open') {
    insertMessageToDOM('WebRTC data channel is now open');
  }
}


function insertMessageToDOM(str) {
  document.getElementById('remoteTextArea').innerText = str;
}