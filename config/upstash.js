import { Client as WorkflowClient } from "@upstash/qstash";
import {QSTASH_URL, QSTASH_TOKEN} from "./env.js";

export const workFlowClient = new WorkflowClient({
    baseUrl: QSTASH_URL,
    token: QSTASH_TOKEN,
})