//проверка логина на сервере по кукам
async function checkAuth(config) {
    let username = undefined;

    try{
        const response = await fetch(`${config.protocol}://${config.host}:${config.port}/checkauth`);
        const respjson = await response.json();
        console.log(respjson);
        if (respjson) {
            username = respjson.username;
        }
    }catch(e){
        console.log(e);
    }

    return username;
}

//логоф на сервере и зачистка куки
async function serverLogoff(config) {
    try{
        const response = await fetch(`${config.protocol}://${config.host}:${config.port}/logoff`);
        console.log("На сервере выполнен логоф, response.status: "+response.status);
    }catch(e){
        console.log(e);
    }
}