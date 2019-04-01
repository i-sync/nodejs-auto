const puppeteer = require('puppeteer');
const data = require("./auth");
const fs = require('fs');
const request = require('request-promise-native');
const logger = require('./logger');
const path = require('path');

const url = "https://i.qq.com";

const chromeOptions = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless:true,
    defaultViewport: {width: 1280, height: 800},
    slowMo:50
};

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    });
}

(async() => {
    
    const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();
    
    await page.goto(url);
    
    const iframe = await page.frames().find(iframe => iframe.name() === 'login_frame');
    
    //user password 
    await iframe.click("#switcher_plogin");
    //user name 
    await iframe.type("#u", data.qq);
    //password
    await iframe.type("#p", data.pwd);
    
    //await iframe.click("#login_button");
    await Promise.all([
        iframe.click("#login_button"),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    logger.info("login success");
    
    //read files, get history of today
    const his = await getHistory();
    //get weather info 
    const weather = await getWeather();
    
    const result = `[天气自动播报] ${weather}\n[历史上的今天] ${his}\n(此消息来自我家树莓派自动发送)`;
    logger.info(result);
    await page.waitFor(5000);
    
    //input
    await page.waitForSelector("#main_feed_container div.textinput.textarea.c_tx2");
    await page.$eval("#main_feed_container div.textinput.textarea.c_tx2", el => el.style.display = "block");
    await page.type("#main_feed_container div.textinput.textarea.c_tx2", result);
    await page.waitFor(2000);
    await page.$eval("#main_feed_container .qz-poster-ft .op a.btn-post", el => el.click());
    await page.waitFor(5000);
    await browser.close();
    
})();

async function getHistory(){
    const date = new Date();
    const json_file_name = `files/${date.getMonth() + 1 }-${date.getDate()}.json`
    //console.log(json_file_name);
    const json_data = JSON.parse(fs.readFileSync(path.resolve(__dirname, json_file_name), 'utf8'));
    //1: 大事记
    const res = json_data['res'].filter(x => x['id'] == '1')[0];
    const list = res['lists'];
    const random = getRandomInt(list.length);
    logger.info(random);
    const year = list[random]['year'];
    const title = list[random]['title'];
    return `${year}年${date.getMonth() + 1}月${date.getDate()}日 ${title.substring(title.indexOf(':') + 1)}`;
}

async function getWeather(){
    const options = {
        gzip: true,
        method: 'GET',
        uri: 'http://wthrcdn.etouch.cn/weather_mini?citykey=101010100',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36'
        }
    };
    const res = await request(options);
    const json_data = JSON.parse(res);
    if(json_data['status'] == 1000){
        const reg = /<!\[CDATA\[(.*)\]\]>/;
        var city = json_data['data']['city'];
        var temperature = json_data['data']['wendu'];
        var forecast = json_data['data']['forecast'][0];
        var date = forecast['date'];
        var weather = forecast['type'];
        var wind = forecast['fengli'];
        wind = wind.match(reg) != null ? wind.match(reg)[1] : wind;
        var direction = forecast['fengxiang'];
        var high = forecast['high'];
        var low = forecast['low'];
        return `${city},今天是${date} [${weather}], 当前温度${temperature}[${low} ~ ${high} ],${direction}${wind}.`;
    }
    return "can't get weather info!";
}