import type { ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  size?: ModalSize;
  hideFooter?: boolean;
}

const sizeMap: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  isLoading = false,
  size = "md",
  hideFooter = false,
}: FormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && onOpenChange(v)}>
      <DialogContent
        className={cn(
          "bg-slate-900 border-slate-700 text-slate-100 max-h-[90vh] flex flex-col",
          sizeMap[size]
        )}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-slate-100">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-slate-400">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-4">
          {children}
        </div>

        {!hideFooter && (
          <DialogFooter className="flex-shrink-0 flex gap-2 border-t border-slate-700/50 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            >
              Cancel
            </Button>
            {onSubmit && (
              <Button
                onClick={onSubmit}
                disabled={isLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {submitLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
