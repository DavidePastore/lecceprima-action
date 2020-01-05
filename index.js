const core = require('@actions/core');
const github = require('@actions/github');
const Parser = require('rss-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const messageSendingTimeout = 10000; // to be lower than 20 messages for minute https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  try {
    // `db-directory` input defined in action metadata file
    const dbDirectory = core.getInput('db-directory');
    const telegramToken = core.getInput('telegram-token');
    const telegramChatId = core.getInput('telegram-chat-id');
    const bot = new TelegramBot(telegramToken, {polling: true});
    console.log(`The database directory is ${dbDirectory}`);
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);

    console.log('Reading from the RSS feed...');
    let parser = new Parser();
    parser.parseURL('http://www.lecceprima.it/rss', async (err, feed) => {
      if (err) {
        console.log(`Error while parsing the RSS: ${err}`);
      }

      console.log(feed.title);
      console.log(`Feed items are: ${feed.items.length}`);

      if (!fs.existsSync(dbDirectory)) {
          fs.mkdirSync(dbDirectory);
      }

      feed.items.forEach(async (item, index) => {
        console.log(`${item.title} : ${item.link} at ${item.pubDate} or ${item.isoDate}`);
        let onlyDate = item.isoDate.substring(0, 10);
        console.log(`Only date is: ${onlyDate}`);
        let dbFile = `${dbDirectory}/${onlyDate}.json`;
        const adapter = new FileSync(dbFile);
        const db = low(adapter);
        let collection = db
          .defaults({ items: [] })
          .get('items');
        
        let foundItem = collection
          .find({ link: item.link })
          .value();

        // Check if the item already exists
        if (!foundItem) {
          // Send the message on Telegram every messageSendingTimeout milliseconds
          await sleep(messageSendingTimeout * index);
          bot.sendMessage(telegramChatId, `<a href="${item.link}">${item.title}</a>`,
            {parse_mode : 'HTML'}).then((response) => {
            // If everything is fine with Telegram message sending, insert a new item
            console.log(`Adding item ${item.title}.`);
            collection
              .push(item)
              .write();
          }).catch((error) => {
            console.log(error.code);
            console.log(error.response.body);
          });
        }
      });
      console.log('No more RSS feed to read');
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();