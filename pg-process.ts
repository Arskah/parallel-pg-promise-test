import pgPromise, { IMain, IDatabase } from "pg-promise";
import { TConnectionParameters } from "pg-promise/typescript/pg-subset";
// import Postgrator from "postgrator";


const connection: TConnectionParameters = {
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "postgres"
};

// const postgrator = new Postgrator({
//   migrationDirectory: "migrations",
//   driver: "pg",
//   host: "localhost",
//   port: 5432,
//   database: "postgres",
//   username: "postgres",
//   password: "postgres"
// });

const pgp: IMain = pgPromise();
const db: IDatabase<any> = pgp(connection);

enum Status {
  STARTED = 'STARTED',
  PENDING = 'PENDING',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR'
}

type DB_obj = {
  order_id: string;
  status: Status;
}

// const migrate = async () => postgrator.migrate();
// const runSql = async (sql: string) => postgrator.runQuery(sql);

// NAIVE SOLUTION
const getPaymentSessions = async (): Promise<DB_obj[]> => {
  return db.any("SELECT * FROM payment_session WHERE status = $1", [Status.PENDING])
}

const processPayment = async (payment: DB_obj) => {
  console.log("Processing " + payment.order_id);
  return db.none("UPDATE payment_session SET status = $2 WHERE order_id = $1", [payment.order_id, Status.FINISHED]);
}
// NAIVE SOLUTION

// SUPPORT CONCURRENCY

const transaction = (): Promise<Promise<DB_obj>[]> => {
  return db.tx(async (t: IDatabase<any>) => {
    const payments = await t.any("SELECT * FROM payment_session WHERE status = $1 LIMIT 3 FOR UPDATE SKIP LOCKED", [Status.PENDING])
    return payments.map((payment) => t.one("UPDATE payment_session SET status = $2 WHERE order_id = $1 RETURNING order_id", [payment.order_id, Status.FINISHED]));
  });
};

// SUPPORT CONCURRENCY

const handlePendingPayments = async () => {
  try {
    // const payments = await getPaymentSessions();
    // Promise.all(payments.map(processPayment)).then(() => console.log("All processed"));
    const results = await Promise.all(await transaction());
    if (results.length > 0) {
      console.log("Processed " + results.length + " payments");
      results.forEach((res) => console.log(res.order_id));
    } else
      console.log("Idle");

  } catch (err) {
    console.error(err);
  }
  setTimeout(handlePendingPayments, 1000);
};

handlePendingPayments();
// const results = Promise.all([handlePendingPayments(), handlePendingPayments(), handlePendingPayments()]);
