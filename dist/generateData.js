"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertStores = exports.insertCustomers = void 0;
const types_1 = require("./types");
async function insertCustomers(knex) {
    const customersRows = [];
    const names = [
        "LEGOUREC",
        "CÕLÄDÂÑT",
        "LÂÑTANO",
        "ÂÑ",
        "RICHARD",
        "ZAHID",
        "LE GOUREC",
        "DE LA TOUR ABOLIE",
        "JONES",
        "ADAM",
        "ARP",
        "L'OUBLIEUX"
    ];
    const firstnames = [
        "Alice",
        "Alex",
        "John",
        "Johnatan",
        "Alexandre",
        "Alexandra",
        "Nathan",
        "Maxime",
        "Marie",
        "France",
        "Françis",
        "François",
        "Damien"
    ];
    const emailProviders = [
        "gmail.com",
        "protonmail.com",
        "apple.com",
        "free.fr",
        "aol.com",
        "bell-labs.com",
        "univ.gouv.fr",
        "dementia.co",
        "rave.uk",
        "gesture.it",
    ];
    const randomEmails = [
        "uiios.jkusds",
        "14ksddha.iuh80asd",
        "applekalsd.sdasd_iosd",
        "maxime.john",
        "nathan.free",
        "famien.parie",
        "fra.dementi",
        "damien",
        "dams",
        "colad"
    ];
    for (let i = 0; i < names.length; i++)
        for (let j = 0; j < firstnames.length; j++)
            for (let k = 0; k < emailProviders.length; k++)
                for (let m = 0; m < randomEmails.length; m++) {
                    const o1 = {
                        NAME: names[i],
                        FIRSTNAME: firstnames[j],
                        EMAIL: randomEmails[m] + "@" + emailProviders[k]
                    };
                    const o2 = {
                        NAME: names[i],
                        FIRSTNAME: randomEmails[m].split(".")[0],
                        EMAIL: firstnames[j] + "." + names[i] + "@" + emailProviders[k]
                    };
                    customersRows.push(o1);
                    customersRows.push(o2);
                }
    return knex(types_1.CUSTOMERS_TABLE).insert(customersRows);
}
exports.insertCustomers = insertCustomers;
async function insertStores(knex) {
    const storesRows = [
        {
            ID: "100",
            NAME: "Faubourg St Honoré",
            CITY: "Paris",
            COUNTRY: "France"
        },
        {
            ID: "200",
            NAME: "Sèvres Babylone",
            CITY: "Paris",
            COUNTRY: "France"
        },
    ];
    return knex(types_1.STORES_TABLE).insert(storesRows);
}
exports.insertStores = insertStores;
//# sourceMappingURL=generateData.js.map