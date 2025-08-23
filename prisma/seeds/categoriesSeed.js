const prisma = require('../../src/utils/prisma');

const dotenv = require("dotenv");
const path = require("path");


const env = process.env.NODE_ENV || "development";
dotenv.config({ path: path.resolve(__dirname, `../.env.${env}`) });

async function main() {
    const categories = ['furniture', 'lighting', 'decor', 'bathroom'];
  
    for (const name of categories) {
      await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
  
    console.log('Seeded categories successfully.');
  }
  
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });