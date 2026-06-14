-- CreateTable
CREATE TABLE "ChargingSession" (
    "id" SERIAL NOT NULL,
    "csmsSessionId" INTEGER,
    "userId" INTEGER NOT NULL,
    "stationIdentity" TEXT NOT NULL,
    "connectorId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "stopTime" TIMESTAMP(3),
    "energyWh" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "userNameSnap" TEXT NOT NULL,
    "userEmailSnap" TEXT NOT NULL,
    "departmentSnap" TEXT,
    "jobTitleSnap" TEXT,
    "employeeIdSnap" TEXT,
    "carMakeSnap" TEXT,
    "carModelSnap" TEXT,
    "carYearSnap" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'real',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChargingSession_csmsSessionId_key" ON "ChargingSession"("csmsSessionId");

-- CreateIndex
CREATE INDEX "ChargingSession_userId_idx" ON "ChargingSession"("userId");

-- CreateIndex
CREATE INDEX "ChargingSession_startTime_idx" ON "ChargingSession"("startTime");

-- CreateIndex
CREATE INDEX "ChargingSession_stationIdentity_idx" ON "ChargingSession"("stationIdentity");

-- CreateIndex
CREATE INDEX "ChargingSession_carMakeSnap_idx" ON "ChargingSession"("carMakeSnap");

-- CreateIndex
CREATE INDEX "ChargingSession_departmentSnap_idx" ON "ChargingSession"("departmentSnap");

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
