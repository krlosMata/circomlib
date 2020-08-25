
const { bigInt, stringifyBigInts, unstringifyBigInts } = require("snarkjs");

const level = require("level");

class LevelDb {

    constructor(pathDb) {
        this.db = level(pathDb);
    }

    async insertDb(key, value) {
        await this.db.put(key, value);
    }

    async getDb(key) {
        return await this.db.get(key);
    }

    async getOrDefaultDb(key, defaultElem) {
        try {
            const res = await this.getDb(key);
            return res;
        } catch(err) {
            if (err.notFound) {
                return defaultElem;
            }
            throw err; 
        }
    }

    async deleteDb(key) {
        await this.db.del(key);
    }
}


class SMTLevelDb extends LevelDb{
    constructor(pathDb) {
        super(pathDb);
    }

    _toString(val) {
        return JSON.stringify(stringifyBigInts(val));
    }

    _fromString(val) {
        return unstringifyBigInts(JSON.parse(val));
    }

    _key2str(k) {
        const keyS = bigInt(k).toString();
        return keyS;
    }

    _normalize(n) {
        for (let i = 0; i < n.length; i++) {
            n[i] = bigInt(n[i]);
        }
    }

    async getRoot() {
        const value = await this.getOrDefaultDb("smt-root", this._toString(bigInt(0)));
        return this._fromString(value);
    }

    async setRoot(rt) {
        await this.insertDb("smt-root", this._toString(rt));
    }

    async get(key) {
        const keyS = this._key2str(key);
        const value = await this.getOrDefaultDb(keyS, undefined);
        if (value)
            return this._fromString(value);
        return undefined;
    }

    async multiGet(keys) {
        const promises = [];
        for (let i=0; i<keys.length; i++) {
            promises.push(this.get(keys[i]));
        }
        return await Promise.all(promises);
    }

    async multiIns(inserts) {
        for (let i = 0; i < inserts.length; i++) {
            const keyS = this._key2str(inserts[i][0]);
            this._normalize(inserts[i][1]);
            const valueS = this._toString(inserts[i][1]);
            await this.insertDb(keyS, valueS);
        }
    }

    async multiDel(dels) {
        for (let i = 0; i < dels.length; i++) {
            const keyS = this._key2str(dels[i]);
            await this.deleteDb(keyS);
        }
    }
}

module.exports = SMTLevelDb;
