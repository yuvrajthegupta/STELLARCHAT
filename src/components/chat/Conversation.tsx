import { Message, type MessageType } from "./Message";
import { Card } from "@chakra-ui/react";
interface ConversationProps{
    conversation :Array<MessageType>
}

export default function Conversation({conversation}:ConversationProps){
    return (<>
    <Card variant="outline" p={4} bgColor="whiteAlpha.100">
    {conversation.map((message : MessageType, index: number)=>(
        <Message key={index} message={message}></Message>
    ))}
    </Card>
    </>
    )
}