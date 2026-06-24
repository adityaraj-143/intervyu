export interface Message {
  timestamp: Date;
  content: string;
  sender: "interviewee" | "interviewer";
}

export class Conversation {
  messages: Message[] = [];

  addMessage(content: string, sender: "interviewee" | "interviewer") {
    this.messages.push({ timestamp: new Date(), content, sender });
  }
}