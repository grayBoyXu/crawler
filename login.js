async function login(page) {
    const loginUrl = 'http://ynjkq.qudache.cn/Admin/Public/login.html'; // 替换为实际的登录 URL
    const username = 'liuzhao'; // 替换为实际的用户名
    const password = '86135829'; // 替换为实际的密码

    await page.goto(loginUrl, { waitUntil: 'networkidle2' });

    await page.type('#account', username); // 替换为实际的用户名输入框选择器
    await page.type('#password', password); // 替换为实际的密码输入框选择器
    await page.click('.btn-primary'); // 替换为实际的登录按钮选择器
}
module.exports = login;