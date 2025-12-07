import fetch from "node-fetch";

class WeComPusher {
  constructor(corpid, corpsecret) {
    if (!corpid || !corpsecret) {
      throw new Error("corpid and corpsecret are required.");
    }
    this.corpid = corpid;
    this.corpsecret = corpsecret;
    this.accessToken = null;
    this.tokenExpiresAt = 0; 
  }

  async getAccessToken() {
    const now = Date.now();
    // 检查 token 是否仍然有效（提前 10 分钟刷新）
    if (this.accessToken && this.tokenExpiresAt > now + 600 * 1000) {
      return this.accessToken;
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.corpid.trim()}&corpsecret=${this.corpsecret.trim()}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.errcode === 0) {
        this.accessToken = data.access_token;
        // 过期时间为当前时间加上 expiresIn 秒（转换为毫秒），并留出一些余量
        this.tokenExpiresAt = now + (data.expires_in - 100) * 1000;
        console.log("Successfully fetched new access token.");
        return this.accessToken;
      } else {
        console.error("Failed to get access token from WeCom:", data.errmsg);
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        return null;
      }
    } catch (error) {
      console.error("Error fetching WeCom access token:", error);
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      return null;
    }
  }

  async sendTextCardMessage(
    agentid,
    touser,
    title,
    description,
    url = "https://",
    btntxt = "详情"
  ) {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      console.error("Failed to get access token, cannot send message.");
      return null;
    }

    const body = {
      touser: touser,
      msgtype: "textcard",
      agentid: agentid,
      textcard: {
        title: title,
        description: description,
        url: url,
        btntxt: btntxt,
      },
    };

    const apiUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.errcode === 0) {
        console.log("WeCom textcard message sent successfully.");
      } else {
        console.error("Failed to send WeCom textcard message:", result.errmsg);
      }
      return result;
    } catch (error) {
      console.error("Error sending WeCom textcard message:", error);
      return null;
    }
  }
}

export default WeComPusher;
