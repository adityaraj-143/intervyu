import { DeepgramClient,  } from "@deepgram/sdk";


class DeepgramService {

    client: DeepgramClient;
    connection: any;

    constructor() {
        this.client = new DeepgramClient();
        
    }
}