-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "transferredFromUserId" INTEGER;

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferRequest_toUserId_status_idx" ON "TransferRequest"("toUserId", "status");

-- CreateIndex
CREATE INDEX "TransferRequest_fromUserId_status_idx" ON "TransferRequest"("fromUserId", "status");

-- CreateIndex
CREATE INDEX "TransferRequest_bookingId_idx" ON "TransferRequest"("bookingId");

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
