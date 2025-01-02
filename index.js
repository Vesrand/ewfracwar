const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const config = require('./config.json');
const authManager = require('./authmanager.js');
const { json } = require('stream/consumers');

const app = express();
const port = parseInt(config.port);


app.use(express.static('web/map')); // предоставление пользователю статичных файлов
app.use(express.static('web')); 
app.use(express.static('web/combat')); 
app.use(cookieParser(config.cookieSecret));


//авторизация на главной странице в случае наличия кода в адресе либо в куках браузера
//в любом случае бедт отправлена страница логина, дальнейшая отрисовка управляется запросами с checkauth из js на странице
app.get('/', async (req, res) => {
	const code = req.query.code;
	const cookies = req.cookies;
	let username;
	
	username = await authManager.identifyByCookie(cookies['ewUsernameCode']);
	if (username && username != "") {
		res.sendFile(path.join(__dirname + '/web/loginpage.html')); //успешный логин по кукам
	} else {
		if (code && code != "") {
			let isCodeValid = code.match(/^\w+$/);
			if (isCodeValid) {
				username = await authManager.authByCode(code); //авторизация на сервере дискорда и сохранение данных в бд
				res.cookie('ewUsernameCode',code); //выдаем юзеру куки с кодом ,{signed: true}
				if (username && username != "") {
					res.redirect('/'); //успешный логин по коду из адресной строки: редирект сюда же, чтобы из адресной строки убрать код и залогиниться по кукам
				} else {
					res.sendFile(path.join(__dirname + '/web/loginpage.html')); //на случай непредвиденных ситуаций
					console.log(`${new Date()}: login failed`);
				}
			}
		} else {
			res.sendFile(path.join(__dirname + '/web/loginpage.html')); //сюда юзер попадает в первый раз в отсутствии всяких данных о логине
		}
	}
});


//проверка уже существующей авторизации для js на странице
app.get('/checkauth', async (req, res) => {
	const cookies = req.cookies;
	let username;
	
	username = await authManager.identifyByCookie(cookies['ewUsernameCode']);
	res.setHeader('Content-Type', 'application/json');
	if (username && username != "") {
		res.json({"username": username});
	} else {
		res.json({});
	}
});

app.get('/logoff', async (req, res) => {
	const cookies = req.cookies;
	
	username = await authManager.logoff(cookies['ewUsernameCode']); //удаление из сессии и из бд

	res.clearCookie('ewUsernameCode'); //зачистка куки
});


app.get('/map', async (req, res) => {
	const cookies = req.cookies;
	let username;
	
	username = await authManager.identifyByCookie(cookies['ewUsernameCode']);
	if (username && username != "") {
		res.sendFile(path.join(__dirname + '/web/map/morrowind.html'));
	} else {
		res.redirect('/');
	}
});


app.get('/drawpath', (req, res) => {
	// express.static('web/map'); - тут не работает
	res.sendFile(path.join(__dirname + '/web/map/drawpath.html'));
});


app.listen(port, () => {
	console.log(`Server running on ${config.protocol}://${config.host}:${port}`);
});