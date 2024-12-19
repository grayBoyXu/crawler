const fs = require('fs');
const csv = require('csv-parser');

const filePath = '平安保险明细.csv'; // 替换为你的CSV文件路径
const valueColumn = '编号'; // 替换为你的值列名

let lastValue = 1171407; // 初始值设为正无穷大
let hasErrors = false;
let num = 0
fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    const value = row[valueColumn];

    if (value === undefined || value === '') {
      hasErrors = true;
      console.log('Empty value found:', row, num);
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      hasErrors = true;
      console.log('Non-numeric value found:', row, num);
      return;
    }

    if (numericValue === lastValue) {
      hasErrors = true;
      // console.log('Values are not in descending order:', row);
    }

    lastValue = numericValue - 1;
    num = num + 1
  })
  .on('end', () => {
    if (!hasErrors) {
      console.log('All values are in descending order and there are no empty values.');
    }
  });
