import { PrismaClient } from '@prisma/client'
import products from './products.json';
const prisma = new PrismaClient();

async function main() {
  for (let product of products) {
    // Create a copy of the product data without the id field
    const { id, ...productData } = product;
    
    try {
      await prisma.product.create({
        data: productData, // MongoDB will auto-generate an ObjectID
      });
    } catch (error) {
      console.error(`Failed to create product: ${error.message}`);
      continue; // Skip to next product if there's an error
    }
  }
}

main()
  .then(async () => {
    console.log('Products seeded successfully');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding products:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
