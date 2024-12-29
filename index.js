const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const config = require('./config.json');
const authManager = require('./authmanager.js');

const app = express();
const port = parseInt(config.port);


app.use(express.static('web/map')); // предоставление пользователю статичных файлов
app.use(cookieParser(config.cookieSecret));


app.get('/', async (req, res) => {
	const code = req.query.code;
	const cookies = req.cookies;
	let username;
	
	username = await authManager.identifyByCookie(cookies['ewUsernameCode']); //TODO предусмотреть случай логаута и логина за другого пользователя (удалить код отовсюду: куки, сессии, бд)
	if (username && username != "") {
		res.sendFile(path.join(__dirname + '/web/map/drawpath.html'));
	} else {
		if (code && code != "") {
			let isCodeValid = code.match(/^\w+$/);
			if (isCodeValid) {
				username = await authManager.authByCode(code); //авторизация на сервере дискорда и сохранение данных в бд
				res.cookie('ewUsernameCode',code,{signed: true}); //выдаем юзеру куки с кодом
				if (username && username != "") {
					res.sendFile(path.join(__dirname + '/web/map/drawpath.html'));
				} else {
					res.sendFile(path.join(__dirname + '/web/loginpage.html'));
					console.log(`${new Date()}: login failed`);
				}
			}
		} else {
			res.sendFile(path.join(__dirname + '/web/loginpage.html'));
		}
	}
});

// app.get('/greet/:name', (req, res) => {
//   const name = req.params.name;
//   res.send(`Hello, ${name}!`);
// });

app.get('/drawpath', (req, res) => {
	// express.static('web/map'); - тут не работает
	res.sendFile(path.join(__dirname + '/web/map/drawpath.html'));
});


app.listen(port, () => {
	console.log(`Server running on http://${config.host}:${port}`);
});