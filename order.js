const login = require('./login');
const puppeteer = require('puppeteer');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

const recordsPerFile = 10;
const maxPage = 199;
let allRecords = [];
let pageNum
let startNum
const csvFilePath = path.join(__dirname, '退票管理2024-12(01-18).csv');
const progressFilePath = path.join(__dirname, 'data.json');
let csvWriter
async function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function updateProgress(num) {
    const data = fs.readFileSync(progressFilePath) || '{}';
    const progress = JSON.parse(data);
    progress.orderNum = num;
    fs.writeFileSync(progressFilePath, JSON.stringify(progress, null, 2));
}
// 获取已记录的进度
function getProgress() {
    if (fs.existsSync(progressFilePath)) {
        const data = fs.readFileSync(progressFilePath);
        return JSON.parse(data).orderNum || 1;
    }
    return 1;
}
const saveData = async () => {
    if (csvWriter) {
        await csvWriter.writeRecords(allRecords);
    }
};

const handleExit = async () => {
    try {
        await saveData();
        console.log('程序已退出');

        updateProgress(pageNum)
        if (browser) {
            await browser.close();
        }
        process.exit();
    } catch (error) {
        console.error('Error during exit:', error.message);
    }

};

// 处理不同的终止信号
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
async function processPage(page, pageNum) {
    const url = `http://ynjkq.qudache.cn/Admin/TicketRefund/index/create_time_1/2024-12-01+00%3A00%3A00/create_time_2/2024-12-18+23%3A59%3A59/p/${pageNum}.html`;
    // console.log(`正在抓取 ${pageNum}`);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('table', { timeout: 60000 });
        const tableData = await page.evaluate(() => {
            const headers = Array.from(document.querySelectorAll('table thead th')).map(th => th.textContent.trim());
            const rows = Array.from(document.querySelectorAll('table tbody tr')).map(tr => {
                return Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
            });
            return { headers, rows };
        });
        if (pageNum === startNum) {
            csvWriter = createObjectCsvWriter({
                path: csvFilePath,
                header: tableData.headers.map(header => ({ id: header, title: header })),
                append: true
            });
        }

        const records = tableData.rows.map(row => {
            const record = {};
            tableData.headers.forEach((header, index) => {
                record[header] = row[index] || '';
            });
            return record;
        });

        allRecords.push(...records);
        if (pageNum % recordsPerFile === 0 || pageNum == maxPage) {
            if (csvWriter) {
                await csvWriter.writeRecords(allRecords);
            }
            await waitFor(10);
            console.log(`已写入文件 ${pageNum}`);
            allRecords = [];
        }
    } catch (error) {
        console.error(`处理页面 ${pageNum} 时出错: ${error.message}`);
        updateProgress(pageNum)
        if (csvWriter) {
            await csvWriter.writeRecords(allRecords);
            console.log(`已写入文件 ${pageNum}`);
        }
        allRecords = [];
        throw error; // 重新抛出错误以便外部捕获
    }
}

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await login(page);
        await waitFor(3000);
        console.log('开始抓取数据...');
        startNum = getProgress()
        pageNum = startNum
        for (pageNum; pageNum <= maxPage; pageNum++) {
            await processPage(page, pageNum);
        }
    } catch (error) {
        console.error(`抓取过程中出错: ${error.message}`);
        if (csvWriter) {
            await csvWriter.writeRecords(allRecords);
        }
    } finally {
        updateProgress(pageNum)
        await browser.close();
    }
})();

