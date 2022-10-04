"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Knex = require("knex");
const generateData_1 = require("./generateData");
const knex = Knex({
    client: "mysql",
    version: '5.7',
    connection: {
        host: '127.0.0.1',
        user: 'user',
        password: 'password',
        database: 'customers-test',
        port: 6606
    }
});
run(knex);
async function run(knex) {
    const c = await generateData_1.insertCustomers(knex);
    const s = await generateData_1.insertStores(knex);
    console.log("customers and stores are now inserted");
    return;
}
//# sourceMappingURL=initdb.js.map