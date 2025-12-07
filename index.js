import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import path from "path";

class WeComPusher {
  constructor(corpid, corpsecret, agentid) {
    if (!corpid || !corpsecret) {
      throw new Error("corpid and corpsecret are required.");
    }
    this.agentid = agentid;
    this.corpid = corpid;
    this.corpsecret = corpsecret;
    this.accessToken = null;
    this.tokenExpiresAt = 0; // Unix timestamp in milliseconds
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

  async uploadMedia(filePath, type) {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      console.error("Failed to get access token, cannot upload media.");
      return null;
    }

    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }

    const form = new FormData();
    form.append("media", fs.createReadStream(filePath), {
      filename: path.basename(filePath),
    });

    const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/media/upload?access_token=${accessToken}&type=${type}`;

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
      });
      const data = await response.json();

      if (data.errcode === 0) {
        console.log(`Media uploaded successfully. Media ID: ${data.media_id}`);
        return data.media_id;
      } else {
        console.error("Failed to upload media:", data.errmsg);
        return null;
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      return null;
    }
  }

  async sendMessage(touser, msgtype, payload) {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      console.error("Failed to get access token, cannot send message.");
      return null;
    }

    const body = {
      touser: touser,
      msgtype: msgtype,
      agentid: this.agentid,
      [msgtype]: payload,
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
        console.log(`WeCom ${msgtype} message sent successfully.`);
      } else {
        console.error(
          `Failed to send WeCom ${msgtype} message:`,
          result.errmsg
        );
      }
      return result;
    } catch (error) {
      console.error(`Error sending WeCom ${msgtype} message:`, error);
      return null;
    }
  }

  async sendTextCardMessage(
    touser,
    title,
    description,
    url = "https://",
    btntxt = "详情"
  ) {
    const payload = {
      title: title,
      description: description,
      url: url,
      btntxt: btntxt,
    };
    return this.sendMessage(touser, "textcard", payload);
  }

  async sendText(touser, content) {
    const payload = {
      content: content,
    };
    return this.sendMessage(touser, "text", payload);
  }

  async sendImage(touser, filePath) {
    const media_id = await this.uploadMedia(filePath, "image");
    if (!media_id) {
      return null;
    }
    const payload = {
      media_id: media_id,
    };
    return this.sendMessage(touser, "image", payload);
  }

  async sendVoice(touser, filePath) {
    const media_id = await this.uploadMedia(filePath, "voice");
    if (!media_id) {
      return null;
    }
    const payload = {
      media_id: media_id,
    };
    return this.sendMessage(touser, "voice", payload);
  }

  async sendVideo(touser, filePath, title = "", description = "") {
    const media_id = await this.uploadMedia(filePath, "video");
    if (!media_id) {
      return null;
    }
    const payload = {
      media_id: media_id,
      title: title,
      description: description,
    };
    return this.sendMessage(touser, "video", payload);
  }

  async sendFile(touser, filePath) {
    const media_id = await this.uploadMedia(filePath, "file");
    if (!media_id) {
      return null;
    }
    const payload = {
      media_id: media_id,
    };
    return this.sendMessage(touser, "file", payload);
  }
}

export default WeComPusher;
