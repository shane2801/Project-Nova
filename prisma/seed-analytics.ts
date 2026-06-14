import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const FIRST_NAMES = ["Alice","Bob","Carol","Dan","Eve","Frank","Grace","Henry","Iris","Jack","Kira","Liam","Mia","Noah","Olivia","Paul","Quinn","Riya","Sam","Tara","Uma","Victor","Wendy","Xavier","Yara","Zane","Anaya","Brian","Clara","David","Ella","Felix","Gina","Hugo","Ines","Jamal","Kavi","Lila","Mark","Nadia","Omar","Priya","Quentin","Ravi","Sara","Tim","Uma","Vikram","Wendy","Xenia","Yusuf","Zara","Ash","Bryn","Cleo","Dana","Erik","Faith","Gwen","Hari","Imran","Jess","Kai","Lin","Maya","Nico","Oren","Pia","Quan","Rohan","Sky","Theo","Uri","Vera","Will","Xia","Yan","Zoey","Aman","Bea","Cyrus"];
const LAST_NAMES = ["Dubois","Ramphul","Lim","Naidoo","Patel","Chen","Singh","Reddy","Khan","Ali","Joubert","Bissoon","Hossen","Sookhun","Beejan","Mahadeo","Goolam","Lamboo","Seerungum","Kurmally","Ramdass","Gungaram","Chinnaya","Pillay","Bhugun","Doolub","Mokoonlall","Auckle","Audit","Nadasen","Kumarsing","Boodhoo","Subhomonien","Rampall","Daulla","Yokeshwar","Khoosye","Mungroo","Lutchmun","Surnam","Beelary","Veerasamy","Maraye","Soobramoney","Choollun"];
const DEPARTMENTS = ["Technology", "Strategy", "Operations", "Workplace", "Finance", "Marketing", "HR", "Legal"];
const JOB_TITLES_BY_DEPT: Record<string, string[]> = {
  Technology: ["Software Engineer", "Senior Engineer", "Engineering Manager", "Tech Lead", "Cloud Architect", "Data Engineer", "Solution Architect"],
  Strategy: ["Consultant", "Senior Consultant", "Manager", "Managing Director", "Senior Manager", "Principal"],
  Operations: ["Consultant", "Operations Lead", "Senior Consultant", "Manager"],
  Workplace: ["Workplace Specialist", "Workplace Manager", "Facilities Coordinator"],
  Finance: ["Analyst", "Senior Analyst", "Finance Manager", "Controller"],
  Marketing: ["Marketing Manager", "Communications Lead", "Brand Specialist"],
  HR: ["HR Business Partner", "Talent Specialist", "Recruiter"],
  Legal: ["Legal Counsel", "Compliance Officer", "Senior Counsel"],
};
const EV_FLEET = [
  { make: "Tesla", models: ["Model 3", "Model Y", "Model S", "Model X"], yearRange: [2020, 2024] },
  { make: "BMW", models: ["i4", "iX", "iX3", "i5"], yearRange: [2021, 2024] },
  { make: "Polestar", models: ["2", "3", "4"], yearRange: [2021, 2024] },
  { make: "Hyundai", models: ["Ioniq 5", "Ioniq 6", "Kona Electric"], yearRange: [2020, 2024] },
  { make: "Kia", models: ["EV6", "EV9", "Niro EV"], yearRange: [2021, 2024] },
  { make: "Volkswagen", models: ["ID.3", "ID.4", "ID.5"], yearRange: [2020, 2024] },
  { make: "Mercedes-Benz", models: ["EQA", "EQB", "EQC", "EQE"], yearRange: [2021, 2024] },
  { make: "Audi", models: ["e-tron", "Q4 e-tron"], yearRange: [2020, 2024] },
  { make: "MG", models: ["MG4", "ZS EV"], yearRange: [2022, 2024] },
  { make: "BYD", models: ["Atto 3", "Dolphin", "Seal"], yearRange: [2022, 2024] },
  { make: "Nissan", models: ["Leaf", "Ariya"], yearRange: [2018, 2024] },
  { make: "Renault", models: ["Zoe", "Megane E-Tech"], yearRange: [2020, 2024] },
  { make: "Volvo", models: ["EX30", "EX40", "C40 Recharge"], yearRange: [2021, 2024] },
];
const STATIONS = [
  { identity: "CP-NEX-001", location: "NEX TOWER" },
  { identity: "CP-NEX-002", location: "NEX TOWER" },
  { identity: "CP-NXT-001", location: "NEX TERRACOM II" },
  { identity: "CP-NXT-002", location: "NEX TERRACOM II" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function gauss(mean: number, sd: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return z * sd + mean;
}

async function main() {
  console.log("Wiping existing analytics seed data...");
  await db.chargingSession.deleteMany({ where: { source: "seed" } });
  // Wipe seeded users (anyone whose email ends with @demo.local — we'll create them with that suffix)
  await db.user.deleteMany({ where: { email: { endsWith: "@demo.local" } } });

  console.log("Generating users...");
  const passwordHash = await bcrypt.hash("evolve123", 10);
  const SEED_USER_COUNT = 80;
  const seedUsers = [];

  for (let i = 0; i < SEED_USER_COUNT; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const name = `${first} ${last}`;
    const empNum = 100 + i;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${empNum}@demo.local`;
    const department = pick(DEPARTMENTS);
    const jobTitle = pick(JOB_TITLES_BY_DEPT[department] ?? ["Consultant"]);

    // Tenure: 0-15 years, weighted toward shorter tenure
    const yearsTenure = Math.max(0, Math.floor(gauss(4, 3)));
    const joinedAt = new Date();
    joinedAt.setFullYear(joinedAt.getFullYear() - yearsTenure);
    joinedAt.setMonth(randInt(0, 11));
    joinedAt.setDate(randInt(1, 28));

    const car = pick(EV_FLEET);
    const carYear = randInt(car.yearRange[0], car.yearRange[1]);
    const carModel = pick(car.models);
    const carMake = car.make;
    const carPlate = `MU ${randInt(1000, 9999)} ${String.fromCharCode(65 + randInt(0, 25))}${String.fromCharCode(65 + randInt(0, 25))}`;

    const u = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        rfidTag: `RFID-DEMO-${String(empNum).padStart(4, "0")}`,
        role: "user",
        department,
        jobTitle,
        employeeId: `EMP-${String(empNum).padStart(4, "0")}`,
        joinedAt,
        privacyAckAt: new Date(),
        carMake,
        carModel,
        carYear,
        carPlate,
      },
    });
    seedUsers.push(u);

    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${SEED_USER_COUNT} users created`);
  }

  console.log("Generating charging sessions for the last 90 days...");
  const ENDS_AT = new Date();
  const STARTS_AT = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  let sessionCount = 0;

  // Each user has a "frequency profile" — some are heavy users, most are moderate, some rare
  for (const user of seedUsers) {
    const profile = Math.random();
    const sessionsPerWeek = profile < 0.15 ? gauss(4, 1) : profile < 0.7 ? gauss(2, 0.8) : gauss(0.5, 0.4);

    let day = new Date(STARTS_AT);
    while (day < ENDS_AT) {
      // Weekday weighting: Mon-Fri 90% chance, weekends 25%
      const dow = day.getDay();
      const isWeekday = dow >= 1 && dow <= 5;
      const dailyChance = (sessionsPerWeek / 5) * (isWeekday ? 1 : 0.25);

      if (Math.random() < dailyChance) {
        // Pick a realistic time of day — bimodal (morning arrival, lunchtime, after-work)
        const hourRoll = Math.random();
        const hour =
          hourRoll < 0.45 ? randInt(8, 10) :    // morning arrival peak
          hourRoll < 0.65 ? randInt(12, 13) :   // lunch peak
          hourRoll < 0.95 ? randInt(14, 18) :   // afternoon spread
          randInt(19, 21);                       // evening

        const minute = randInt(0, 59);
        const startTime = new Date(day);
        startTime.setHours(hour, minute, 0, 0);

        // Session duration: 30-90 min typical, sometimes longer
        const durationMin = Math.max(15, Math.min(120, Math.round(gauss(55, 25))));
        const stopTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

        // Energy: power 7.4kW × duration with some variance. Some cars charge faster.
        const carBoost = ["Tesla", "BMW", "Polestar", "Audi"].includes(user.carMake ?? "") ? 1.0 : 0.9;
        const powerKw = 7.4 * carBoost;
        const energyKwh = (powerKw * durationMin) / 60;
        const energyWh = Math.round(energyKwh * 1000 * (0.9 + Math.random() * 0.2));

        const station = pick(STATIONS);

        await db.chargingSession.create({
          data: {
            csmsSessionId: null,
            userId: user.id,
            stationIdentity: station.identity,
            connectorId: randInt(1, 4),
            startTime,
            stopTime,
            energyWh,
            durationSec: durationMin * 60,
            userNameSnap: user.name,
            userEmailSnap: user.email,
            departmentSnap: user.department,
            jobTitleSnap: user.jobTitle,
            employeeIdSnap: user.employeeId,
            carMakeSnap: user.carMake,
            carModelSnap: user.carModel,
            carYearSnap: user.carYear,
            source: "seed",
          },
        });
        sessionCount++;
      }

      day.setDate(day.getDate() + 1);
    }

    if (seedUsers.indexOf(user) % 10 === 0) {
      console.log(`  user ${seedUsers.indexOf(user) + 1}/${SEED_USER_COUNT}, ${sessionCount} sessions so far`);
    }
  }

  console.log(`\nSeed complete: ${SEED_USER_COUNT} users, ${sessionCount} charging sessions over 90 days.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());