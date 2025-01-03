import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from 'next/image';
import { toast } from 'sonner';

import styles from './label-preview-modal.module.css';

interface LabelPreviewModalProps {
  is_open: boolean;
  on_close: () => void;
  image_data?: string;
  text: string;
}

export function LabelPreviewModal({ is_open, on_close, image_data, text }: LabelPreviewModalProps) {
  if (!is_open || !image_data) return null;
  
  const handle_print = async () => {
    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          force_print: true
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Operation failed');
      }

      toast.success('Label printed successfully');
      on_close();
    } catch (error) {
      toast.error('Operation failed. Please check your printer configuration.');
    }
  };
  
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
          <Button onClick={handle_print} className="flex-1">
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