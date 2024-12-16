import { useState, ChangeEvent } from 'react';
import styles from './print-dialog.module.css';
import Image from 'next/image'

interface PrintDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrintDialog({ isOpen, onClose }: PrintDialogProps) {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPrinted, setIsPrinted] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePrint = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    preview: showPreview
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to print');
            }

            if (data.imageData && showPreview) {
                setPreviewImage(data.imageData);
            } else {
                setIsPrinted(true);
                setTimeout(() => {
                    setIsPrinted(false);
                    onClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Print error:', error);
            setError(error instanceof Error ? error.message : 'Failed to print');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreviewPrint = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    preview: false
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to print');
            }

            setIsPrinted(true);
            setTimeout(() => {
                setIsPrinted(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Print error:', error);
            setError(error instanceof Error ? error.message : 'Failed to print');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setText('');
        setPreviewImage(null);
        setShowPreview(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Print Label</h2>
                    <button className={styles.closeButton} onClick={handleClose}>&times;</button>
                </div>
                <div className={styles.body}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Enter text to print"
                        value={text}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
                    />
                    <button
                        className={`${styles.button} ${styles.previewButton}`}
                        onClick={() => setShowPreview(!showPreview)}
                        style={{ fontFamily: 'Arial' }}
                    >
                        Print Preview: {showPreview ? 'ON' : 'OFF'}
                    </button>
                    {error && <div className={styles.error}>{error}</div>}
                    {showPreview && previewImage && (
                        <div className={styles.preview}>
                            <Image 
                                src={previewImage}
                                alt="Label preview"
                                width={100}
                                height={100}
                                priority
                            />
                            <button
                                className={`${styles.button} ${styles.printButton}`}
                                onClick={handlePreviewPrint}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Printing...' : 'Print'}
                            </button>
                        </div>
                    )}
                </div>
                <div className={styles.footer}>
                    {!showPreview && (
                        <button
                            className={`${styles.button} ${styles.printButton}`}
                            onClick={handlePrint}
                            disabled={isLoading || !text.trim()}
                        >
                            {isLoading ? 'Printing...' : isPrinted ? 'Printed!' : 'Print'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} 