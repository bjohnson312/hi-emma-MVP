import { Service } from "encore.dev/service";
import "./scheduler";
import "./correlate_replies";
import "./send_day_now";

export default new Service("challenges");
