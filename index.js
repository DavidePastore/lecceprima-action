const core = require('@actions/core');
const github = require('@actions/github');
const Parser = require('rss-parser');

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);

  console.log('Reading from the RSS feed...');
  let parser = new Parser();
  let feed = parser.parseURL('http://www.lecceprima.it/rss', (err, feed) => {
    console.log(feed.title);
    feed.items.forEach(item => {
      console.log(item.title + ':' + item.link + ' at ' + item.pubDate);
    });
    console.log('No more RSS feed to read');
  });
} catch (error) {
  core.setFailed(error.message);
}