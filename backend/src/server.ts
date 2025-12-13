import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import { startQueueProcess } from "./queues";

import Plan from "./models/Plan";
import User from "./models/User";
import { hash } from "bcryptjs";

const initSystem = async () => {
  try {
    // 1. Check/Create Plans
    const plansCount = await Plan.count();
    if (plansCount === 0) {
      console.log("🔍 [Self-Healing] Plans table empty. Seeding defaults...");
      await Plan.bulkCreate([
        { id: 1, name: "Plano Individual", users: 1, connections: 1, queues: 3, value: 49.90 },
        { id: 2, name: "Plano Plus", users: 5, connections: 3, queues: 10, value: 99.90 },
        { id: 3, name: "Plano Pro", users: 10, connections: 10, queues: 20, value: 199.90 }
      ]);
      console.log("✅ [Self-Healing] Plans created.");
    }

    // 2. Check/Create Company
    let company = await Company.findOne({ where: { id: 1 } });
    if (!company) {
      console.log("🔍 [Self-Healing] Default Company (ID 1) missing. Creating...");
      company = await Company.create({
        id: 1,
        name: "Empresa Admin",
        planId: 1,
        dueDate: "2093-03-14 04:00:00+01"
      });
      console.log("✅ [Self-Healing] Company created.");
    }

    // 3. Check/Create Admin User
    const adminUser = await User.findOne({ where: { email: "admin@admin.com" } });
    if (!adminUser) {
      console.log("🔍 [Self-Healing] Admin user missing. Creating...");
      const passwordHash = await hash("123456", 8);
      await User.create({
        name: "Admin",
        email: "admin@admin.com",
        passwordHash,
        profile: "admin",
        super: true,
        companyId: 1
      });
      console.log("✅ [Self-Healing] Admin user created.");
    } else {
      // Fix Orphaned Admin
      if (adminUser.companyId !== 1) {
        console.log("⚠️ [Self-Healing] Admin user orphaned. Linking to company...");
        await adminUser.update({ companyId: 1 });
        console.log("✅ [Self-Healing] Admin user fixed.");
      }
    }
  } catch (error) {
    console.error("❌ [Self-Healing] Error:", error);
  }
};

const server = app.listen(process.env.PORT, async () => {
  await initSystem();
  
  const companies = await Company.findAll();
  const allPromises: any[] = [];
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  Promise.all(allPromises).then(() => {
    startQueueProcess();
  });
  logger.info(`Server started on port: ${process.env.PORT}`);
});

initIO(server);
gracefulShutdown(server);
