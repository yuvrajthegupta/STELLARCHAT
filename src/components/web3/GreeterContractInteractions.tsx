import { Button, Card, FormControl, FormLabel, Input, Stack } from '@chakra-ui/react'
import { type FC, useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import 'twin.macro'
import ConversationsList from '../chat/ConversationsList'
import Conversation from '../chat/Conversation'
import { useSorobanReact } from "@soroban-react/core"
import * as StellarSdk from '@stellar/stellar-sdk';

import { scvalToString } from '@/utils/scValConversions'
import React from 'react'
import Link from 'next/link'

import { useRegisteredContract } from '@soroban-react/contracts'
import { MessageType } from '../chat/Message'

type NewMessageData = { newMessage: string ,destinationAddress:string}

function stringToScVal(title: string) {
  return StellarSdk.xdr.ScVal.scvString(title)
}

export const GreeterContractInteractions: FC = () => {
  const sorobanContext = useSorobanReact()

  const [, setFetchIsLoading] = useState<boolean>(false)
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>(false)
  const { register, handleSubmit } = useForm<NewMessageData>()
  
  // Two options are existing for fetching data from the blockchain
  // The first consists on using the useContractValue hook demonstrated in the useGreeting.tsx file
  // This hook simulate the transation to happen on the bockchain and allow to read the value from it
  // Its main advantage is to allow for updating the value display on the frontend without any additional action
  // const {isWrongConnection, fetchedGreeting} = useGreeting({ sorobanContext })
  
  // The other option, maybe simpler to understand and implement is the one implemented here
  // Where we fetch the value manually with each change of the state.
  // We trigger the fetch with flipping the value of updateFrontend or refreshing the page
  
  const [fetchedGreeting, setGreeterMessage] = useState<string>()
  const [updateFrontend, toggleUpdate] = useState<boolean>(true)
  const [contractAddressStored, setContractAddressStored] = useState<string>()

  // Retrieve the deployed contract object from contract Registry
  const contract = useRegisteredContract("chat")
  // Fetch Greeting
  const { activeChain, server, address } = sorobanContext
  const[fetchedConversationsInitiatedList,setConversationsInitiatedList]=useState<Array<string>>([])
  const [displayedConversationAddress,setDisplayedConversationAddress]=useState<string>("")
  const[displayedConversation,setDisplayedConversation]=useState<Array<MessageType>>([])
  
  const fetchGreeting = useCallback(async () => {
    if (!sorobanContext.server) return

    const currentChain = sorobanContext.activeChain?.name?.toLocaleLowerCase()
    if (!currentChain) {
      console.log("No active chain")
      toast.error('Wallet not connected. Try again…')
      return
    }
    else if(!address){
      console.log("No address connected")
      toast.error('Wallet not connected. Try again…')
      return
    }
    else {
      const contractAddress = contract?.deploymentInfo.contractAddress
      setContractAddressStored(contractAddress)
      setFetchIsLoading(true)
      try {
        const result = await contract?.invoke({
          method: 'read_conversations_initiated',
          args: [new StellarSdk.Address(address).toScVal()]
        })

        if (!result) return

        // Value needs to be cast into a string as we fetch a ScVal which is not readable as is.
        // You can check out the scValConversion.tsx file to see how it's done
        const result_array = StellarSdk.scValToNative(result as StellarSdk.xdr.ScVal)
        console.log(result_array)
        setConversationsInitiatedList(result_array)
      } catch (e) {
        console.error(e)
        toast.error('Error while fetching greeting. Try again…')
        setConversationsInitiatedList([])
      } finally {
        setFetchIsLoading(false)
      }
    }
  },[sorobanContext,contract])

  const fetchConversation = useCallback(async () => {
    if (!sorobanContext.server) return

    const currentChain = sorobanContext.activeChain?.name?.toLocaleLowerCase()
    if (!currentChain) {
      console.log("No active chain")
      toast.error('Wallet not connected. Try again…')
      return
    }
    else if(!address){
      console.log("No address connected")
      toast.error('Wallet not connected. Try again…')
      return
    }
    else if(displayedConversation){
      const contractAddress = contract?.deploymentInfo.contractAddress
      setContractAddressStored(contractAddress)
      setFetchIsLoading(true)
      try {
        const result = await contract?.invoke({
          method: 'read_conversation',
          args: [new StellarSdk.Address(address).toScVal(), new StellarSdk.Address(displayedConversationAddress).toScVal()]
        })
        console.log(address)
        console.log(displayedConversationAddress)
        if (!result) return

        // Value needs to be cast into a string as we fetch a ScVal which is not readable as is.
        // You can check out the scValConversion.tsx file to see how it's done
        const result_array = StellarSdk.scValToNative(result as StellarSdk.xdr.ScVal)
        console.log(result_array)
        setDisplayedConversation(result_array)
      } catch (e) {
        console.error(e)
        toast.error('Error while fetching greeting. Try again…')
        setDisplayedConversation([])
      } finally {
        setFetchIsLoading(false)
      }
    }
  },[sorobanContext,contract,displayedConversationAddress])

  useEffect(() => {void fetchConversation()}, [updateFrontend,fetchConversation,address,displayedConversationAddress])


  

  const updateGreeting = async ({ newMessage , destinationAddress }: NewMessageData ) => {
    if (!address) {
      console.log("Address is not defined")
      toast.error('Wallet is not connected. Try again...')
      return
    }
    else if (!server) {
      console.log("Server is not setup")
      toast.error('Server is not defined. Unabled to connect to the blockchain')
      return
    }
    else {
      const currentChain = activeChain?.name?.toLocaleLowerCase()
      if (!currentChain) {
        console.log("No active chain")
        toast.error('Wallet not connected. Try again…')
        return
      }
      else {

        setUpdateIsLoading(true)

        try {
          const result = await contract?.invoke({
            method: 'write_message',
            args: [new StellarSdk.Address(address).toScVal(),new StellarSdk.Address(destinationAddress).toScVal(),stringToScVal(newMessage)],
            signAndSend: true
          })
          
          if (result) {
            toast.success("New greeting successfully published!")
          }
          else {
            toast.error("Greeting unsuccessful...")
            
          }
        } catch (e) {
          console.error(e)
          toast.error('Error while sending tx. Try again…')
        } finally {
          setUpdateIsLoading(false)
          toggleUpdate(!updateFrontend)
        } 

        // await sorobanContext.connect();
      }
    }
  }

  return (
    <>
    <div tw="mt-10 flex w-full flex-wrap items-start justify-center gap-4">
      <div tw="flex grow flex-col space-y-4 max-w-[20rem]">
        <h2 tw="text-center font-mono text-gray-400">Chat</h2>

        {/* Fetched Greeting */}
        <ConversationsList conversationsList={fetchedConversationsInitiatedList} setConversationDisplayedAddress={setDisplayedConversationAddress}></ConversationsList>

        {/* Update Greeting */}
        <Card variant="outline" p={4} bgColor="whiteAlpha.100">
          <form onSubmit={handleSubmit(updateGreeting)}>
            <Stack direction="row" spacing={2} align="end">
              <FormControl>
                <FormLabel>Send Message</FormLabel>
                <Input disabled={updateIsLoading} {...register('destinationAddress')} />
                <Input disabled={updateIsLoading} {...register('newMessage')} />
              </FormControl>
              <Button
                type="submit"
                mt={4}
                colorScheme="purple"
                isDisabled={updateIsLoading}
                isLoading={updateIsLoading}
              >
                Submit
              </Button>
            </Stack>
          </form>
        </Card>
        </div>
        <Conversation conversation={displayedConversation}></Conversation>
        {/* Contract Address */}
        {/* <p tw="text-center font-mono text-xs text-gray-600">
          
          {contractAddressStored ? <Link href={"https://stellar.expert/explorer/testnet/contract/" + contractAddressStored} target="_blank">{contractAddressStored}</Link> : "Loading address.."}
        </p> */}
      </div>
    </>
  )
}