-- CreateTable
CREATE TABLE "Drawer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "size" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT,
    "positions" TEXT NOT NULL,
    "isRightSection" BOOLEAN NOT NULL,
    "keywords" TEXT NOT NULL,
    "spacing" INTEGER NOT NULL
); 