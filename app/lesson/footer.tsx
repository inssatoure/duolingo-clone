import { CheckCircle, XCircle } from "lucide-react";
import { useKey, useMedia } from "react-use";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

type FooterProps = {
  onCheck: () => void;
  status: "correct" | "wrong" | "none" | "completed";
  disabled?: boolean;
  lessonId?: number;
};

export const Footer = ({
  onCheck,
  status,
  disabled,
  lessonId,
}: FooterProps) => {
  useKey("Enter", onCheck, {}, [onCheck]);
  const isMobile = useMedia("(max-width: 1024px)");
  const { t } = useLocale();

  return (
    <footer
      className={cn(
        "h-[100px] border-t-2 lg:h-[140px]",
        status === "correct" && "border-transparent bg-green-100",
        status === "wrong" && "border-transparent bg-rose-100"
      )}
    >
      <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-6 lg:px-10">
        {status === "correct" && (
          <div className="flex items-center text-base font-bold text-green-500 lg:text-2xl">
            <CheckCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
            {t.nicelyDone}
          </div>
        )}

        {status === "wrong" && (
          <div className="flex items-center text-base font-bold text-rose-500 lg:text-2xl">
            <XCircle className="mr-4 h-6 w-6 lg:h-10 lg:w-10" />
            {t.tryAgain}
          </div>
        )}

        {status === "completed" && (
          <Button
            variant="default"
            size={isMobile ? "sm" : "lg"}
            onClick={() => (window.location.href = `/lesson/${lessonId}`)}
          >
            {t.practiceAgain}
          </Button>
        )}

        <Button
          disabled={disabled}
          aria-disabled={disabled}
          className="ml-auto"
          onClick={onCheck}
          size={isMobile ? "sm" : "lg"}
          variant={status === "wrong" ? "danger" : "secondary"}
        >
          {status === "none" && t.check}
          {status === "correct" && t.next}
          {status === "wrong" && t.retry}
          {status === "completed" && t.continue}
        </Button>
      </div>
    </footer>
  );
};
