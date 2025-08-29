async function cleanupGuests() {
    console.log("Cleaning up guest users older than 30 days...");
  
    const result = await prisma.user.deleteMany({
      where: {
        email: { startsWith: "guest_" },
        createdAt: { lt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, 
      },
    });
  
    console.log(`Deleted ${result.count} guest users`);
  }
  
  cleanupGuests()
    .catch((err) => {
      console.error("Error cleaning guest users:", err);
      process.exit(1);
    })
    .finally(() => process.exit(0));
  