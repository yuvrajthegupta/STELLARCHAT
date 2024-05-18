import Image from 'next/image'
import Link from 'next/link'
import githubIcon from 'public/icons/github-button.svg'
import type { FC } from 'react'
import 'twin.macro'
import tw, { styled } from 'twin.macro'

const StyledIconLink = styled(Link)(() => [
  tw`opacity-90 transition-all hover:(-translate-y-0.5 opacity-100)`,
])

export const HomePageTitle: FC = () => {
  const title = 'STELLAR CHAT'
  const desc = 'A chat decentralised application made on soroban '
  

  return (
    <>
      <div tw="flex flex-col items-center text-center font-mono">
        
          <h1 tw="font-black text-[2.5rem]">{title}</h1>
        

        
        <p tw="mt-4 mb-6 text-gray-400">{desc}</p>

        
        <div tw="my-14 w-14 bg-gray-800 h-[2px]" />
      </div>
    </>
  )
}
