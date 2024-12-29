const config = require('./config.json');
const mysql = require("mysql2");

const dbpool = mysql.createPool({
    connectionLimit: 50,
    host: config.host,
    port: config.dbport,
    user: config.dbuser,
    database: config.dbname,
    password: config.dbpass
}).promise();

async function getAuthDataByCode(code){
    let username = undefined;
    try{
        let result = await dbpool.query('SELECT dcusername FROM auth WHERE authcode=?',[code]);
        if (result[0].length > 0){
            username = result[0][0]['dcusername'];
        }
    }catch(e){
        console.log(`${new Date()}: getAuthDataByCode ERROR: ${e}`);
    }
    return username;
}

async function setAuthData(code, username, access_token, refresh_token){
    try{
        let isUsernameExists = await dbpool.query('SELECT authcode FROM auth WHERE dcusername=?',[username]);
        if (isUsernameExists[0].length > 0){
            let result = await dbpool.query(`UPDATE auth SET authcode=?, accesstoken=?, refreshtoken=? WHERE dcusername=?`,[code,access_token,refresh_token,username]);
        }else{
            let result = await dbpool.query(`INSERT INTO auth (dcusername,authcode,accesstoken,refreshtoken) VALUES(?,?,?,?)`,[username,code,access_token,refresh_token]);
        }
    }catch(e){
        console.log(`${new Date()}: setAuthData ERROR: ${e}`);
    }
}

exports.getAuthDataByCode = getAuthDataByCode;
exports.setAuthData = setAuthData;