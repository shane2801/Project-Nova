-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "createdByAdminId" INTEGER;

-- CreateTable
CREATE TABLE "MaintenanceBlock" (
    "id" SERIAL NOT NULL,
    "stationIdentity" TEXT NOT NULL,
    "connectorId" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" INTEGER NOT NULL,
    "csmsBlocked" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceBlock_stationIdentity_connectorId_startAt_idx" ON "MaintenanceBlock"("stationIdentity", "connectorId", "startAt");

-- CreateIndex
CREATE INDEX "MaintenanceBlock_active_idx" ON "MaintenanceBlock"("active");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceBlock" ADD CONSTRAINT "MaintenanceBlock_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
