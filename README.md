# webrtc-demo

- webrtc-hv is a demo for hv node, creating an offer.
- webrtc-simple-node is a demo for normal node, answering an offer from a brower or a node(node-only.js).

使用方法：
先启动webrtc-hv，在web界面点击create offer。这时会将生成的链接Id上传的到signaling数据库。
node执行webrtc-simple-node/node-only.js，这时候会和存在的hv建立链接，回到hv的web端，发送信息，点击submit按钮，node-only.js可以收到消息，并且发送receive。
