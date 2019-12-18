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

const transaction = (): Promise<string[]> => {
  return db.tx(t => {
    // LIMIT 3
    return t.any("SELECT * FROM payment_session WHERE status = $1 FOR UPDATE", [Status.PENDING])
      .then((payments: DB_obj[]) => {
        return payments.map((payment) => t.any("UPDATE payment_session SET status = $2 WHERE order_id = $1 RETURNING order_id", [payment.order_id, Status.FINISHED]));
      });
  });
};

// SUPPORT CONCURRENCY

const handlePendingPayments = async () => {
  try {
    // const payments = await getPaymentSessions();
    // Promise.all(payments.map(processPayment)).then(() => console.log("All processed"));
    const results = await transaction();
    if (results.length > 0) {
      console.log("Processed " + results.length + " payments");
      console.log(results);
    } else
      console.log("Idle");

  } catch (err) {
    console.error(err);
  }
  setTimeout(handlePendingPayments, 1000);
};

handlePendingPayments();