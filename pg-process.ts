import pgPromise, { IMain, IDatabase } from "pg-promise";
import monitor from "pg-monitor";
import { TConnectionParameters } from "pg-promise/typescript/pg-subset";

const connection: TConnectionParameters = {
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "postgres"
};

const initOptions = {
  // query(e: any) {
  //   console.log(e.query);
  // },
  // transact(e: any) {
  //   console.log(e)
  // }
};

const pgp: IMain = pgPromise(initOptions);
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
  return db.tx('process payments', async (t: IDatabase<any>) => {
    const payments = await t.any("SELECT * FROM payment_session WHERE status = $1 LIMIT 3 FOR UPDATE SKIP LOCKED", [Status.PENDING])
    return payments.map((payment) => t.one("UPDATE payment_session SET status = $2 WHERE order_id = $1 RETURNING order_id", [payment.order_id, Status.FINISHED]));
  });
};

// SUPPORT CONCURRENCY

const handlePendingPayments = async () => {
  try {
    // NAIVE SOLUTION
    // const payments = await getPaymentSessions();
    // Promise.all(payments.map(processPayment)).then(() => console.log("All processed"));

    // SUPPORT CONCURRENCY
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
