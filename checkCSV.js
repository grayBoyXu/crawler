const fs = require('fs');
const csv = require('csv-parser');

const filePath = '汽车票订单20000-30000.csv'; // 替换为你的 CSV 文件路径

let emptyRows = []; // 存储空行的行号
let previousValue = 6906624; // 初始化为最大值
let rowNumber = 0; // 记录当前行号

fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
        rowNumber++; // 增加行号
        // 检查当前行是否为空行
        if (Object.values(row).every(cell => cell.trim() === '')) {
            emptyRows.push(rowNumber);
        }
        // 获取第一列的值
        if (rowNumber === 2) {
            let currentValue = parseFloat(row['编号']);
            previousValue = previousValue - 1
            if (currentValue != previousValue) {
                console.log('currentValue:', currentValue, 'previousValue:', previousValue)
            }
        }
    })
    .on('end', () => {
        if (emptyRows.length > 0) {
            console.log('存在空行，行号为:', emptyRows);
        } else {
            console.log('没有发现空行');
        }
        console.log('CSV file processed successfully');
    })
    .on('error', (err) => {
        console.error(`Error processing CSV file: ${err}`);
    });