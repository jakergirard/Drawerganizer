-- CreateTable
CREATE TABLE "PrinterConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cupsServer" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "virtualPrinting" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
); 