import WeComPusher from "./index.js";

const corpid = "您的企业ID";
const corpsecret = "您的应用Secret";

const pusher = new WeComPusher(corpid, corpsecret);

(async () => {
  const agentid = "您的应用AgentId";
  const touser = "@all";
  const title = "早上好提醒！";
  const description = `今天天气晴朗，适合外出。`;
  const redirectUrl = "https://example.com/more-info";

  const result = await pusher.sendTextCardMessage(
    agentid,
    touser,
    title,
    description,
    redirectUrl
  );

  if (result && result.errcode === 0) {
    console.log("消息发送成功！");
  } else {
    console.error("消息发送失败。");
  }
})();
