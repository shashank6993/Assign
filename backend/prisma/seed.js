"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@123';
    console.log('Seeding database...');
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt_1.default.hash(adminPassword, 10);
        const adminUser = await prisma.user.create({
            data: {
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN'
            }
        });
        console.log(`Admin user created: ${adminUser.email}`);
    }
    else {
        console.log('Admin user already exists.');
    }
    console.log('Seeding completed successfully.');
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
