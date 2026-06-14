import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();

async function main() {
  await db.booking.deleteMany();
  await db.bookingRule.deleteMany();
  await db.user.deleteMany();

const passwordHash = await bcrypt.hash("evolve123", 10);

await db.user.createMany({
  data: [
   {
  email: "alice@accenture.com",
  passwordHash,
  name: "Alice Dubois",
  rfidTag: "RFID-EMP-0001",
  department: "Technology",
  jobTitle: "Software Engineer",
  employeeId: "EMP-0001",
  joinedAt: new Date("2021-03-15"),
  privacyAckAt: new Date(),
  carMake: "Tesla",
  carModel: "Model 3",
  carYear: 2022,
  carPlate: "MU 1234 AB",
  role: "user",
},
  ],
});
  await db.bookingRule.createMany({
    data: [
      { key: "daily_minutes_per_user", value: "60" },
      { key: "slot_duration_minutes", value: "60" },
      { key: "booking_window_days", value: "1" },
    ],
  });

  console.log("Seed done.");
}

main().finally(() => db.$disconnect());