const chai = require("chai");
const process = require("child_process");
const { bigInt } = require("snarkjs");

const { SMT } = require("../src/smt.js");
const SMTLevelDb = require("../src/smt_leveldb");
const assert = chai.assert;

describe("SMT Javacsript LevelDb", function () {
    this.timeout(100000);
    const pathDb = `${__dirname}/tmp`;
    let smt;

    after(async () => {
        process.exec(`rm -rf ${pathDb}`);
    });

    it("Should create empty SMT", async () => {
        const db = new SMTLevelDb(pathDb);
        const rt = await db.getRoot();
        smt = new SMT(db, rt);

        assert(smt.root.isZero());
    });

    it("Should test smt functions", async () => {
        const key1 = bigInt(111);
        const value1 = bigInt(222);
        const key2 = bigInt(333);
        const value2 = bigInt(444);
        const value3 = bigInt(555);

        // Insert
        await smt.insert(key1, value1);
        await smt.insert(key2, value2);

        const resValue1 = await smt.find(key1);
        const resValue2 = await smt.find(key2);

        assert(resValue1.foundValue.equals(value1));
        assert(resValue2.foundValue.equals(value2));
        
        // Delete
        await smt.delete(key2);

        try {
            await smt.find(key2);
        } catch (error) {
            assert((error.message).includes("Key not found in database"));
        }

        // Update
        await smt.update(key1, value3);

        const resUpdateVal1 = await smt.find(key1);
        assert(resUpdateVal1.foundValue.equals(value3));
    });

});