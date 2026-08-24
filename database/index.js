const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({

    host:
        process.env.DB_HOST || 'localhost',

    port:
        Number(process.env.DB_PORT) || 3306,

    user:
        process.env.DB_USER || 'root',

    password:
        process.env.DB_PASSWORD || '',

    database:
        process.env.DB_NAME || 'boxing_store',

    waitForConnections:
        true,

    connectionLimit:
        10,

    queueLimit:
        0

});


const query = async (
    sql,
    params = []
) => {

    try {

        const [rows] =
            await pool.execute(
                sql,
                params
            );

        return rows;

    } catch (error) {

        console.error(
            '❌ Error MySQL:',
            error.message
        );

        throw error;

    }

};


const getConnection =
    async () => {

        return await pool.getConnection();

    };


module.exports = {

    pool,

    query,

    getConnection

};