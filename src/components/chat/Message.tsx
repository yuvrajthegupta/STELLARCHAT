import { Box, Text } from "@chakra-ui/react";
export type MessageType={
    msg:string,
    from:string
}

interface MessageProps{
    message:MessageType
}
export function Message({message}:MessageProps){
    return(
        <>
        
        <Box ml='3' borderRadius="12" padding="4" margin="4" position="relative" >
                <Text fontWeight='bold' fontSize={12}>
                {message.from}
                </Text>
                <Text fontSize='sm'>{message.msg}</Text>
            </Box>
        </>
    )
}