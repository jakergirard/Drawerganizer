import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface LabelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData?: string;
  onPrint: () => void;
}

export function LabelPreviewModal({ isOpen, onClose, imageData, onPrint }: LabelPreviewModalProps) {
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Label Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {imageData && (
            <img 
              src={imageData} 
              alt="Label Preview" 
              className="w-full border border-gray-200 rounded"
            />
          )}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={onPrint} className="flex-1">
            Print
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 