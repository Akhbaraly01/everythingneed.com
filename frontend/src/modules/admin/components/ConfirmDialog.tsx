import { useState, type ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirm",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {variant === "destructive" && (
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-slate-100">{title}</DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2 flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className={variant !== "destructive" ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
