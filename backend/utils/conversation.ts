class Message {
    timestamp: Date;
    content: string;
    sender: "interviewee" | "interviewer";

    constructor(content: string, sender: "interviewee" | "interviewer") {
        this.timestamp = new Date();
        this.content = content;
        this.sender = sender;
    }
}

export class Conversation {
    messages: Message[];

    constructor() {
        this.messages = [];
    }

    addMessage(content: string, sender: "interviewee" | "interviewer") {
        const newMessage = new Message(content, sender);
        this.messages.push(newMessage);
    }

}