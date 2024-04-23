/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/bUJpWsYlvnY
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

/** DONE: Add fonts into your Next.js project:

import { Roboto } from 'next/font/google'
import { Inter } from 'next/font/google'

roboto({
  subsets: ['latin'],
  display: 'swap',
})

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/

/** Add border radius CSS variable to your global CSS:

:root {
  --radius: 0.5rem;
}
**/
import { SVGProps } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";

export function AudioReader() {
  return (
    // could use gap- of py- to space the elements
    <div className="flex flex-col h-full gap-2 border border-green-500">
      <AudioSelector />
      <div className="flex-grow h-full border border-red-500">
        <TranscriptArea />
      </div>
      <MediaControls />
    </div>
  );
}
function MediaControls() {
  return (
    <div className="flex items-center justify-between border border-yellow-500">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost">
          <VolumeIcon className="w-4 h-4" />
          <span className="sr-only">Volume</span>
        </Button>
        <Slider
          aria-label="Volume"
          className="w-[120px]"
          defaultValue={[50]}
          max={100}
          step={1}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost">
          <RewindIcon className="w-4 h-4" />
          <span className="sr-only">Rewind</span>
        </Button>
        <Button size="icon" variant="ghost">
          <PlayIcon className="w-4 h-4" />
          <span className="sr-only">Play</span>
        </Button>
        <Button size="icon" variant="ghost">
          <FastForwardIcon className="w-4 h-4" />
          <span className="sr-only">Fast forward</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Slider
          aria-label="Audio Position"
          className="w-[120px]"
          defaultValue={[30]}
          max={100}
          step={1}
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          1:30 / 3:45
        </span>
      </div>
    </div>
  );
}

function TranscriptArea() {
  const numFillerLines = 6;
  return (
    <div className="flex flex-col">
      <h4 className="mb-2 text-lg font-medium leading-none">Full Transcript</h4>
      <ScrollArea className="flex-grow border rounded-md">
        <div className="p-0 text-sm">
          <p>
            This is the full transcript of the audio. It includes all the spoken
            words and any relevant context or descriptions.
          </p>
          <p>
            The transcript is displayed in a scrollable area to ensure it
            remains readable and accessible, even on smaller screens.
          </p>
          {Array.from({ length: numFillerLines }, (_, i) => (
            <p key={i}>
              Filler line {i + 1} has much to say about nothing in particular.
            </p>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function AudioSelector() {
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="justify-start w-full" variant="outline">
            <FileAudioIcon className="w-4 h-4 mr-2" />
            Select Audio
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem>
            <FileAudioIcon className="w-4 h-4 mr-2" />
            Audio 1
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileAudioIcon className="w-4 h-4 mr-2" />
            Audio 2
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileAudioIcon className="w-4 h-4 mr-2" />
            Audio 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface FastForwardIconProps extends SVGProps<SVGSVGElement> {}

function FastForwardIcon(props: FastForwardIconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 19 22 12 13 5 13 19" />
      <polygon points="2 19 11 12 2 5 2 19" />
    </svg>
  );
}

interface FileAudioIconProps extends SVGProps<SVGSVGElement> {}

function FileAudioIcon(props: FileAudioIconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 22h.5c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4V7.5L14.5 2H6c-.5 0-1 .2-1.4.6C4.2 3 4 3.5 4 4v3" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 20v-1a2 2 0 1 1 4 0v1a2 2 0 1 1-4 0Z" />
      <path d="M6 20v-1a2 2 0 1 0-4 0v1a2 2 0 1 0 4 0Z" />
      <path d="M2 19v-3a6 6 0 0 1 12 0v3" />
    </svg>
  );
}

interface PlayIconProps extends SVGProps<SVGSVGElement> {}

function PlayIcon(props: PlayIconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

interface RewindIconProps extends SVGProps<SVGSVGElement> {}

function RewindIcon(props: RewindIconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 19 2 12 11 5 11 19" />
      <polygon points="22 19 13 12 22 5 22 19" />
    </svg>
  );
}

interface VolumeIconProps extends SVGProps<SVGSVGElement> {}

function VolumeIcon(props: VolumeIconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    </svg>
  );
}
