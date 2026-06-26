// import 'dotenv/config';
import OpenAI from 'openai'
import { dates } from '/utils/dates'

const openai=new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const messages = [
    {
        role: 'system',
        content: 'Who will win the Football WorldCup in 26?'
    },
    {
        role: 'user',
        content: 'You are a helpful general knowledge expert.'
    },
]

// const footballDataApiKey = process.env.FOOTBALL_DATA_API_KEY;

// const tickersArr = []



const completion = await openai.completions.create({
    model: 'gpt-4',
    messages: messages
});
console.log(completion)
// const generateReportBtn = document.querySelector('.generate-report-btn')

// generateReportBtn.addEventListener('click', fetchStockData)

// document.getElementById('ticker-input-form').addEventListener('submit', (e) => {
//     e.preventDefault()
//     const tickerInput = document.getElementById('ticker-input')
//     if (tickerInput.value.length > 2) {
//         generateReportBtn.disabled = false
//         const newTickerStr = tickerInput.value
//         tickersArr.push(newTickerStr.toUpperCase())
//         tickerInput.value = ''
//         renderTickers()
//     } else {
//         const label = document.getElementsByTagName('label')[0]
//         label.style.color = 'red'
//         label.textContent = 'You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.'
//     }
// })

// function renderTickers() {
//     const tickersDiv = document.querySelector('.ticker-choice-display')
//     tickersDiv.innerHTML = ''
//     tickersArr.forEach((ticker) => {
//         const newTickerSpan = document.createElement('span')
//         newTickerSpan.textContent = ticker
//         newTickerSpan.classList.add('ticker')
//         tickersDiv.appendChild(newTickerSpan)
//     })
// }

// const loadingArea = document.querySelector('.loading-panel')
// const apiMessage = document.getElementById('api-message')

// async function fetchStockData() {
//     document.querySelector('.action-panel').style.display = 'none'
//     loadingArea.style.display = 'flex'
//     try {
//         const stockData = await Promise.all(tickersArr.map(async (ticker) => {
//             const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${process.env.POLYGON_API_KEY}`
//             const response = await fetch(url)
//             const data = await response.text()
//             const status = await response.status
//             if (status === 200) {
//                 apiMessage.innerText = 'Creating report...'
//                 return data
//             } else {
//                 loadingArea.innerText = 'There was an error fetching stock data.'
//             }
//         }))
//         fetchReport(stockData.join(''))
//     } catch(err) {
//         loadingArea.innerText = 'There was an error fetching stock data.'
//         console.error('error: ', err)
//     }
// }

// async function fetchReport(data) {
//     /** AI goes here **/
// }

// function renderReport(output) {
//     loadingArea.style.display = 'none'
//     const outputArea = document.querySelector('.output-panel')
//     const report = document.createElement('p')
//     outputArea.appendChild(report)
//     report.textContent = output
//     outputArea.style.display = 'flex'
// }