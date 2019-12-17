import pgPromise, { IMain, IDatabase } from "pg-promise";
import { TConnectionParameters } from "pg-promise/typescript/pg-subset";
import Postgrator from "postgrator";


const connection: TConnectionParameters = {
  host: "localhost",
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: "postgres"
};

const postgrator = new Postgrator({
  migrationDirectory: "migrations",
  driver: "pg",
  host: "localhost",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "postgres"
});

const pgp: IMain = pgPromise();
const db: IDatabase<any> = pgp(connection);

const migrate = async () => postgrator.migrate();
const runSql = async (sql: string) => postgrator.runQuery(sql);


const init = async () => {
  migrate().then(() => {
    console.log("migrated");
  })
}

init().then(() => console.log("started"));
