const prisma = require('../../utils/prisma');

async function main() {
    const adminEmail = 'bennchigozie@gmail.com';

    const user = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (user) {
        // If user exists but is not an admin, update the role
        if (user.role !== 'ADMIN') {
          await prisma.user.update({
            where: { email: adminEmail },
            data: { role: 'ADMIN' },
          });
          console.log(`User ${adminEmail} has been promoted to ADMIN`);
        } else {
          console.log(`User ${adminEmail} is already an ADMIN`);
        }
      }
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });