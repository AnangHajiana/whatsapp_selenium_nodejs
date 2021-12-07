console.clear();
const webdriver = require('selenium-webdriver'),By = webdriver.By, until = webdriver.until, Key = webdriver.Key;
const fetch = require('node-fetch');
var chrome = require("selenium-webdriver/chrome");

const classItems = "_3m_Xw";
const classTotalUnread = "_23LrM";
const classSender = "_ccCW FqYAR i0jNr";
const classMsg = "_37FrU";
const classXpathTopMsg = '/html/body/div[1]/div[1]/div[1]/div[3]/div/div[2]/div[2]/div/div/div[11]';
const xPathSearchBox = '/html/body/div[1]/div[1]/div[1]/div[3]/div/div[1]/div/label/div/div[2]';
const clearConsoleTimer = 10000;
const sendNotifUrl = 'http://127.0.0.1';
const isActiveAutoReply = true;
const logAutoClear = true;
const xPathTitleTalkPage = '/html/body/div[1]/div[1]/div[1]/div[4]/div[1]/header/div[2]/div/div/span';
const classBtnSend = '_4sWnG';
var chromeOptions = new chrome.Options();
chromeOptions.addArguments("--user-data-dir=D:/Node JS Workspace/wa_center/data");
// chromeOptions.addArguments("--profile-directory=Default");

const driver = new webdriver.Builder()
.forBrowser("chrome")
.setChromeOptions(chromeOptions)
.build();

driver.get('https://web.whatsapp.com/');


async function autoReply(){
    const items = await driver.findElements(By.className(classItems))
    console.log('items total',items.length)
    for(let t = 0; t < items.length; t++){
        let totalUnread = 0;
        try {
            totalUnread = await items[t].findElement(By.className(classTotalUnread)).getText();
            totalUnread = parseInt(totalUnread);
        } catch (error) {
            totalUnread = 0;
        }
        
        let sender = await items[t].findElement(By.className(classSender)).getText();
        let msg = await items[t].findElement(By.className(classMsg)).findElement(By.className(classSender)).getText();
        var inbox = {
            sender:sender,
            totalUnread:totalUnread,
            msg:msg
        }

        console.log('inbox',inbox);
        
        if(inbox.totalUnread > 0 && inbox.msg == 'papa'){
            setTimeout(() => {
                //click item
                items[t].click();
                //send notif to API sendNotifUrl
                sendNotif(inbox, async (response)=>{
                    if(response.replyMessage != undefined && response.replyMessage != '' && response.replyMessage != null){
                        await driver.actions().sendKeys(response.replyMessage).keyDown(Key.ENTER).perform();
                    }else{
                        await driver.actions().sendKeys('nunn sayangku istriku.. i love you..').keyDown(Key.ENTER).perform();
                    }
                    //move to top msg
                    await driver.findElement(By.xpath(classXpathTopMsg)).click();
                });
            }, 500);
        }
    }
}

setInterval(async () => {
    if(isActiveAutoReply){
        autoReply()
    }
}, 5000);


async function sendNotif(body, callback=null){
    console.log('sendNotif - ',body);
    await fetch(sendNotifUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
    }).
    then(res => res.json())
    .then(res => {
        callback && callback(res);
    })
    .catch((err)=>{
        console.log('[ERROR] send notif failed - ' + err.toString());
        callback && callback(err);
    });
}

function sleep(miliseconds) {
    var currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
}

//action send
async function sendMessage(phone,text,callback=()=>{}){
    try {
        await driver.findElement(By.xpath(xPathSearchBox)).click();
        await driver.actions().sendKeys(phone).keyDown(Key.ENTER).perform();
        console.log('send keys ',phone);

        
        let sender = await driver.findElement(By.xpath(xPathTitleTalkPage)).getText();
        sender = sender.replace(/ /g,'').replace(/-/g,'').replace('+','')
        if(sender == phone){
            await driver.actions().sendKeys(text).keyDown(Key.ENTER).perform();
            console.log('send keys ',text);
            setTimeout(async () => {
                //move to top msg
                await driver.findElement(By.xpath(classXpathTopMsg)).click();
                callback && callback('ok')
            }, 500);
        }else{
            callback && callback('not ok')
        }  
    } catch (error) {
        console.log('error',error);
        callback && callback(error.toString());
    }
}

//action send
async function sendMessage2(phone,text,callback=()=>{}){
    try {
        await driver.get(`https://web.whatsapp.com/send?phone=${phone}&text=${text}`).then(function(){
            setTimeout(() => {
                //move to top msg
                driver.findElement(By.className(classBtnSend)).click();
                driver.findElement(By.xpath(classXpathTopMsg)).click();
                callback && callback('ok');
            }, 5000);
        })
    } catch (error) {
        console.log('error',error);
        callback && callback(error.toString());
    }
}

//clear log every clearConsoleTimer
setInterval(() => {
    if(logAutoClear){
        console.clear();
    }
}, clearConsoleTimer);

//express START
var express = require('express')
var expressApp = express()
const port = 3000

expressApp.use(express.json());       // to support JSON-encoded bodies
expressApp.use(express.urlencoded()); // to support URL-encoded bodies

expressApp.get('/', function(request, response) {
  console.log('GET /')
  var html = `
    <html>
        <body>
            <h1>Send Message</h1>
            <form method="post" action="http://localhost:${port}/send">
                <table style="border:none">
                    <tr>
                        <td>Phone :</td>
                        <td><input required type="number" name="phone"/></td>
                    </tr>
                    <tr>
                        <td style="justify-content: start;display: flex;">Text :</td>
                        <td><textarea required name="text" placeholder="write a message.."></textarea></td>
                    </tr>
                    <tr>
                        <td></td>
                        <td><input type="submit" value="Send"/></td>
                    </tr>
                </table>
            </form>
        </body>
    </html>`;
  response.writeHead(200, {'Content-Type': 'text/html'})
  response.end(html)
});

expressApp.post('/send', async function(request, response) {
    console.log('POST /')
    console.dir(request.body);

    await sendMessage(request.body.phone,request.body.text,(result)=>{
        if(result=='ok'){
            if(request.body.content_type == 'json'){
                response.writeHead(200, {'Content-Type': 'application/json'})
                var bodyReponse = {
                    status : 200,
                    message : result
                }
                response.end(JSON.stringify(bodyReponse))
            }else{
                var html = `
                <html>
                    <body>
                        <h1 style="color:green">Terkirim</h1>
                        <a href="http://localhost:${port}">Back</a>
                    </body>
                </html>`;
                response.writeHead(200, {'Content-Type': 'text/html'})
                response.end(html)
            }
            
        }else{
            if(result == 'not ok'){
                sendMessage2(request.body.phone,request.body.text,(result)=>{
                    if(request.body.content_type == 'json'){
                        response.writeHead(200, {'Content-Type': 'application/json'})
                        var bodyReponse = {
                            status : result == 'ok'?200:500,
                            message : result
                        }
                        response.end(JSON.stringify(bodyReponse))
                    }else{
                        var html = `
                            <html>
                                <body>
                                    <h1 style="color:${result == 'ok'?'green':'red'}">${result=='ok'?'Terkirim.':result}</h1>
                                    <a href="http://localhost:${port}">Back</a>
                                </body>
                            </html>`;
                        response.writeHead(200, {'Content-Type': 'text/html'})
                        response.end(html)
                    }
                })
            }else{
                if(request.body.content_type == 'json'){
                    response.writeHead(200, {'Content-Type': 'application/json'})
                    var bodyReponse = {
                        status : 500,
                        message : result
                    }
                    response.end(JSON.stringify(bodyReponse))
                }else{
                    var html = `
                        <html>
                            <body>
                                <h1 style="color:red">${result}</h1>
                                <a href="http://localhost:${port}">Back</a>
                            </body>
                        </html>`;
                    response.writeHead(200, {'Content-Type': 'text/html'})
                    response.end(html)
                }
            }
        }
    })
})


expressApp.listen(port)
console.log(`Listening at http://localhost:${port}`)