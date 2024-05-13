import InstantAPI from '@instant.dev/api';
import dotenv from 'dotenv';

const Gateway = InstantAPI.Gateway;
const TestEngine = InstantAPI.TestEngine;
const PORT = 7357; // Leetspeak for "TEST"; can be anything

// (1) Load environment variables; make sure NODE_ENV is "test"
dotenv.config({path: `.env.test`});
process.env.NODE_ENV = `test`;

// (2) Initialize and load tests; set PORT for request mocking
const testEngine = new TestEngine(PORT);
await testEngine.initialize('./test/tests');

// (3) Setup; create objects and infrastructure for tests
// Arguments returned here will be sent to .finish()
await testEngine.setup(async () => {

  console.log();
  console.log(`# Starting test gateway on localhost:${PORT} ... `);
  console.log();

  // Start Gateway; {debug: true} will print logs
  const gateway = new Gateway({debug: false});
  gateway.load(process.cwd());       // load routes from filesystem
  gateway.listen(PORT);              // start server

  return { gateway };

});

// (4) Run tests; use first argument to specify a test
const args = process.argv.slice(3);
if (args[0]) {
  await testEngine.run(args[0]);
} else {
  await testEngine.runAll();
}

// (5) Finish; close Gateway and disconnect from database
// Receive arguments from .setup()
testEngine.finish(async ({ gateway }) => {
  gateway.close();
});