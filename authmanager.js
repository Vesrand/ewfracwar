const { request } = require('undici');

const config = require('./config.json');
const dbManager = require('./dbmanager.js');

let activeSessionsMap = new Map();


async function identifyByCookie(cookie) {
    console.log(cookie);
    console.log(activeSessionsMap);
    let username = undefined;

    if (cookie && cookie != "" && cookie.match(/^\w+$/)) {
        //проверка в активных сессиях
        if (activeSessionsMap.has(cookie)) {
            username = activeSessionsMap.get(cookie);
            return username;
        } else {
            //если нет, то поиск в бд
            username = await dbManager.getAuthDataByCode(cookie);
            if (username){
                activeSessionsMap.set(cookie, username);
            }
        }
    }

    return username;
}


async function authByCode(code) {
    try {
        let isCodeValid = code.match(/^\w+$/);
        if (isCodeValid){
            //запрос токена
            const tokenResponseData = await request('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: `${config.protocol}://${config.host}:${config.port}`,
                    scope: 'identify',
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const oauthData = await tokenResponseData.body.json();

            //запрос данных пользователя по токену
            const userResult = await request('https://discord.com/api/users/@me', {
                headers: {
                    authorization: `${oauthData.token_type} ${oauthData.access_token}`,
                },
            });
            const userData = await userResult.body.json();

            //сохранение данных в сессию и бд
            if (userData.username) {
                activeSessionsMap.set(code, userData.username);
                await dbManager.setAuthData(code, userData.username, oauthData.access_token, oauthData.refresh_token);
            }
            return userData.username;
        }
    } catch (e) {
        // NOTE: An unauthorized token will not throw an error
        // tokenResponseData.statusCode will be 401
        console.log(`${new Date()}: authByCode ERROR: ${e}`);
    }
}

async function logoff(code) {
    if (code && code != "" && code.match(/^\w+$/)) {
        //удаление из сессий
        if (activeSessionsMap.has(code)) {
            activeSessionsMap.delete(code);
        }
        //удаление из бд
        await dbManager.clearCode(code);
    }
}

exports.identifyByCookie = identifyByCookie;
exports.authByCode = authByCode;
exports.logoff = logoff;