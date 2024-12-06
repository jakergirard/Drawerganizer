export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export function validateDrawerInput(data: any): void {
    if (!data.id || typeof data.id !== 'string') {
        throw new ValidationError('Drawer ID is required and must be a string');
    }
    if (!data.size || typeof data.size !== 'string') {
        throw new ValidationError('Size is required and must be a string');
    }
    if (!data.title || typeof data.title !== 'string') {
        throw new ValidationError('Title is required and must be a string');
    }
    if (!data.positions || typeof data.positions !== 'string') {
        throw new ValidationError('Positions is required and must be a string');
    }
    if (typeof data.isRightSection !== 'boolean') {
        throw new ValidationError('isRightSection must be a boolean');
    }
    if (!data.keywords || typeof data.keywords !== 'string') {
        throw new ValidationError('Keywords is required and must be a string');
    }
    if (typeof data.spacing !== 'number' || data.spacing < 0) {
        throw new ValidationError('Spacing must be a non-negative number');
    }
}

export function validatePrinterConfigInput(data: any): void {
    if (!data.printerName || typeof data.printerName !== 'string') {
        throw new ValidationError('Printer name is required and must be a string');
    }
    if (!data.host || typeof data.host !== 'string') {
        throw new ValidationError('Host is required and must be a string');
    }
    if (!data.port || typeof data.port !== 'number' || data.port < 1 || data.port > 65535) {
        throw new ValidationError('Port must be a number between 1 and 65535');
    }
}

export function validatePartialDrawerInput(data: any): void {
    if (data.id !== undefined) {
        throw new ValidationError('ID cannot be updated');
    }
    if (data.size !== undefined && typeof data.size !== 'string') {
        throw new ValidationError('Size must be a string');
    }
    if (data.title !== undefined && typeof data.title !== 'string') {
        throw new ValidationError('Title must be a string');
    }
    if (data.positions !== undefined && typeof data.positions !== 'string') {
        throw new ValidationError('Positions must be a string');
    }
    if (data.isRightSection !== undefined && typeof data.isRightSection !== 'boolean') {
        throw new ValidationError('isRightSection must be a boolean');
    }
    if (data.keywords !== undefined && typeof data.keywords !== 'string') {
        throw new ValidationError('Keywords must be a string');
    }
    if (data.spacing !== undefined && (typeof data.spacing !== 'number' || data.spacing < 0)) {
        throw new ValidationError('Spacing must be a non-negative number');
    }
}

export function validatePartialPrinterConfigInput(data: any): void {
    if (data.id !== undefined) {
        throw new ValidationError('ID cannot be updated');
    }
    if (data.printerName !== undefined && typeof data.printerName !== 'string') {
        throw new ValidationError('Printer name must be a string');
    }
    if (data.host !== undefined && typeof data.host !== 'string') {
        throw new ValidationError('Host must be a string');
    }
    if (data.port !== undefined && (typeof data.port !== 'number' || data.port < 1 || data.port > 65535)) {
        throw new ValidationError('Port must be a number between 1 and 65535');
    }
} 