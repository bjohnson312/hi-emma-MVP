import { Service } from "encore.dev/service";
import { Gateway } from "encore.dev/api";
import { auth } from "../auth/session";

// Use the session-based auth handler
export const gw = new Gateway({ authHandler: auth });

export default new Service("api_v2_gateway");
