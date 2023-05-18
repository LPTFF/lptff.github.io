# 待办事项

刚和ZY聊了一下，感觉想做一个首页自动抓取感兴趣的新闻流，类似于聚合页，不然每次打开电脑没事干。找了一下ChatGPT问了一下，大致要做如下的事情：

## ChatGPT版本一


To scrape news from websites of interest using Vue, you can use a combination of Vue.js, Node.js, and web scraping libraries. One popular web scraping library for Node.js is Cheerio.

Here's a general outline of how you can achieve this:

1. Use Vue.js to create a user interface (UI) for inputting the website URLs and other parameters that you will use to scrape news articles.
2. In a Node.js script, use Cheerio to scrape the HTML of the target websites and extract the news articles.
3. Use a Node.js module like Express.js to create a web API that will handle requests from the Vue.js UI and trigger the scraping process.
4. When a Vue.js user inputs website URLs and other parameters, the UI will make a request to the Node.js API with the input values.
5. The Node.js API will use the Cheerio library to scrape the target websites and extract news articles, then return the articles as JSON to the Vue.js UI.
6. Display the scraped news articles in the Vue.js UI using a compatible library like Vuetify or Bootstrap.

It's important to note that web scraping can be a legally and ethically complex process, and you should always obtain permission and follow user guidelines before scraping any website. Additionally, some websites block web scraping attempts with bots, so you'll need to ensure that your scraping process can bypass these obstacles.

## ChatGPT版本二


As an AI language model, I cannot provide you with the exact code to crawl news from websites. However, I can give you some guidance on how to approach this task using Vue.

1. Identify the websites you want to crawl news from and understand their structure and content.
2. Use a web scraping tool or library like Cheerio or Puppeteer to extract data from the websites.
3. Create a Vue component that will display the news articles on your website.
4. Use Axios or another HTTP client library to make requests to the websites and retrieve the data.
5. Parse the data using JavaScript functions and store it in a state management system like Vuex or in local storage.
6. Display the news articles on your website using Vue's templating system and styling them with CSS.
7. Set up a cron job or use setInterval() function to periodically fetch new articles from the websites and update your application's state accordingly.
8. Implement error handling and logging mechanisms to ensure that your application runs smoothly even when there are issues with fetching data from the websites.

Remember that web scraping can be illegal in some cases, so make sure you have permission from website owners before scraping their content.
