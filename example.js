import WeComPusher from "wecom-app-pusher";

const corpid = "xxx";
const corpsecret = "xxx";
const agentid = "1000001";

const pusher = new WeComPusher(corpid, corpsecret, agentid);

(async () => {
  const touser = "yiiko";
  const title = "早上好提醒！";
  const description = `今天天气晴朗，适合外出。`;
  const redirectUrl = "https://example.com/more-info";

  await pusher.sendTextCardMessage(touser, title, description, redirectUrl);
  await pusher.sendText(touser, description);
  await pusher.sendImage(touser, "D:/Temp/a.png");
  await pusher.sendFile(touser, "D:/Temp/a.docx");
})();
