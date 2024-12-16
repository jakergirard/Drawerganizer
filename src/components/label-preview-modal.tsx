import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from 'next/image';

import styles from './label-preview-modal.module.css';

interface LabelPreviewModalProps {
  is_open: boolean;
  on_close: () => void;
  image_data?: string;
  on_print: () => void;
}

export function LabelPreviewModal({ is_open, on_close, image_data, on_print }: LabelPreviewModalProps) {
  if (!is_open || !image_data) return null;
  
  return (
    <Dialog open={is_open} onOpenChange={on_close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Label Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <Image
            src={image_data}
            alt="Label preview"
            width={300}
            height={150}
            priority
            className="w-full border border-gray-200 rounded"
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={on_print} className="flex-1">
            Print
          </Button>
          <Button variant="outline" onClick={on_close}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 