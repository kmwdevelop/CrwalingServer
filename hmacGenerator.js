import crypto from "crypto";
import moment from "moment";

export const generateHmac = (method, url, secretKey, accessKey) => {
  const [path, query = ""] = url.split(/\?/);

  const datetime = moment.utc().format("YYMMDD[T]HHmmss[Z]");
  const message = `${datetime}${method}${path}${query}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
};
