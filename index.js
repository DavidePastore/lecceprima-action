const core = require('@actions/core');
const github = require('@actions/github');
const Parser = require('rss-parser');

try {
  // `db-directory` input defined in action metadata file
  const dbDirectory = core.getInput('db-directory');
  console.log(`The database directory is ${dbDirectory}`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);

  console.log('Reading from the RSS feed...');
  let parser = new Parser();
  parser.parseURL('http://www.lecceprima.it/rss', (err, feed) => {
    if (err) {
      console.log(`Error while parsing the RSS: ${err}`);
    }

    console.log(feed.title);
    console.log(`Feed items are: ${feed.items.length}`);

    feed.items.forEach(item => {
      console.log(`${item.title} : ${item.link} at ${item.pubDate} or ${item.isoDate}`);
      let onlyDate = item.isoDate.substring(0, 10);
      console.log(`Only date is: ${onlyDate}`);
    });
    console.log('No more RSS feed to read');
  });
} catch (error) {
  core.setFailed(error.message);
}