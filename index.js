import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import puppeteer from 'puppeteer';
import axios from 'axios';

const CONFIG = {
  wpApiUrl: 'https://profitbooking.in/wp-json/scraper/v1/tradingview',
};

const GOOGLE_SHEET_CONFIG = {
  sheetId: '1LK8uo_pDJkMUKtF2-MwpCo4nyh_EHzcFuV0_UuN6LXQ',
  sheetName: 'Sheet1',
  serviceAccount: {
    email: 'stockmarketdata@stock-data-461213.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCQkMFx716gDxDG\nyre2FZVzxXirjkjtFawd74k8kzzIjbrlXtTLIUxxtU1fFJQRLTs73H14aaYZEXGf\n6G5Pxx32EjaXcRRZs/thFTEm4jIdJVIjnelZVMtXpBfRjoUZqeDgw9W8AGVYYbb9\nw9KQjpNdV5VBszgRVtfj8Yc9zI9EhQI5ujEYiKkOOFDEz0VFCelIXlsbrmpNOgX7\nyALHmJSfXm3Uol4J2YmOmGPgD/z6TiIz+HK1b145og/YsZXPYm2R0J0QqJsUR7t6\n+SZxGtLRQ6wljPo85v0nNPFQgV5Tr0qc5XMUwJiVBR8omdLrQ5p1JgsDzOpzKaAO\n+kaN2yjrAgMBAAECggEAMmUj6lHljKpz0LjOPf1cMhV+sV9ScMODUpQ0JRe2srsl\nkdvzFjSvb1wicqi7zRkVcxKz8ovxyP9ZusLN4aWp/iPvP++9hl/Fm9xFXCayDZL7\nBUuBExEKKa0cWIL0RzP/HptmILmKmrrFjcT73ES3fmyPrW2KeBDsBZwm5xYuQ1YM\nedC7Vz5RjBd851HCMjEmS+69NVRm+3MDQJ4NKz1LtTbAEdckOiwItzhau4o/QohM\n3filtZGpIoxvtIPKz7QlneM75JTLVjSxpenC/AXzRufv9uIf65chRykNTSZwtODC\nkIzG/4QLfJJUbtZbSn/4lhPvt4GvTgFEmCZhWWzqUQKBgQDFpNMZN+6n3Z5SII2e\nrV9AkYJOTeCw4dM8uIX522Lp6zCj/v02WUcsPAllLzd9dMJXLNA57eJaFe/WtE5u\n8nuibI+Ug4GuKePVGIA9OA+CQHUmEe4eUoJKxJlsm0m2CI7U3P0S+zIzsVZ0tKuo\n+ewpwJ4bsHK/DuZ7tB+MZVl//wKBgQC7P+3qZ+ZwgBTc1j9v//8wBPM1yvB66skH\nHvuCk7+eK5+7zHcqxIl1G90qK094AVlUlUrq4G8csxBNKrZ7saNBLviJWVpKzmBQ\n2ic8TXM4N8EoNeLHDeFnZR0jVIRk3dtrC4HT+8Kq5Oq8/vs0n4cNIgZhLekHscwz\nVPjJLPxXFQKBgQCJQNV4hecunDD+R60RrMShSmt7hYmsTKctW9dulHQ0jifRO5sM\nyyMqDOdZZVjbvuHXOD/CevjeJq3QJJbzZWGGgm2TbV/5Ww3lRoaH/Q6IHcs9DOaY\nGCRzV+RUD+M4jujh2jXFoLxUOasYkP9E8YqX1DP4dqi5FdfpwETIcvmccQKBgQCR\nzQeeG+Ts+G5GPnUK6pRzeYc+/ZQewa5iYxeH5y+vI1yvSFgJ7xrxGw8tBKhOUw6R\ns+Wv2a3q9Orei0GoMvthiAdyOyb5VJTen98pL01mGtPGUZ8RS5eVgMAdgHPObomp\nYj5nJ4O+uZymKQzFPupTqYi6JptqqGDOH33Qd7zMuQKBgQC/39WLrNYWotXjckmY\nPBDEArh54YQw5Ad6biXWeuxt99M75ByshkMF3yuFlb3ZNAJ5skrRzS3/qRUV1RLa\npoG332nFR5XvJrpzslNLMo+wBv4hYdilhyoOqXQDAsFCcaw0IoMb4qHmKeKscErd\n/OR/ZaI+YCUnI8UGMXdj4nWMUA==\n-----END PRIVATE KEY-----\n`, // Your private key here
  },
};


const SELECTOR_REGISTRY = {
  articleSelectors: [
    'article[data-qa-id="news-headline-card"]',
    'a[href*="/news/"]',
    'article[class*="article-"]',
    'div[class*="card-"][data-qa-id*="news"]',
    'div[class*="container-"][data-qa-id*="news"]',
    'div[role="article"]',
    'div:has(> h3.news-title)'
  ],
  headlineSelectors: [
    '[data-qa-id="news-headline-title"]',
    'h3',
    'h4',
    '[role="heading"]',
    '[class*="title-"]'
  ],
  providerSelectors: [
    '[class*="provider-"] span',
    '[class*="source-"] span',
    'span:has(> img[alt*="logo"]) + span'
  ],
  contentSelectors: [
    'div[class*="body-"]',
    'div[class*="content-"]',
    'article[data-role="article"] div[class*="content"]',
    'div.article-body',
    'div[itemprop="articleBody"]'
  ]
};


function isToday(timestamp) {
  try {
    if (!timestamp) return false;
    


    const articleDate = new Date(timestamp);
    const today = new Date();
    
    return (
      articleDate.getDate() === today.getDate() &&
      articleDate.getMonth() === today.getMonth() &&
      articleDate.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error parsing date:', error);
    return false;
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function storeInWordPress(data) {
  if (!CONFIG.wpApiUrl) {
    console.log('WordPress API URL not configured. Skipping storage.');
    return true;
    
  }

  
  
  if (!isToday(data.timestamp)) {
    console.log('Skipping storage - article is not from today');
    return false;
  }

  try {
    const response = await axios.post(CONFIG.wpApiUrl, {
      Headline: data.headline,
      Fullarticle: data.content,
      Provider: data.provider || 'General',
      Symbol: data.symbol,
      date: data.timestamp || new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Stored in WordPress:', response.data);
    return true;
  } catch (error) {
    console.error('WP API Error:', error.response?.data || error.message);
    return false;
  }
}

async function getStockUrlsFromSheet() {
  const auth = new google.auth.JWT(
    GOOGLE_SHEET_CONFIG.serviceAccount.email,
    null,
    GOOGLE_SHEET_CONFIG.serviceAccount.privateKey.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_CONFIG.sheetId,
      range: `${GOOGLE_SHEET_CONFIG.sheetName}!1:1`,
    });

    const headers = headerResponse.data.values ? headerResponse.data.values[0] : [];
    if (headers.length === 0) {
      throw new Error('Could not read headers from the Google Sheet. Make sure the sheet is not empty.');
    }

    const scrapLinkColIndex = headers.indexOf('Scrap_Link');
    const symbolColIndex = headers.indexOf('Symbol');
    const stockNameColIndex = headers.indexOf('Stock name');

    if (scrapLinkColIndex === -1 || symbolColIndex === -1 || stockNameColIndex === -1) {
      throw new Error('Required columns (Scrap_Link, Symbol, Stock name) not found in the Google Sheet.');
    }

    const startCol = Math.min(symbolColIndex, stockNameColIndex, scrapLinkColIndex);
    const endCol = Math.max(symbolColIndex, stockNameColIndex, scrapLinkColIndex);
    const dataRange = `${GOOGLE_SHEET_CONFIG.sheetName}!${String.fromCharCode(65 + startCol)}:${String.fromCharCode(65 + endCol)}`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_CONFIG.sheetId,
      range: dataRange,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the Google Sheet.');
      return [];
    }

    const stockData = rows.slice(1).map(row => ({
      Symbol: row[symbolColIndex - startCol],
      "Stock name": row[stockNameColIndex - startCol],
      link: row[scrapLinkColIndex - startCol],
    })).filter(entry => entry.link);

    console.log(`Loaded ${stockData.length} stock URLs from Google Sheet.`);
    return stockData;

  } catch (error) {
    console.error('Error accessing Google Sheet:', error.message);
    if (error.code === 403) {
      console.error('Permission denied. Make sure the service account has read access to the Google Sheet.');
    }
    return [];
  }
}

async function trySelectors(page, selectors, extractor) {
  for (const selector of selectors) {
    try {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements using selector: ${selector}`);
        const results = [];
        for (const el of elements) {
          const result = await page.evaluate(extractor, el, SELECTOR_REGISTRY);
          if (result) results.push(result);
        }
        if (results.length > 0) return results;
      }
    } catch (error) {
      console.log(`Selector ${selector} failed: ${error.message}`);
    }
  }
  return [];
}

function extractArticleData(element, selectors) {
  
  let headline = null;
  for (const selector of selectors.headlineSelectors) {
    const el = element.querySelector(selector);
    if (el) {
      headline = el.getAttribute('data-overflow-tooltip-text') || 
                el.textContent?.trim();
      if (headline) break;
    }
  }

  if (!headline) return null;

 
  
  if (headline.toLowerCase().includes('sign in to read exclusive news')) {
    return null;
  }

  
  
  let provider = null;
  for (const selector of selectors.providerSelectors) {
    const el = element.querySelector(selector);
    if (el) {
      provider = el.textContent?.trim();
      if (provider) break;
    }
  }

  
  
  const link = element.href || element.closest('a')?.href;

  
  
  const timeEl = element.querySelector('time, [datetime]');
  const timestamp = timeEl?.getAttribute('datetime');
  
  
  
  if (!timestamp || !isToday(timestamp)) {
    return null;
  }

  
  
  const symbolImgs = element.querySelectorAll('img[src*=".svg"]');
  let cardSymbol = null;
  if (symbolImgs.length > 0) {
    const codes = Array.from(symbolImgs).map(img => {
      const src = img.src;
      const match = src.match(/\/([^\/]+)\.svg$/);
      return match ? match[1].replace(/-/g, '') : null;
    }).filter(Boolean);
    if (codes.length > 0) {
      cardSymbol = codes.join('');
    }
  }

  return {
    headline,
    provider,
    link,
    timestamp,
    symbol: cardSymbol
  };
}

async function extractArticleContent(page) {
  for (const selector of SELECTOR_REGISTRY.contentSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      const content = await page.$eval(selector, el => el.innerText.trim());
      if (content) {
       
        
        const restrictedPhrases = [
          'sign in to read exclusive news',
          'login or create a forever free account',
          'subscribe to read this article',
          'this article is reserved for our members'
        ];
        
        if (!restrictedPhrases.some(phrase => content.toLowerCase().includes(phrase))) {
          return content;
        }
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

async function scrapeTradingViewNews() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

  let stockUrls = [];
  try {
    stockUrls = await getStockUrlsFromSheet();
    if (stockUrls.length === 0) {
      console.log('No stock URLs found to process. Exiting.');
      await browser.close();
      return;
    }
  } catch (error) {
    console.error(`Failed to retrieve stock URLs from Google Sheet: ${error.message}`);
    await browser.close();
    return;
  }

  for (const stockEntry of stockUrls) {
    const stockName = stockEntry["Stock name"];
    const stockSymbol = stockEntry.Symbol;
    const stockLink = stockEntry.link;

    console.log(`\n--- Processing news for ${stockName} (${stockSymbol}) from ${stockLink} ---`);

    try {
      await page.goto(stockLink, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      console.log(`Successfully loaded news page for ${stockSymbol}.`);
    } catch (error) {
      console.error(`Failed to load news page for ${stockSymbol}: ${error.message}`);
      continue;
    }

    await autoScroll(page);
    await delay(2000);

    
    
    const articlesOnPage = await trySelectors(page, SELECTOR_REGISTRY.articleSelectors, extractArticleData);
    console.log(`Found ${articlesOnPage.length} articles from today on ${stockSymbol}'s news page.`);

    let articlesStoredForThisStock = 0;

    for (const [index, article] of articlesOnPage.entries()) {
      if (!article.link) {
        console.log(`Skipping article ${index + 1} with no link for ${stockSymbol}`);
        continue;
      }

      const articlePage = await browser.newPage();
      console.log(`Processing article ${index + 1}/${articlesOnPage.length} for ${stockSymbol}: "${article.headline}"`);

      try {
        await articlePage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
        await articlePage.goto(article.link, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });

        const content = await extractArticleContent(articlePage);
        if (!content) {
          console.log(`Could not extract content for article ${index + 1} for ${stockSymbol}`);
          continue;
        }

        const wpData = {
          headline: article.headline,
          content: content,
          symbol: article.symbol || stockSymbol,
          provider: article.provider,
          timestamp: article.timestamp
        };

        console.log('Data to be sent to WordPress:', {
          ...wpData,
          content: wpData.content.substring(0, 100) + '...' 
          
        });

        const stored = await storeInWordPress(wpData);
        if (stored) {
          articlesStoredForThisStock++;
          console.log(`Successfully stored article ${index + 1}/${articlesOnPage.length} for ${stockSymbol} in WordPress`);
        }

      } catch (error) {
        console.error(`Error processing article ${index + 1} for ${stockSymbol}: ${error.message}`);
      } finally {
        if (!articlePage.isClosed()) {
          await articlePage.close();
        }
      }
    }
    console.log(`Finished processing ${articlesStoredForThisStock} articles for ${stockSymbol}.`);
  }

  console.log('\n--- Scraping Complete ---');
  console.log(`Finished processing all stock URLs from Google Sheet.`);

  await browser.close();
  console.log('\nBrowser closed.');
}

scrapeTradingViewNews().catch(console.error);