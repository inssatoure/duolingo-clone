import Image from "next/image";

import { Speakable } from "@/components/speakable";

type QuestionBubbleProps = {
  question: string;
  onReplay?: () => void;
};

export const QuestionBubble = ({ question, onReplay }: QuestionBubbleProps) => {
  return (
    <div className="mb-6 flex items-center gap-x-4">
      <Image
        src="/mascot.png"
        alt="Mascot"
        height={60}
        width={60}
        className="hidden lg:block"
      />
      <Image
        src="/mascot.png"
        alt="Mascot"
        height={40}
        width={40}
        className="block lg:hidden"
      />

      <div className="relative flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm lg:text-base">
        {question}
        <Speakable text={question} onPlay={onReplay} />

        <div
          className="absolute -left-3 top-1/2 h-0 w-0 -translate-y-1/2 rotate-90 transform border-x-8 border-t-8 border-x-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
};
