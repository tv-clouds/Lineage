const axios = require('axios');
const fs = require('fs');

const servers = [
    { name: "太陽神阿波羅", url: "https://www.dd373.com/s-q0kacj-khkbh6-jkf6hn.html?qufu=true" },
    { name: "收獲女神蒂蜜特", url: "https://www.dd373.com/s-q0kacj-khkbh6-h6s7hd.html?qufu=true" },
    { name: "勝利女神雅典娜", url: "https://www.dd373.com/s-q0kacj-khkbh6-tmmbgw.html?qufu=true" },
    { name: "戰神馬爾斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-11w878.html?qufu=true" },
    { name: "泰坦女神瑞亞", url: "https://www.dd373.com/s-q0kacj-khkbh6-a9hjb6.html?qufu=true" },
    { name: "水蛇許德拉", url: "https://www.dd373.com/s-q0kacj-khkbh6-mqnn8g.html?qufu=true" },
    { name: "蛇髮女墨杜沙", url: "https://www.dd373.com/s-q0kacj-khkbh6-f8kbht.html?qufu=true" },
    { name: "美神維納斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-sksdr8.html?qufu=true" },
    { name: "月亮女神阿緹蜜斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-3wfqbb.html?qufu=true" },
    { name: "冥王黑帝斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-tx17vd.html?qufu=true" },
    { name: "半人馬涅索斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-8vfqka.html?qufu=true" },
    { name: "天神宙斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-s9gju1.html?qufu=true" },
    { name: "海神波塞頓", url: "https://www.dd373.com/s-q0kacj-khkbh6-6n4mk7.html?qufu=true" },
    { name: "火神赫發斯特斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-5wmdmv.html?qufu=true" },
    { name: "愛神邱比特", url: "https://www.dd373.com/s-q0kacj-khkbh6-7ge16s.html?qufu=true" },
    { name: "天后海拉", url: "https://www.dd373.com/s-q0kacj-khkbh6-r72q3v.html?qufu=true" },
    { name: "牛人彌諾陶洛斯", url: "https://www.dd373.com/s-q0kacj-khkbh6-8k682m.html?qufu=true" }
];

async function fetchAllPrices() {
    const historyFile = 'history.json';
    const dataFile = 'data.json';
    let historyData = [];

    // 1. 读取历史
    if (fs.existsSync(historyFile)) {
        try {
            historyData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        } catch (e) { historyData = []; }
    }

    const lastBatch = historyData.length > 0 ? historyData[historyData.length - 1].data : [];
    const currentBatch = {
        time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        data: []
    };

    // 2. 循环抓取
    for (const server of servers) {
        try {
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
            const res = await axios.get(server.url, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://www.dd373.com/' 
                },
                timeout: 15000
            });

            const html = res.data;
            let buy = "N/A";
            let sell = "N/A";

            // 抓取逻辑
            const buyDirect = html.match(/1[万萬]金\s*=\s*([\d.]+)\s*元/);
            const buyExchange = html.match(/1元\s*=\s*([\d.]+)\s*[万萬]金/);

            if (buyDirect && parseFloat(buyDirect[1]) < 25) {
                buy = parseFloat(buyDirect[1]).toFixed(4);
            } else if (buyExchange) {
                const rate = parseFloat(buyExchange[1]);
                if (rate > 0) buy = (1 / rate).toFixed(4);
            }

            if (html.includes('商家入驻平台收货显示此区域') || html.includes('receve-swiper')) {
                const sellDirect = html.match(/([\d.]+)\s*元\s*\/[万萬]金/);
                const receiveSection = html.match(/id="receve-swiper"[\s\S]*?1元\s*=\s*([\d.]+)\s*[万萬]金/);

                if (sellDirect && parseFloat(sellDirect[1]) < 25) {
                    sell = parseFloat(sellDirect[1]).toFixed(4);
                } else if (receiveSection) {
                    const rate = parseFloat(receiveSection[1]);
                    if (rate > 0) sell = (1 / rate).toFixed(4);
                }
            }

            // 数据校验与继承
            const prev = lastBatch.find(s => s.server === server.name);
            if (buy !== "N/A" && parseFloat(buy) > 25) buy = prev ? prev.buy : "N/A";
            if (sell !== "N/A" && parseFloat(sell) > 25) sell = prev ? prev.sell : "N/A";
            if (buy === "N/A" && prev) buy = prev.buy;
            if (sell === "N/A" && prev) sell = prev.sell;

            currentBatch.data.push({ server: server.name, buy, sell });
            console.log(`[${server.name}] Buy: ${buy}, Sell: ${sell}`);

        } catch (e) {
            console.error(`Error ${server.name}:`, e.message);
            const prev = lastBatch.find(s => s.server === server.name);
            currentBatch.data.push(prev || { server: server.name, buy: "N/A", sell: "N/A" });
        }
    }

    // 3. 保存结果
    historyData.push(currentBatch);
    if (historyData.length > 300) historyData.shift(); 

    fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2));
    fs.writeFileSync(dataFile, JSON.stringify(currentBatch, null, 2));
    console.log("更新完成！");
}

fetchAllPrices();
