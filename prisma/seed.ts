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
        role: "user",
        department: "Technology",
        jobTitle: "Software Engineer",
        employeeId: "EMP-0001",
        joinedAt: new Date("2021-03-15"),
        privacyAckAt: new Date(),
        carMake: "Tesla",
        carModel: "Model 3",
        carYear: 2022,
        carPlate: "MU 1234 AB",
      },
      {
        email: "bob@accenture.com",
        passwordHash,
        name: "Bob Ramphul",
        rfidTag: "RFID-EMP-0002",
        role: "user",
        department: "Technology",
        jobTitle: "Senior Engineer",
        employeeId: "EMP-0002",
        joinedAt: new Date("2018-07-01"),
        privacyAckAt: new Date(),
        carMake: "BMW",
        carModel: "i4",
        carYear: 2023,
        carPlate: "MU 5678 CD",
      },
      {
        email: "carol@accenture.com",
        passwordHash,
        name: "Carol Lim",
        rfidTag: "RFID-EMP-0003",
        role: "user",
        department: "Strategy",
        jobTitle: "Managing Director",
        employeeId: "EMP-0003",
        joinedAt: new Date("2013-09-10"),
        privacyAckAt: new Date(),
        carMake: "Polestar",
        carModel: "2",
        carYear: 2024,
        carPlate: "MU 9012 EF",
      },
      {
        email: "dan@accenture.com",
        passwordHash,
        name: "Dan Naidoo",
        rfidTag: "RFID-EMP-0004",
        role: "user",
        department: "Operations",
        jobTitle: "Consultant",
        employeeId: "EMP-0004",
        joinedAt: new Date("2023-01-20"),
        privacyAckAt: new Date(),
        carMake: "Hyundai",
        carModel: "Ioniq 5",
        carYear: 2023,
        carPlate: "MU 3456 GH",
      },
      {
        email: "admin@accenture.com",
        passwordHash,
        name: "Priya Admin",
        rfidTag: "RFID-ADM-0001",
        role: "admin",
        department: "Workplace",
        jobTitle: "Workplace Manager",
        employeeId: "ADM-0001",
        joinedAt: new Date("2016-05-04"),
        privacyAckAt: new Date(),
        carMake: "Kia",
        carModel: "EV6",
        carYear: 2024,
        carPlate: "MU 7890 IJ",
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