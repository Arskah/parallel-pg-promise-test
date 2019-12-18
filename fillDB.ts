import pgPromise, { IMain, IDatabase } from "pg-promise";
import { TConnectionParameters } from "pg-promise/typescript/pg-subset";
import Postgrator from "postgrator";
import uid from "uid-safe";


const connection: TConnectionParameters = {
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "postgres"
};

const postgrator = new Postgrator({
  migrationDirectory: "./migrations",
  driver: "pg",
  host: "localhost",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "postgres"
});

const pgp: IMain = pgPromise();
const db: IDatabase<any> = pgp(connection);

const insert = async (db: IDatabase<any>) => {
  db.none("INSERT INTO payment_session (order_id, status) VALUES ($1, $2)",
  [
      uid.sync(18),
      "PENDING",
  ])
}

postgrator.migrate()
.then((appliedMigrations) => {
  console.log("Init: Applied migrations");
  console.log(appliedMigrations);

  for (var i = 0; i < 10; i++) {
    insert(db).catch((err) => console.error(err))
  }
}).catch(err => console.error(err));