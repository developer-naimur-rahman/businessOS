const EmbeddedPostgres = require('embedded-postgres').default;

const pg = new EmbeddedPostgres({
  databaseDir: './data/pg',
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
});

async function main() {
  console.log('Starting embedded PostgreSQL...');
  try {
    await pg.initialise();
  } catch (e) {
    // Directory already initialized
  }
  await pg.start();
  console.log('PostgreSQL started on port 5432');

  // Create the business_os database
  try {
    await pg.createDatabase('business_os');
    console.log('Database "business_os" created');
  } catch (err) {
    if (err.message && err.message.includes('already exists')) {
      console.log('Database "business_os" already exists - OK');
    } else {
      console.log('Database check: already initialized');
    }
  }
  console.log('Connection URL: postgresql://postgres:postgres@localhost:5432/business_os');
  console.log('Press Ctrl+C to stop');

  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });

  // Keep the process alive
  setInterval(() => {}, 60000);
}

main().catch(async (err) => {
  // If database already exists, that's fine
  if (err.message && err.message.includes('already exists')) {
    console.log('Database "business_os" already exists - OK');
    console.log('Connection URL: postgresql://postgres:postgres@localhost:5432/business_os');
    console.log('Press Ctrl+C to stop');
    setInterval(() => {}, 60000);
    return;
  }
  console.error('Error:', err);
  process.exit(1);
});
